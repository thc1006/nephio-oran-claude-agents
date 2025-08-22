// Package version provides version information for the Nephio O-RAN agents
package version

// Version constants for the project
const (
	// Version is the current version of the project
	Version = "1.0.0"

	// ORANRelease is the O-RAN release version
	ORANRelease = "L (released 2025-06-30)"

	// NephioRelease is the Nephio release version
	NephioRelease = "R5 (v5.x)"

	// GoVersion is the Go version used
	GoVersion = "1.24.6"

	// KptVersion is the kpt version used
	KptVersion = "v1.0.0-beta.55"
)

// GetVersion returns the current version
func GetVersion() string {
	return Version
}

// GetORANRelease returns the O-RAN release version
func GetORANRelease() string {
	return ORANRelease
}

// GetNephioRelease returns the Nephio release version
func GetNephioRelease() string {
	return NephioRelease
}
