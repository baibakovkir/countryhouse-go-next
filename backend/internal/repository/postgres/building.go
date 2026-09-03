package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"github.com/example/countryhouse/backend/internal/domain/building"
	"github.com/example/countryhouse/backend/internal/domain/domainerr"
)

func (s *Store) GetBuilding(ctx context.Context, ownerID, plotID, objectID string) (building.Building, error) {
	var value building.Building
	err := s.pool.QueryRow(ctx, `SELECT b.plot_object_id,b.kind,b.roof_type,b.wall_material,b.properties,b.created_at,b.updated_at FROM buildings b JOIN plot_objects o ON o.id=b.plot_object_id JOIN plots p ON p.id=o.plot_id WHERE p.owner_id=$1 AND p.id=$2 AND o.id=$3`, ownerID, plotID, objectID).Scan(&value.PlotObjectID, &value.Kind, &value.RoofType, &value.WallMaterial, &value.Properties, &value.CreatedAt, &value.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return building.Building{}, domainerr.New(domainerr.NotFound, "building not found")
	}
	if err != nil {
		return building.Building{}, internal("could not load building", err)
	}
	value.Floors, err = s.listFloors(ctx, value.PlotObjectID)
	return value, err
}

func (s *Store) UpsertBuilding(ctx context.Context, ownerID, plotID string, value building.Building) (building.Building, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO buildings(plot_object_id,kind,roof_type,wall_material,properties) SELECT o.id,$1,$2,$3,$4 FROM plot_objects o JOIN plots p ON p.id=o.plot_id WHERE o.id=$5 AND o.type='building' AND p.id=$6 AND p.owner_id=$7 ON CONFLICT(plot_object_id) DO UPDATE SET kind=excluded.kind,roof_type=excluded.roof_type,wall_material=excluded.wall_material,properties=excluded.properties,updated_at=now() RETURNING created_at,updated_at`, value.Kind, value.RoofType, value.WallMaterial, value.Properties, value.PlotObjectID, plotID, ownerID).Scan(&value.CreatedAt, &value.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return building.Building{}, domainerr.New(domainerr.NotFound, "building object not found")
	}
	if err != nil {
		return building.Building{}, internal("could not save building", err)
	}
	return s.GetBuilding(ctx, ownerID, plotID, value.PlotObjectID)
}

func (s *Store) listFloors(ctx context.Context, buildingID string) ([]building.Floor, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,building_id,level,name,height,created_at,updated_at FROM building_floors WHERE building_id=$1 ORDER BY level`, buildingID)
	if err != nil {
		return nil, internal("could not list floors", err)
	}
	defer rows.Close()
	items := []building.Floor{}
	for rows.Next() {
		var value building.Floor
		if err := rows.Scan(&value.ID, &value.BuildingID, &value.Level, &value.Name, &value.Height, &value.CreatedAt, &value.UpdatedAt); err != nil {
			return nil, internal("could not scan floor", err)
		}
		value.Elements, err = s.listFloorElements(ctx, value.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, value)
	}
	return items, rows.Err()
}

