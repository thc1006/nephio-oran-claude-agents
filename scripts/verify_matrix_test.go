package main

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateFile(t *testing.T) {
	tests := []struct {
		name           string
		content        string
		expectedErrors int
		expectedWarnings int
		expectAPIValidation bool
	}{
		{
			name: "valid versions",
			content: `
dependencies:
  kubernetes: 1.32.0
  argocd: 3.1.0
  kafka: 3.8.0
  kpt: v1.0.0-beta.55
`,
			expectedErrors: 0,
			expectedWarnings: 0,
		},
		{
			name: "outdated kubernetes version",
			content: `
dependencies:
  kubernetes: 1.28.0
`,
			expectedErrors: 1,
		},
		{
			name: "deprecated kpt version",
			content: `
dependencies:
  kpt: v1.0.0-beta.27
`,
			expectedWarnings: 1,
		},
		{
			name: "kafka with zookeeper (deprecated)",
			content: `
kafka:
  config:
    zookeeper.connect: "localhost:2181"
`,
			expectedWarnings: 1,
		},
		{
			name: "valid API versions",
			content: `
apiVersion: argoproj.io/v1alpha1
kind: Application
---
apiVersion: v1
kind: ConfigMap
`,
			expectedErrors: 0,
			expectAPIValidation: true,
		},
		{
			name: "mixed valid and invalid versions",
			content: `
dependencies:
  kubernetes: 1.32.0  # Valid
  argocd: 2.8.0       # Too old
  kafka: 4.0.0        # Too new (untested)
  kpt: v1.0.0-beta.55 # Valid
`,
			expectedErrors: 1,
			expectedWarnings: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary file
			tmpFile, err := ioutil.TempFile("", "test_*.yaml")
			require.NoError(t, err)
			defer os.Remove(tmpFile.Name())

			_, err = tmpFile.WriteString(tt.content)
			require.NoError(t, err)
			tmpFile.Close()

			// Validate file
			results := validateFile(tmpFile.Name())

			// Count errors and warnings
			errorCount := 0
			warningCount := 0
			infoCount := 0

			for _, result := range results {
				switch result.Severity {
				case "ERROR":
					errorCount++
				case "WARNING":
					warningCount++
				case "INFO":
					infoCount++
				}
			}

			assert.Equal(t, tt.expectedErrors, errorCount, "Error count mismatch")
			assert.Equal(t, tt.expectedWarnings, warningCount, "Warning count mismatch")

			if tt.expectAPIValidation {
				assert.True(t, infoCount > 0, "Expected API validation info messages")
			}
		})
	}
}

func TestValidateVersion(t *testing.T) {
	tests := []struct {
		name       string
		component  string
		version    string
		constraint VersionConstraint
		expectNil  bool
		severity   string
	}{
		{
			name:      "valid version within range",
			component: "kubernetes",
			version:   "1.32.0",
			constraint: VersionConstraint{
				Min:         "1.29.0",
				Recommended: "1.32.0", 
				Max:         "1.32.2",
			},
			expectNil: true,
		},
		{
			name:      "version below minimum",
			component: "kubernetes",
			version:   "1.28.0",
			constraint: VersionConstraint{
				Min:         "1.29.0",
				Recommended: "1.32.0",
				Max:         "1.32.2",
			},
			expectNil: false,
			severity:  "ERROR",
		},
		{
			name:      "version above maximum tested",
			component: "kafka",
			version:   "4.0.0",
			constraint: VersionConstraint{
				Min:         "3.6.0",
				Recommended: "3.8.0",
				Max:         "3.8.1",
			},
			expectNil: false,
			severity:  "WARNING",
		},
		{
			name:      "kpt beta version validation",
			component: "kpt",
			version:   "v1.0.0-beta.50",
			constraint: VersionConstraint{
				Min:         "v1.0.0-beta.50",
				Recommended: "v1.0.0-beta.55",
				Max:         "v1.0.0-beta.57",
			},
			expectNil: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validateVersion("test.yaml", 1, tt.component, tt.version, tt.constraint)

			if tt.expectNil {
				assert.Nil(t, result, "Expected nil result for valid version")
			} else {
				assert.NotNil(t, result, "Expected validation error")
				assert.Equal(t, tt.severity, result.Severity)
				assert.Equal(t, tt.component, result.Component)
				assert.Equal(t, tt.version, result.Version)
			}
		})
	}
}

