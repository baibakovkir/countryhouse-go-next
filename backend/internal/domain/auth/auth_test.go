package auth

import "testing"

func TestNormalizeAndValidateEmail(t *testing.T) {
	value := NormalizeEmail("  OWNER@Example.COM ")
	if value != "owner@example.com" {
		t.Fatalf("NormalizeEmail() = %q", value)
	}
	if err := ValidateEmail(value); err != nil {
		t.Fatalf("ValidateEmail() error = %v", err)
	}
	if err := ValidateEmail("invalid"); err == nil {
		t.Fatal("ValidateEmail() accepted invalid address")
	}
}

func TestValidatePassword(t *testing.T) {
	if err := ValidatePassword("short"); err == nil {
		t.Fatal("short password accepted")
	}
	if err := ValidatePassword("correct horse battery staple"); err != nil {
		t.Fatalf("valid password rejected: %v", err)
	}
}
