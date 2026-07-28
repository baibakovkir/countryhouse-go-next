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
