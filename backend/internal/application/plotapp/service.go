package plotapp

import (
	"context"

	"github.com/example/countryhouse/backend/internal/domain/plot"
)

type Service struct{ repo plot.Repository }

func New(repo plot.Repository) *Service { return &Service{repo: repo} }

func (s *Service) Create(ctx context.Context, width, length float64) (plot.Plot, error) {
	if err := plot.ValidateDimensions(width, length); err != nil {
		return plot.Plot{}, err
	}
	return s.repo.Create(ctx, width, length)
}

func (s *Service) Get(ctx context.Context) (plot.Plot, error) {
	return s.repo.GetCurrent(ctx)
}

func (s *Service) AddObject(ctx context.Context, object plot.Object) (plot.Object, error) {
	current, err := s.repo.GetCurrent(ctx)
	if err != nil {
		return plot.Object{}, err
	}
	object.PlotID = current.ID
	if err := plot.ValidateObject(current, object); err != nil {
		return plot.Object{}, err
	}
	return s.repo.AddObject(ctx, object)
}
