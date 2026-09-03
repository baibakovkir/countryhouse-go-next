package plot

import (
	"context"
	"encoding/json"
	"math"
	"strings"
	"time"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
)

type ObjectType string

const (
	Building  ObjectType = "building"
	GardenBed ObjectType = "garden_bed"
	Tree      ObjectType = "tree"
	Terrace   ObjectType = "terrace"
	Stairs    ObjectType = "stairs"
	Utility   ObjectType = "utility"
	Custom    ObjectType = "custom"
)

type GeometryType string

const (
	Footprint GeometryType = "footprint"
	Polyline  GeometryType = "polyline"
	Polygon   GeometryType = "polygon"
)

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type Plot struct {
	ID        string    `json:"id"`
	OwnerID   string    `json:"-"`
	Name      string    `json:"name"`
	Width     float64   `json:"width"`
	Length    float64   `json:"length"`
	Objects   []Object  `json:"objects"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Object struct {
	ID         string          `json:"id"`
	PlotID     string          `json:"-"`
	Type       ObjectType      `json:"type"`
	Name       string          `json:"name"`
	X          float64         `json:"x"`
	Y          float64         `json:"y"`
	Z          float64         `json:"z"`
	Width      float64         `json:"width"`
	Length     float64         `json:"length"`
	Height     float64         `json:"height"`
	Geometry   GeometryType    `json:"geometry"`
	Points     []Point         `json:"points,omitempty"`
	Properties json.RawMessage `json:"properties,omitempty"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
}

type Repository interface {
	Create(context.Context, Plot) (Plot, error)
	List(context.Context, string) ([]Plot, error)
	Get(context.Context, string, string) (Plot, error)
	Update(context.Context, Plot) (Plot, error)
	Delete(context.Context, string, string) error
	AddObject(context.Context, string, Object) (Object, error)
	ListObjects(context.Context, string, string) ([]Object, error)
	GetObject(context.Context, string, string, string) (Object, error)
	UpdateObject(context.Context, string, Object) (Object, error)
	DeleteObject(context.Context, string, string, string) error
}

func ValidateName(name string) error {
	if strings.TrimSpace(name) == "" {
		return domainerr.Field("name", "is required")
	}
	return nil
}

func ValidateDimensions(width, length float64) error {
	if !finitePositive(width) || !finitePositive(length) {
		return domainerr.Field("dimensions", "width and length must be finite positive numbers")
	}
	return nil
}

func ValidateObject(p Plot, o Object) error {
	if strings.TrimSpace(o.Name) == "" {
		return domainerr.Field("name", "is required")
	}
	if o.Type != Building && o.Type != GardenBed && o.Type != Tree && o.Type != Terrace && o.Type != Stairs && o.Type != Utility && o.Type != Custom {
		return domainerr.Field("type", "unsupported object type")
	}
	values := []float64{o.X, o.Y, o.Z, o.Width, o.Length, o.Height}
	for _, value := range values {
		if math.IsNaN(value) || math.IsInf(value, 0) {
			return domainerr.Field("geometry", "values must be finite")
		}
	}
	if o.X < 0 || o.Y < 0 || o.Height < 0 || o.Width <= 0 || o.Length <= 0 {
		return domainerr.Field("geometry", "coordinates must be non-negative and footprint dimensions positive")
	}
	if o.X+o.Width > p.Width || o.Y+o.Length > p.Length {
		return domainerr.Field("geometry", "object must fit within plot bounds")
	}
	if o.Geometry == "" {
		o.Geometry = Footprint
	}
	if o.Geometry != Footprint && o.Geometry != Polyline && o.Geometry != Polygon {
		return domainerr.Field("geometry", "must be footprint, polyline or polygon")
	}
	if (o.Geometry == Polyline || o.Geometry == Polygon) && len(o.Points) < 2 {
		return domainerr.Field("points", "at least two points are required")
	}
	for _, point := range o.Points {
		if math.IsNaN(point.X) || math.IsNaN(point.Y) || math.IsNaN(point.Z) || math.IsInf(point.X, 0) || math.IsInf(point.Y, 0) || math.IsInf(point.Z, 0) || point.X < 0 || point.Y < 0 || point.X > p.Width || point.Y > p.Length {
			return domainerr.Field("points", "points must be finite and inside plot bounds")
		}
	}
	return nil
}

func finitePositive(value float64) bool {
	return value > 0 && !math.IsNaN(value) && !math.IsInf(value, 0)
}
