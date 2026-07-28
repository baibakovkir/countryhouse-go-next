package expenseapp

import (
	"context"
	"strings"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/expense"
	"github.com/example/countryhouse/backend/internal/domain/plot"
)

type Service struct {
	repo  expense.Repository
	plots plot.Repository
}

func New(repo expense.Repository, plots plot.Repository) *Service {
	return &Service{repo: repo, plots: plots}
}

func (s *Service) Create(ctx context.Context, item expense.Expense) (expense.Expense, error) {
	current, err := s.plots.GetCurrent(ctx)
	if err != nil {
		return expense.Expense{}, err
	}
	item.PlotID = current.ID
	item.Currency = strings.ToUpper(item.Currency)
	if item.Currency == "" {
		item.Currency = "RUB"
	}
	if err := expense.Validate(item); err != nil {
		return expense.Expense{}, err
	}
	if item.PlotObjectID != nil {
		exists, err := s.plots.ObjectExists(ctx, current.ID, *item.PlotObjectID)
		if err != nil {
			return expense.Expense{}, err
		}
		if !exists {
			return expense.Expense{}, domainerr.Field("plotObjectId", "object does not belong to current plot")
		}
	}
	return s.repo.Create(ctx, item)
}

func (s *Service) List(ctx context.Context) ([]expense.Expense, error) {
	current, err := s.plots.GetCurrent(ctx)
	if err != nil {
		return nil, err
	}
	return s.repo.List(ctx, current.ID)
}