func TestCompareVersions(t *testing.T) {
	tests := []struct {
		name     string
		v1       string
		v2       string
		expected int
	}{
		{"equal versions", "1.0.0", "1.0.0", 0},
		{"v1 less than v2", "1.0.0", "1.1.0", -1},
		{"v1 greater than v2", "1.1.0", "1.0.0", 1},
		{"beta versions equal", "v1.0.0-beta.27", "v1.0.0-beta.27", 0},
		{"beta v1 less than v2", "v1.0.0-beta.27", "v1.0.0-beta.55", -1},
		{"beta v1 greater than v2", "v1.0.0-beta.55", "v1.0.0-beta.27", 1},
		{"with v prefix", "v1.0.0", "1.0.0", 0},
		{"complex versions", "1.32.0", "1.29.0", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := compareVersions(tt.v1, tt.v2)
			assert.Equal(t, tt.expected, result, "Version comparison failed for %s vs %s", tt.v1, tt.v2)
		})
	}
}

func TestPrintResults(t *testing.T) {
	// This is more of a smoke test since printResults writes to stdout
	results := []ValidationResult{
		{
			File:      "test.yaml",
			Line:      1,
			Component: "kubernetes",
			Version:   "1.28.0",
			Issue:     "Version 1.28.0 is below minimum 1.29.0",
			Severity:  "ERROR",
		},
		{
			File:      "test.yaml",
			Line:      2,
			Component: "kafka",
			Version:   "4.0.0",
			Issue:     "Version 4.0.0 exceeds maximum tested 3.8.1",
			Severity:  "WARNING",
		},
	}

	// Should not panic
	assert.NotPanics(t, func() {
		printResults(results)
	})
}

// Benchmark tests for matrix verification
func BenchmarkValidateFile(b *testing.B) {
	content := `# Test YAML with various version references
dependencies:
  go: 1.24.6
  kubernetes: 1.32.0
  argocd: 3.1.0
  kafka: 3.8.0
  kpt: v1.0.0-beta.55
  prometheus: 3.5.0
  grafana: 12.1.0

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: test-app
spec:
  source:
    repoURL: https://example.com/repo
---
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: test-kafka
spec:
  kafka:
    version: 3.8.0
    config:
      process.roles: "broker,controller"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  config.yaml: |
    monitoring:
      prometheus: 3.5.0
      grafana: 12.1.0
`

	// Create temporary file
	tmpFile, err := ioutil.TempFile("", "benchmark_*.yaml")
	if err != nil {
		b.Fatal(err)
	}
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.WriteString(content)
	if err != nil {
		b.Fatal(err)
	}
	tmpFile.Close()

	b.ResetTimer()
	b.Run("ValidateFile", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			_ = validateFile(tmpFile.Name())
		}
	})
}

func BenchmarkCompareVersions(b *testing.B) {
	testCases := []struct {
		name string
		v1   string
		v2   string
	}{
		{"simple", "1.0.0", "1.1.0"},
		{"complex", "1.32.0", "1.29.0"},
		{"beta", "v1.0.0-beta.55", "v1.0.0-beta.27"},
		{"identical", "3.8.0", "3.8.0"},
	}

	for _, tc := range testCases {
		b.Run(tc.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_ = compareVersions(tc.v1, tc.v2)
			}
		})
	}
}

func BenchmarkPatternMatching(b *testing.B) {
	// Test the regex pattern matching performance
	testLines := []string{
		"  kubernetes: 1.32.0",
		"  argocd: 3.1.0+",
		"  kafka: 3.8.0  # Latest version",
		"    kpt: v1.0.0-beta.55",
		"prometheus: 3.5.0  # LTS version",
		"grafana: 12.1.0  # Latest stable",
	}

	b.ResetTimer()
	b.Run("PatternMatching", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			for _, constraint := range versionMatrix {
				for _, line := range testLines {
					if constraint.Pattern.MatchString(line) {
						_ = constraint.Pattern.FindStringSubmatch(line)
					}
				}
			}
		}
	})
}

// Test utilities and helpers
func TestVersionMatrixIntegrity(t *testing.T) {
	// Verify that the version matrix is properly defined
	requiredComponents := []string{"kubernetes", "argocd", "kafka", "kpt", "prometheus", "grafana"}
	
	for _, component := range requiredComponents {
		constraint, exists := versionMatrix[component]
		assert.True(t, exists, "Component %s missing from version matrix", component)
		
		if exists {
			assert.NotEmpty(t, constraint.Min, "Component %s missing minimum version", component)
			assert.NotEmpty(t, constraint.Recommended, "Component %s missing recommended version", component)
			assert.NotEmpty(t, constraint.Max, "Component %s missing maximum version", component)
			assert.NotNil(t, constraint.Pattern, "Component %s missing regex pattern", component)
		}
	}
}