func (s *Store) AddBuildingFloor(ctx context.Context, ownerID, plotID string, value building.Floor) (building.Floor, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO building_floors(building_id,level,name,height) SELECT b.plot_object_id,$1,$2,$3 FROM buildings b JOIN plot_objects o ON o.id=b.plot_object_id JOIN plots p ON p.id=o.plot_id WHERE b.plot_object_id=$4 AND p.id=$5 AND p.owner_id=$6 ON CONFLICT(building_id,level) DO UPDATE SET name=excluded.name,height=excluded.height,updated_at=now() RETURNING id,created_at,updated_at`, value.Level, value.Name, value.Height, value.BuildingID, plotID, ownerID).Scan(&value.ID, &value.CreatedAt, &value.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return building.Floor{}, domainerr.New(domainerr.NotFound, "building not found")
	}
	if err != nil {
		return building.Floor{}, internal("could not create floor", err)
	}
	value.Elements = []building.Element{}
	return value, nil
}

func (s *Store) UpdateBuildingFloor(ctx context.Context, ownerID, plotID string, value building.Floor) (building.Floor, error) {
	err := s.pool.QueryRow(ctx, `UPDATE building_floors f SET level=$1,name=$2,height=$3,updated_at=now() FROM buildings b JOIN plot_objects o ON o.id=b.plot_object_id JOIN plots p ON p.id=o.plot_id WHERE f.building_id=b.plot_object_id AND f.id=$4 AND p.id=$5 AND p.owner_id=$6 RETURNING f.building_id,f.updated_at`, value.Level, value.Name, value.Height, value.ID, plotID, ownerID).Scan(&value.BuildingID, &value.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return building.Floor{}, domainerr.New(domainerr.NotFound, "floor not found")
	}
	if err != nil {
		return building.Floor{}, internal("could not update floor", err)
	}
	return value, nil
}

func (s *Store) DeleteBuildingFloor(ctx context.Context, ownerID, plotID, floorID string) error {
	command, err := s.pool.Exec(ctx, `DELETE FROM building_floors f USING buildings b,plot_objects o,plots p WHERE f.building_id=b.plot_object_id AND o.id=b.plot_object_id AND p.id=o.plot_id AND f.id=$1 AND p.id=$2 AND p.owner_id=$3`, floorID, plotID, ownerID)
	if err != nil {
		return internal("could not delete floor", err)
	}
	return deleted(command, "floor not found")
}

const floorElementColumns = `id,floor_id,catalog_key,category,name,x,y,width,length,height,rotation,geometry,points,properties,created_at,updated_at`

func (s *Store) listFloorElements(ctx context.Context, floorID string) ([]building.Element, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+floorElementColumns+` FROM floor_elements WHERE floor_id=$1 ORDER BY created_at`, floorID)
	if err != nil {
		return nil, internal("could not list floor elements", err)
	}
	defer rows.Close()
	items := []building.Element{}
	for rows.Next() {
		var value building.Element
		if err := rows.Scan(&value.ID, &value.FloorID, &value.CatalogKey, &value.Category, &value.Name, &value.X, &value.Y, &value.Width, &value.Length, &value.Height, &value.Rotation, &value.Geometry, &value.Points, &value.Properties, &value.CreatedAt, &value.UpdatedAt); err != nil {
			return nil, internal("could not scan floor element", err)
		}
		items = append(items, value)
	}
	return items, rows.Err()
}

func (s *Store) AddFloorElement(ctx context.Context, ownerID, plotID, floorID string, value building.Element) (building.Element, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO floor_elements(floor_id,catalog_key,category,name,x,y,width,length,height,rotation,geometry,points,properties) SELECT f.id,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12 FROM building_floors f JOIN buildings b ON b.plot_object_id=f.building_id JOIN plot_objects o ON o.id=b.plot_object_id JOIN plots p ON p.id=o.plot_id WHERE f.id=$13 AND p.id=$14 AND p.owner_id=$15 RETURNING id,created_at,updated_at`, value.CatalogKey, value.Category, value.Name, value.X, value.Y, value.Width, value.Length, value.Height, value.Rotation, value.Geometry, value.Points, value.Properties, floorID, plotID, ownerID).Scan(&value.ID, &value.CreatedAt, &value.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return building.Element{}, domainerr.New(domainerr.NotFound, "floor not found")
	}
	if err != nil {
		return building.Element{}, internal("could not create floor element", err)
	}
	value.FloorID = floorID
	return value, nil
}

func (s *Store) UpdateFloorElement(ctx context.Context, ownerID, plotID, floorID string, value building.Element) (building.Element, error) {
	err := s.pool.QueryRow(ctx, `UPDATE floor_elements e SET catalog_key=$1,category=$2,name=$3,x=$4,y=$5,width=$6,length=$7,height=$8,rotation=$9,geometry=$10,points=$11,properties=$12,updated_at=now() FROM building_floors f JOIN buildings b ON b.plot_object_id=f.building_id JOIN plot_objects o ON o.id=b.plot_object_id JOIN plots p ON p.id=o.plot_id WHERE e.floor_id=f.id AND e.id=$13 AND f.id=$14 AND p.id=$15 AND p.owner_id=$16 RETURNING e.updated_at`, value.CatalogKey, value.Category, value.Name, value.X, value.Y, value.Width, value.Length, value.Height, value.Rotation, value.Geometry, value.Points, value.Properties, value.ID, floorID, plotID, ownerID).Scan(&value.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return building.Element{}, domainerr.New(domainerr.NotFound, "floor element not found")
	}
	if err != nil {
		return building.Element{}, internal("could not update floor element", err)
	}
	value.FloorID = floorID
	return value, nil
}

func (s *Store) DeleteFloorElement(ctx context.Context, ownerID, plotID, floorID, elementID string) error {
	command, err := s.pool.Exec(ctx, `DELETE FROM floor_elements e USING building_floors f,buildings b,plot_objects o,plots p WHERE e.floor_id=f.id AND f.building_id=b.plot_object_id AND o.id=b.plot_object_id AND p.id=o.plot_id AND e.id=$1 AND f.id=$2 AND p.id=$3 AND p.owner_id=$4`, elementID, floorID, plotID, ownerID)
	if err != nil {
		return internal("could not delete floor element", err)
	}
	return deleted(command, "floor element not found")
}
