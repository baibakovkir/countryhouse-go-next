package authapp

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"

	domainauth "github.com/example/countryhouse/backend/internal/domain/auth"
	"github.com/example/countryhouse/backend/internal/domain/domainerr"
)

const SessionDuration = 7 * 24 * time.Hour

type Service struct {
	repo domainauth.Repository
	now  func() time.Time
}

type Result struct {
	User      domainauth.User
	Token     string
	ExpiresAt time.Time
}

func New(repo domainauth.Repository) *Service { return &Service{repo: repo, now: time.Now} }

func (s *Service) Register(ctx context.Context, email, password string) (Result, error) {
	email = domainauth.NormalizeEmail(email)
	if err := domainauth.ValidateEmail(email); err != nil {
		return Result{}, err
	}
	if err := domainauth.ValidatePassword(password); err != nil {
		return Result{}, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return Result{}, &domainerr.Error{Kind: domainerr.Internal, Message: "could not secure password", Err: err}
	}
	user, err := s.repo.CreateUser(ctx, email, string(hash))
	if err != nil {
		return Result{}, err
	}
	return s.newSession(ctx, user)
}

func (s *Service) Login(ctx context.Context, email, password string) (Result, error) {
	credentials, err := s.repo.FindUserByEmail(ctx, domainauth.NormalizeEmail(email))
	if err != nil || bcrypt.CompareHashAndPassword([]byte(credentials.PasswordHash), []byte(password)) != nil {
		if err != nil {
			var typed *domainerr.Error
			if !errors.As(err, &typed) || typed.Kind != domainerr.NotFound {
				return Result{}, err
			}
		}
		return Result{}, domainerr.New(domainerr.Unauthorized, "invalid email or password")
	}
	return s.newSession(ctx, credentials.User)
}

func (s *Service) Authenticate(ctx context.Context, token string) (domainauth.User, error) {
	if token == "" {
		return domainauth.User{}, domainerr.New(domainerr.Unauthorized, "authentication required")
	}
	user, err := s.repo.FindUserBySession(ctx, hashToken(token), s.now())
	if err != nil {
		var typed *domainerr.Error
		if errors.As(err, &typed) && typed.Kind == domainerr.NotFound {
			return domainauth.User{}, domainerr.New(domainerr.Unauthorized, "authentication required")
		}
		return domainauth.User{}, err
	}
	return user, nil
}

func (s *Service) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	return s.repo.DeleteSession(ctx, hashToken(token))
}

func (s *Service) newSession(ctx context.Context, user domainauth.User) (Result, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return Result{}, &domainerr.Error{Kind: domainerr.Internal, Message: "could not create session", Err: err}
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	expires := s.now().Add(SessionDuration)
	if err := s.repo.CreateSession(ctx, user.ID, hashToken(token), expires); err != nil {
		return Result{}, err
	}
	return Result{User: user, Token: token, ExpiresAt: expires}, nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