func TestAPIVersionValidation(t *testing.T) {
	// Test API version validation
	validAPIs := []string{
		"argoproj.io/v1alpha1",
		"kafka.strimzi.io/v1beta2", 
		"metal3.io/v1alpha1",
		"v1",
		"apps/v1",
		"batch/v1",
	}

	for _, api := range validAPIs {
		description, exists := apiVersions[api]
		assert.True(t, exists, "API version %s not found in apiVersions map", api)
		assert.NotEmpty(t, description, "API version %s has empty description", api)
	}
}

// Integration tests
func TestFullWorkflow(t *testing.T) {
	// Create a temporary directory structure
	tmpDir, err := ioutil.TempDir("", "matrix_test_")
	require.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	// Create subdirectories
	manifestsDir := filepath.Join(tmpDir, "manifests")
	err = os.MkdirAll(manifestsDir, 0755)
	require.NoError(t, err)

	// Create test manifest files
	testManifests := map[string]string{
		"valid-manifest.yaml": `
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: test-app
spec:
  source:
    repoURL: https://example.com/repo
  destination:
    server: https://kubernetes.default.svc
---
# Valid versions
dependencies:
  kubernetes: 1.32.0
  argocd: 3.1.0
  kpt: v1.0.0-beta.55
`,
		"invalid-manifest.yaml": `
# Invalid versions
dependencies:
  kubernetes: 1.28.0  # Too old
  argocd: 2.8.0       # Too old
  kpt: v1.0.0-beta.27 # Outdated
`,
		"kafka-kraft.yaml": `
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: test-kafka
spec:
  kafka:
    version: 3.8.0
    config:
      process.roles: "broker,controller"
`,
		"kafka-legacy.yaml": `
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: legacy-kafka
spec:
  kafka:
    version: 3.8.0
    config:
      zookeeper.connect: "localhost:2181"
`,
	}

	for filename, content := range testManifests {
		err := ioutil.WriteFile(filepath.Join(manifestsDir, filename), []byte(content), 0644)
		require.NoError(t, err)
	}

	// Test the validation workflow
	t.Run("validate all manifests", func(t *testing.T) {
		var allResults []ValidationResult
		
		err := filepath.Walk(manifestsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			
			if !info.IsDir() && (strings.HasSuffix(path, ".yaml") || strings.HasSuffix(path, ".yml")) {
				results := validateFile(path)
				allResults = append(allResults, results...)
			}
			
			return nil
		})
		
		require.NoError(t, err)
		
		// Should find validation issues
		assert.NotEmpty(t, allResults, "Expected validation results")
		
		// Count by severity
		errorCount := 0
		warningCount := 0
		infoCount := 0
		
		for _, result := range allResults {
			switch result.Severity {
			case "ERROR":
				errorCount++
			case "WARNING":
				warningCount++
			case "INFO":
				infoCount++
			}
		}
		
		// Should find errors in invalid-manifest.yaml
		assert.True(t, errorCount > 0, "Expected to find validation errors")
		
		// Should find warnings for deprecated patterns
		assert.True(t, warningCount > 0, "Expected to find validation warnings")
		
		t.Logf("Validation results: %d errors, %d warnings, %d info", 
			errorCount, warningCount, infoCount)
	})
}

// Error handling tests
func TestErrorHandling(t *testing.T) {
	t.Run("nonexistent file", func(t *testing.T) {
		results := validateFile("/nonexistent/file.yaml")
		// Should handle gracefully, might return empty results or log error
		assert.NotNil(t, results)
	})
	
	t.Run("directory instead of file", func(t *testing.T) {
		tmpDir, err := ioutil.TempDir("", "test_dir_")
		require.NoError(t, err)
		defer os.RemoveAll(tmpDir)
		
		results := validateFile(tmpDir)
		assert.NotNil(t, results)
	})
	
	t.Run("binary file", func(t *testing.T) {
		tmpFile, err := ioutil.TempFile("", "binary_*.bin")
		require.NoError(t, err)
		defer os.Remove(tmpFile.Name())
		
		// Write binary data
		binaryData := []byte{0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0xFD}
		_, err = tmpFile.Write(binaryData)
		require.NoError(t, err)
		tmpFile.Close()
		
		// Should handle gracefully
		results := validateFile(tmpFile.Name())
		assert.NotNil(t, results)
	})
}