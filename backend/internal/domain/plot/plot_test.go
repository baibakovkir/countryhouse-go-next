package plot

import "testing"

func TestValidateObjectBounds(t *testing.T) {
	t.Parallel()
	p := Plot{Width: 10, Length: 20}
	valid := Object{Type: Building, Name: "House", X: 1, Y: 2, Width: 4, Length: 5}
	if err := ValidateObject(p, valid); err != nil {
		t.Fatalf("valid object rejected: %v", err)
	}
	invalid := valid
	invalid.X = 8
	if err := ValidateObject(p, invalid); err == nil {
		t.Fatal("out-of-bounds object accepted")
	}
}

func TestValidateObjectSupportsVerticalAndLinearElements(t *testing.T) {
	t.Parallel()
	p := Plot{Width: 10, Length: 20}
	utility := Object{Type: Utility, Name: "Вода", Geometry: Polyline, X: 0, Y: 0, Z: -2, Width: 0.1, Length: 1, Points: []Point{{X: 1, Y: 1, Z: -2}, {X: 8, Y: 12, Z: -2}}}
	if err := ValidateObject(p, utility); err != nil {
		t.Fatalf("underground utility rejected: %v", err)
	}
	invalid := utility
	invalid.Points = []Point{{X: 1, Y: 1, Z: 0}}
	if err := ValidateObject(p, invalid); err == nil {
		t.Fatal("single-point polyline accepted")
	}
}

func TestValidateTerrainPoints(t *testing.T) {
	t.Parallel()
	p := Plot{Width: 10, Length: 20, TerrainPoints: []Point{{X: 0, Y: 0, Z: -1.2}, {X: 10, Y: 20, Z: 2.4}}}
	if err := ValidateTerrainPoints(p); err != nil {
		t.Fatalf("valid terrain points rejected: %v", err)
	}
	p.TerrainPoints = append(p.TerrainPoints, Point{X: 11, Y: 3, Z: 0})
	if err := ValidateTerrainPoints(p); err == nil {
		t.Fatal("terrain point outside plot bounds accepted")
	}
}
