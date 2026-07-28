package expense

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/money"
)

var currencyPattern = regexp.MustCompile(`^[A-Z]{3}$`)

type Expense struct {
	ID           string       `json:"id"`
	PlotID       string       `json:"-"`
	PlotObjectID *string      `json:"plotObjectId"`
	Category     string       `json:"category"`
	Amount       money.Amount `json:"amount"`
	Currency     string       `json:"currency"`
	Date         time.Time    `json:"-"`
	Description  string       `json:"description"`
	CreatedAt    time.Time    `json:"createdAt"`
}

type Repository interface {
	Create(context.Context, Expense) (Expense, error)
	List(context.Context, string) ([]Expense, error)
}

func Validate(e Expense) error {
	if strings.TrimSpace(e.Category) == "" {
		return domainerr.Field("category", "is required")
	}
	if !currencyPattern.MatchString(e.Currency) {
		return domainerr.Field("currency", "must be a three-letter ISO code")
	}
	if e.Date.IsZero() {
		return domainerr.Field("date", "is required")
	}
	return nil
}
