package building

import (
	"context"
	"encoding/json"
	"math"
	"strings"
	"time"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/plot"
)

type Kind string
type RoofType string
type WallMaterial string
type ElementCategory string

const (
	House          Kind         = "house"
	Garage         Kind         = "garage"
	Bathhouse      Kind         = "bathhouse"
	Outbuilding    Kind         = "outbuilding"
	Custom         Kind         = "custom"
	Gable          RoofType     = "gable"
	Hip            RoofType     = "hip"
	Flat           RoofType     = "flat"
	Shed           RoofType     = "shed"
	Wood           WallMaterial = "wood"
	Brick          WallMaterial = "brick"
	Block          WallMaterial = "block"
	Siding         WallMaterial = "siding"
	CustomMaterial WallMaterial = "custom"
)

type Building struct {
	PlotObjectID string          `json:"plotObjectId"`
	Kind         Kind            `json:"kind"`
	RoofType     RoofType        `json:"roofType"`
	WallMaterial WallMaterial    `json:"wallMaterial"`
	Properties   json.RawMessage `json:"properties"`
	Floors       []Floor         `json:"floors"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

type Floor struct {
	ID         string    `json:"id"`
	BuildingID string    `json:"buildingId"`
	Level      int       `json:"level"`
	Name       string    `json:"name"`
	Height     float64   `json:"height"`
	Elements   []Element `json:"elements"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type Element struct {
	ID         string            `json:"id"`
	FloorID    string            `json:"floorId"`
	CatalogKey string            `json:"catalogKey"`
	Category   ElementCategory   `json:"category"`
	Name       string            `json:"name"`
	X          float64           `json:"x"`
	Y          float64           `json:"y"`
	Width      float64           `json:"width"`
	Length     float64           `json:"length"`
	Height     float64           `json:"height"`
	Rotation   float64           `json:"rotation"`
	Geometry   plot.GeometryType `json:"geometry"`
	Points     []plot.Point      `json:"points"`
	Properties json.RawMessage   `json:"properties"`
	CreatedAt  time.Time         `json:"createdAt"`
	UpdatedAt  time.Time         `json:"updatedAt"`
}

type Repository interface {
	GetBuilding(context.Context, string, string, string) (Building, error)
	UpsertBuilding(context.Context, string, string, Building) (Building, error)
	AddBuildingFloor(context.Context, string, string, Floor) (Floor, error)
	UpdateBuildingFloor(context.Context, string, string, Floor) (Floor, error)
	DeleteBuildingFloor(context.Context, string, string, string) error
	AddFloorElement(context.Context, string, string, string, Element) (Element, error)
	UpdateFloorElement(context.Context, string, string, string, Element) (Element, error)
	DeleteFloorElement(context.Context, string, string, string, string) error
}

func ValidateConfig(value Building) error {
	if value.Kind != House && value.Kind != Garage && value.Kind != Bathhouse && value.Kind != Outbuilding && value.Kind != Custom {
		return domainerr.Field("kind", "unsupported building kind")
	}
	if value.RoofType != Gable && value.RoofType != Hip && value.RoofType != Flat && value.RoofType != Shed {
		return domainerr.Field("roofType", "unsupported roof type")
	}
	if value.WallMaterial != Wood && value.WallMaterial != Brick && value.WallMaterial != Block && value.WallMaterial != Siding && value.WallMaterial != CustomMaterial {
		return domainerr.Field("wallMaterial", "unsupported wall material")
	}
	return nil
}

func ValidateFloor(value Floor) error {
	if value.Level < 1 || value.Level > 5 {
		return domainerr.Field("level", "must be between 1 and 5")
	}
	if strings.TrimSpace(value.Name) == "" {
		return domainerr.Field("name", "is required")
	}
	if value.Height <= 0 || value.Height > 10 || math.IsNaN(value.Height) || math.IsInf(value.Height, 0) {
		return domainerr.Field("height", "must be between 0 and 10")
	}
	return nil
}

func ValidateElement(value Element, width, length float64) error {
	if strings.TrimSpace(value.Name) == "" {
		return domainerr.Field("name", "is required")
	}
	if strings.TrimSpace(value.CatalogKey) == "" {
		return domainerr.Field("catalogKey", "is required")
	}
	validCategory := value.Category == "room" || value.Category == "wall" || value.Category == "opening" || value.Category == "furniture" || value.Category == "equipment" || value.Category == "utility" || value.Category == "custom"
	if !validCategory {
		return domainerr.Field("category", "unsupported category")
	}
	values := []float64{value.X, value.Y, value.Width, value.Length, value.Height, value.Rotation}
	for _, number := range values {
		if math.IsNaN(number) || math.IsInf(number, 0) {
			return domainerr.Field("geometry", "values must be finite")
		}
	}
	if value.X < 0 || value.Y < 0 || value.Width <= 0 || value.Length <= 0 || value.Height < 0 || value.X+value.Width > width || value.Y+value.Length > length {
		return domainerr.Field("geometry", "element must fit inside building")
	}
	return nil
}
