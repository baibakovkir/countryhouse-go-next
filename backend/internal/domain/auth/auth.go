package auth

import (
	"context"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
)

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}

type Credentials struct {
	User
	PasswordHash string
}

type Repository interface {
	CreateUser(context.Context, string, string) (User, error)
	FindUserByEmail(context.Context, string) (Credentials, error)
	CreateSession(context.Context, string, string, time.Time) error
	FindUserBySession(context.Context, string, time.Time) (User, error)
	DeleteSession(context.Context, string) error
}

func NormalizeEmail(value string) string { return strings.ToLower(strings.TrimSpace(value)) }

func ValidateEmail(value string) error {
	if len(value) > 254 {
		return domainerr.Field("email", "must be at most 254 characters")
	}
	parsed, err := mail.ParseAddress(value)
	if err != nil || parsed.Address != value || !strings.Contains(value, "@") {
		return domainerr.Field("email", "must be a valid email address")
	}
	return nil
}

func ValidatePassword(value string) error {
	if utf8.RuneCountInString(value) < 12 {
		return domainerr.Field("password", "must contain at least 12 characters")
	}
	if len([]byte(value)) > 72 {
		return domainerr.Field("password", "must be at most 72 bytes")
	}
	return nil
}
