package plotapp

import (
	"context"
	"strings"

	"github.com/example/countryhouse/backend/internal/domain/plot"
)

type Service struct{ repo plot.Repository }

func New(repo plot.Repository) *Service { return &Service{repo: repo} }

func (s *Service) Create(ctx context.Context, ownerID, name string, width, length float64) (plot.Plot, error) {
	name = strings.TrimSpace(name)
	if err := plot.ValidateName(name); err != nil {
		return plot.Plot{}, err
	}
	if err := plot.ValidateDimensions(width, length); err != nil {
		return plot.Plot{}, err
	}
	return s.repo.Create(ctx, plot.Plot{OwnerID: ownerID, Name: name, Width: width, Length: length, Objects: []plot.Object{}})
}

func (s *Service) List(ctx context.Context, ownerID string) ([]plot.Plot, error) {
	return s.repo.List(ctx, ownerID)
}

func (s *Service) Get(ctx context.Context, ownerID, plotID string) (plot.Plot, error) {
	return s.repo.Get(ctx, ownerID, plotID)
}

func (s *Service) Update(ctx context.Context, ownerID, plotID string, name *string, width, length *float64) (plot.Plot, error) {
	current, err := s.repo.Get(ctx, ownerID, plotID)
	if err != nil {
		return plot.Plot{}, err
	}
	if name != nil {
		current.Name = strings.TrimSpace(*name)
	}
	if width != nil {
		current.Width = *width
	}
	if length != nil {
		current.Length = *length
	}
	if err := plot.ValidateName(current.Name); err != nil {
		return plot.Plot{}, err
	}
	if err := plot.ValidateDimensions(current.Width, current.Length); err != nil {
		return plot.Plot{}, err
	}
	for _, object := range current.Objects {
		if err := plot.ValidateObject(current, object); err != nil {
			return plot.Plot{}, err
		}
	}
	return s.repo.Update(ctx, current)
}

func (s *Service) Delete(ctx context.Context, ownerID, plotID string) error {
	return s.repo.Delete(ctx, ownerID, plotID)
}

func (s *Service) AddObject(ctx context.Context, ownerID, plotID string, object plot.Object) (plot.Object, error) {
	current, err := s.repo.Get(ctx, ownerID, plotID)
	if err != nil {
		return plot.Object{}, err
	}
	object.PlotID = current.ID
	object.Name = strings.TrimSpace(object.Name)
	if err := plot.ValidateObject(current, object); err != nil {
		return plot.Object{}, err
	}
	return s.repo.AddObject(ctx, ownerID, object)
}

func (s *Service) ListObjects(ctx context.Context, ownerID, plotID string) ([]plot.Object, error) {
	current, err := s.repo.Get(ctx, ownerID, plotID)
	if err != nil {
		return nil, err
	}
	return current.Objects, nil
}

func (s *Service) GetObject(ctx context.Context, ownerID, plotID, objectID string) (plot.Object, error) {
	return s.repo.GetObject(ctx, ownerID, plotID, objectID)
}

func (s *Service) UpdateObject(ctx context.Context, ownerID, plotID, objectID string, mutate func(*plot.Object)) (plot.Object, error) {
	current, err := s.repo.Get(ctx, ownerID, plotID)
	if err != nil {
		return plot.Object{}, err
	}
	object, err := s.repo.GetObject(ctx, ownerID, plotID, objectID)
	if err != nil {
		return plot.Object{}, err
	}
	mutate(&object)
	object.Name = strings.TrimSpace(object.Name)
	if err := plot.ValidateObject(current, object); err != nil {
		return plot.Object{}, err
	}
	return s.repo.UpdateObject(ctx, ownerID, object)
}

func (s *Service) DeleteObject(ctx context.Context, ownerID, plotID, objectID string) error {
	return s.repo.DeleteObject(ctx, ownerID, plotID, objectID)
}
