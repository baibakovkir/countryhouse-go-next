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

func (s *Service) prepare(ctx context.Context, ownerID, plotID string, item expense.Expense) (expense.Expense, error) {
	current, err := s.plots.Get(ctx, ownerID, plotID)
	if err != nil {
		return expense.Expense{}, err
	}
	item.PlotID = current.ID
	item.Category = strings.TrimSpace(item.Category)
	item.Currency = strings.ToUpper(strings.TrimSpace(item.Currency))
	if item.Currency == "" {
		item.Currency = "RUB"
	}
	if err := expense.Validate(item); err != nil {
		return expense.Expense{}, err
	}
	if item.PlotObjectID != nil {
		if _, err := s.plots.GetObject(ctx, ownerID, plotID, *item.PlotObjectID); err != nil {
			return expense.Expense{}, domainerr.Field("plotObjectId", "object does not belong to this plot")
		}
	}
	return item, nil
}

func (s *Service) Create(ctx context.Context, ownerID, plotID string, item expense.Expense) (expense.Expense, error) {
	item, err := s.prepare(ctx, ownerID, plotID, item)
	if err != nil {
		return expense.Expense{}, err
	}
	return s.repo.Create(ctx, ownerID, item)
}
func (s *Service) List(ctx context.Context, ownerID, plotID string) ([]expense.Expense, error) {
	if _, err := s.plots.Get(ctx, ownerID, plotID); err != nil {
		return nil, err
	}
	return s.repo.List(ctx, ownerID, plotID)
}
func (s *Service) Get(ctx context.Context, ownerID, plotID, id string) (expense.Expense, error) {
	return s.repo.Get(ctx, ownerID, plotID, id)
}
func (s *Service) Update(ctx context.Context, ownerID, plotID, id string, mutate func(*expense.Expense)) (expense.Expense, error) {
	item, err := s.repo.Get(ctx, ownerID, plotID, id)
	if err != nil {
		return expense.Expense{}, err
	}
	mutate(&item)
	item, err = s.prepare(ctx, ownerID, plotID, item)
	if err != nil {
		return expense.Expense{}, err
	}
	return s.repo.Update(ctx, ownerID, item)
}
func (s *Service) Delete(ctx context.Context, ownerID, plotID, id string) error {
	return s.repo.Delete(ctx, ownerID, plotID, id)
}
