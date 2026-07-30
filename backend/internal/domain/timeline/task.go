package timeline

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/money"
)

var currencyPattern = regexp.MustCompile(`^[A-Z]{3}$`)

type Task struct {
	ID            string        `json:"id"`
	PlotID        string        `json:"-"`
	Title         string        `json:"title"`
	DueDate       time.Time     `json:"-"`
	PlannedBudget *money.Amount `json:"plannedBudget"`
	Currency      string        `json:"currency"`
	Description   string        `json:"description"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
}

type Repository interface {
	Create(context.Context, string, Task) (Task, error)
	List(context.Context, string, string) ([]Task, error)
	Get(context.Context, string, string, string) (Task, error)
	Update(context.Context, string, Task) (Task, error)
	Delete(context.Context, string, string, string) error
}

func Validate(t Task) error {
	if strings.TrimSpace(t.Title) == "" {
		return domainerr.Field("title", "is required")
	}
	if t.DueDate.IsZero() {
		return domainerr.Field("dueDate", "is required")
	}
	if !currencyPattern.MatchString(t.Currency) {
		return domainerr.Field("currency", "must be a three-letter ISO code")
	}
	return nil
}
