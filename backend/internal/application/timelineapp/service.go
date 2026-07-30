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

func (s *Service) prepare(ctx context.Context, ownerID, plotID string, task timeline.Task) (timeline.Task, error) {
	current, err := s.plots.Get(ctx, ownerID, plotID)
	if err != nil {
		return timeline.Task{}, err
	}
	task.PlotID = current.ID
	task.Title = strings.TrimSpace(task.Title)
	task.Currency = strings.ToUpper(strings.TrimSpace(task.Currency))
	if task.Currency == "" {
		task.Currency = "RUB"
	}
	if err := timeline.Validate(task); err != nil {
		return timeline.Task{}, err
	}
	return task, nil
}
func (s *Service) Create(ctx context.Context, ownerID, plotID string, task timeline.Task) (timeline.Task, error) {
	task, err := s.prepare(ctx, ownerID, plotID, task)
	if err != nil {
		return timeline.Task{}, err
	}
	return s.repo.Create(ctx, ownerID, task)
}
func (s *Service) List(ctx context.Context, ownerID, plotID string) ([]timeline.Task, error) {
	if _, err := s.plots.Get(ctx, ownerID, plotID); err != nil {
		return nil, err
	}
	return s.repo.List(ctx, ownerID, plotID)
}
func (s *Service) Get(ctx context.Context, ownerID, plotID, id string) (timeline.Task, error) {
	return s.repo.Get(ctx, ownerID, plotID, id)
}
func (s *Service) Update(ctx context.Context, ownerID, plotID, id string, mutate func(*timeline.Task)) (timeline.Task, error) {
	task, err := s.repo.Get(ctx, ownerID, plotID, id)
	if err != nil {
		return timeline.Task{}, err
	}
	mutate(&task)
	task, err = s.prepare(ctx, ownerID, plotID, task)
	if err != nil {
		return timeline.Task{}, err
	}
	return s.repo.Update(ctx, ownerID, task)
}
func (s *Service) Delete(ctx context.Context, ownerID, plotID, id string) error {
	return s.repo.Delete(ctx, ownerID, plotID, id)
}
