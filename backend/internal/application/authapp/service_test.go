package authapp

import (
	"context"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	domainauth "github.com/example/countryhouse/backend/internal/domain/auth"
	"github.com/example/countryhouse/backend/internal/domain/domainerr"
)

type fakeRepository struct {
	user      domainauth.Credentials
	tokenHash string
	expires   time.Time
	deleted   string
}

func (f *fakeRepository) CreateUser(_ context.Context, email, hash string) (domainauth.User, error) {
	f.user = domainauth.Credentials{User: domainauth.User{ID: "user-1", Email: email, CreatedAt: time.Now()}, PasswordHash: hash}
	return f.user.User, nil
}
func (f *fakeRepository) FindUserByEmail(_ context.Context, email string) (domainauth.Credentials, error) {
	if f.user.Email != email {
		return domainauth.Credentials{}, domainerr.New(domainerr.NotFound, "user not found")
	}
	return f.user, nil
}
func (f *fakeRepository) CreateSession(_ context.Context, _ string, hash string, expires time.Time) error {
	f.tokenHash = hash
	f.expires = expires
	return nil
}
func (f *fakeRepository) FindUserBySession(_ context.Context, hash string, now time.Time) (domainauth.User, error) {
	if hash != f.tokenHash || !f.expires.After(now) {
		return domainauth.User{}, domainerr.New(domainerr.NotFound, "session not found")
	}
	return f.user.User, nil
}
func (f *fakeRepository) DeleteSession(_ context.Context, hash string) error {
	f.deleted = hash
	return nil
}

func TestRegisterAuthenticateAndLogout(t *testing.T) {
	repo := &fakeRepository{}
	service := New(repo)
	result, err := service.Register(context.Background(), " OWNER@example.com ", "correct horse battery staple")
	if err != nil {
		t.Fatal(err)
	}
	if result.User.Email != "owner@example.com" {
		t.Fatalf("email = %q", result.User.Email)
	}
	if result.Token == "" || repo.tokenHash == result.Token {
		t.Fatal("session token was empty or stored without hashing")
	}
	if bcrypt.CompareHashAndPassword([]byte(repo.user.PasswordHash), []byte("correct horse battery staple")) != nil {
		t.Fatal("password was not hashed")
	}
	user, err := service.Authenticate(context.Background(), result.Token)
	if err != nil || user.ID != "user-1" {
		t.Fatalf("Authenticate() = %#v, %v", user, err)
	}
	if err := service.Logout(context.Background(), result.Token); err != nil || repo.deleted != repo.tokenHash {
		t.Fatalf("Logout() error = %v", err)
	}
}

func TestLoginUsesGenericUnauthorizedError(t *testing.T) {
	repo := &fakeRepository{}
	service := New(repo)
	_, err := service.Login(context.Background(), "missing@example.com", "some password")
	typed, ok := err.(*domainerr.Error)
	if !ok || typed.Kind != domainerr.Unauthorized {
		t.Fatalf("Login() error = %#v", err)
	}
}
