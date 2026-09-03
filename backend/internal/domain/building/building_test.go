package building

import "testing"

func TestValidateConfig(t *testing.T) {
	t.Parallel()
	if err := ValidateConfig(Building{Kind: House, RoofType: Gable, WallMaterial: Wood}); err != nil {
		t.Fatalf("valid config rejected: %v", err)
	}
	if err := ValidateConfig(Building{Kind: "tower", RoofType: Gable, WallMaterial: Wood}); err == nil {
		t.Fatal("unsupported kind accepted")
	}
}

func TestValidateElementBounds(t *testing.T) {
	t.Parallel()
	valid := Element{CatalogKey: "door", Category: "opening", Name: "Door", X: 1, Y: 2, Width: .9, Length: .15, Height: 2.1}
	if err := ValidateElement(valid, 10, 8); err != nil {
		t.Fatalf("valid element rejected: %v", err)
	}
	valid.X = 9.5
	if err := ValidateElement(valid, 10, 8); err == nil {
		t.Fatal("out-of-bounds element accepted")
	}
}

func TestValidateFloorLimits(t *testing.T) {
	t.Parallel()
	if err := ValidateFloor(Floor{Level: 1, Name: "Первый этаж", Height: 2.8}); err != nil {
		t.Fatalf("valid floor rejected: %v", err)
	}
	if err := ValidateFloor(Floor{Level: 6, Name: "Шестой", Height: 2.8}); err == nil {
		t.Fatal("sixth floor accepted")
	}
}
