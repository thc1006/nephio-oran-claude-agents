package version

import "testing"

func TestGetVersion(t *testing.T) {
	expected := "1.0.0"
	if got := GetVersion(); got != expected {
		t.Errorf("GetVersion() = %v, want %v", got, expected)
	}
}

func TestGetORANRelease(t *testing.T) {
	expected := "L (released 2025-06-30)"
	if got := GetORANRelease(); got != expected {
		t.Errorf("GetORANRelease() = %v, want %v", got, expected)
	}
}

func TestGetNephioRelease(t *testing.T) {
	expected := "R5 (v5.x)"
	if got := GetNephioRelease(); got != expected {
		t.Errorf("GetNephioRelease() = %v, want %v", got, expected)
	}
}