package buildingapp

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/example/countryhouse/backend/internal/domain/building"
	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/plot"
)

type Service struct {
	repo  building.Repository
	plots plot.Repository
}

func New(repo building.Repository, plots plot.Repository) *Service {
	return &Service{repo: repo, plots: plots}
}

func (s *Service) Get(ctx context.Context, ownerID, plotID, objectID string) (building.Building, error) {
	return s.repo.GetBuilding(ctx, ownerID, plotID, objectID)
}

func (s *Service) Save(ctx context.Context, ownerID, plotID, objectID string, value building.Building) (building.Building, error) {
	value.PlotObjectID = objectID
	if len(value.Properties) == 0 {
		value.Properties = json.RawMessage(`{}`)
	}
	if err := building.ValidateConfig(value); err != nil {
		return building.Building{}, err
	}
	return s.repo.UpsertBuilding(ctx, ownerID, plotID, value)
}

func (s *Service) AddFloor(ctx context.Context, ownerID, plotID, objectID string, value building.Floor) (building.Floor, error) {
	value.BuildingID = objectID
	value.Name = strings.TrimSpace(value.Name)
	if err := building.ValidateFloor(value); err != nil {
		return building.Floor{}, err
	}
	return s.repo.AddBuildingFloor(ctx, ownerID, plotID, value)
}

func (s *Service) UpdateFloor(ctx context.Context, ownerID, plotID, objectID string, value building.Floor) (building.Floor, error) {
	if err := s.requireFloor(ctx, ownerID, plotID, objectID, value.ID); err != nil {
		return building.Floor{}, err
	}
	value.Name = strings.TrimSpace(value.Name)
	if err := building.ValidateFloor(value); err != nil {
		return building.Floor{}, err
	}
	return s.repo.UpdateBuildingFloor(ctx, ownerID, plotID, value)
}

func (s *Service) DeleteFloor(ctx context.Context, ownerID, plotID, objectID, floorID string) error {
	if err := s.requireFloor(ctx, ownerID, plotID, objectID, floorID); err != nil {
		return err
	}
	return s.repo.DeleteBuildingFloor(ctx, ownerID, plotID, floorID)
}

func (s *Service) AddElement(ctx context.Context, ownerID, plotID, objectID, floorID string, value building.Element) (building.Element, error) {
	return s.saveElement(ctx, ownerID, plotID, objectID, floorID, value, false)
}

func (s *Service) UpdateElement(ctx context.Context, ownerID, plotID, objectID, floorID string, value building.Element) (building.Element, error) {
	return s.saveElement(ctx, ownerID, plotID, objectID, floorID, value, true)
}

func (s *Service) saveElement(ctx context.Context, ownerID, plotID, objectID, floorID string, value building.Element, update bool) (building.Element, error) {
	if err := s.requireFloor(ctx, ownerID, plotID, objectID, floorID); err != nil {
		return building.Element{}, err
	}
	object, err := s.plots.GetObject(ctx, ownerID, plotID, objectID)
	if err != nil {
		return building.Element{}, err
	}
	value.Name = strings.TrimSpace(value.Name)
	value.FloorID = floorID
	if value.Geometry == "" {
		value.Geometry = plot.Footprint
	}
	if value.Points == nil {
		value.Points = []plot.Point{}
	}
	if len(value.Properties) == 0 {
		value.Properties = json.RawMessage(`{}`)
	}
	if err := building.ValidateElement(value, object.Width, object.Length); err != nil {
		return building.Element{}, err
	}
	if update {
		return s.repo.UpdateFloorElement(ctx, ownerID, plotID, floorID, value)
	}
	return s.repo.AddFloorElement(ctx, ownerID, plotID, floorID, value)
}

func (s *Service) DeleteElement(ctx context.Context, ownerID, plotID, objectID, floorID, elementID string) error {
	if err := s.requireFloor(ctx, ownerID, plotID, objectID, floorID); err != nil {
		return err
	}
	return s.repo.DeleteFloorElement(ctx, ownerID, plotID, floorID, elementID)
}

func (s *Service) requireFloor(ctx context.Context, ownerID, plotID, objectID, floorID string) error {
	value, err := s.repo.GetBuilding(ctx, ownerID, plotID, objectID)
	if err != nil {
		return err
	}
	for _, floor := range value.Floors {
		if floor.ID == floorID {
			return nil
		}
	}
	return domainerr.New(domainerr.NotFound, "floor not found")
}
