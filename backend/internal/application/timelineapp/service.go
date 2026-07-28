package timelineapp

import (
	"context"
	"strings"

	"github.com/example/countryhouse/backend/internal/domain/plot"
	"github.com/example/countryhouse/backend/internal/domain/timeline"
)

type Service struct {
	repo  timeline.Repository
	plots plot.Repository
}

func New(repo timeline.Repository, plots plot.Repository) *Service {
	return &Service{repo: repo, plots: plots}
}

func (s *Service) Create(ctx context.Context, task timeline.Task) (timeline.Task, error) {
	current, err := s.plots.GetCurrent(ctx)
	if err != nil {
		return timeline.Task{}, err
	}
	task.PlotID = current.ID
	task.Currency = strings.ToUpper(task.Currency)
	if task.Currency == "" {
		task.Currency = "RUB"
	}
	if err := timeline.Validate(task); err != nil {
		return timeline.Task{}, err
	}
	return s.repo.Create(ctx, task)
}

func (s *Service) List(ctx context.Context) ([]timeline.Task, error) {
	current, err := s.plots.GetCurrent(ctx)
	if err != nil {
		return nil, err
	}
	return s.repo.List(ctx, current.ID)
}
