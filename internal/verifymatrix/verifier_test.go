package verifymatrix

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunValidation(t *testing.T) {
	// Create a temporary directory with test files
	tmpDir := t.TempDir()

	// Create a valid YAML file
	validFile := filepath.Join(tmpDir, "valid.yaml")
	validContent := `
dependencies:
  kubernetes: 1.32.0
  argocd: 3.1.0
  kpt: v1.0.0-beta.55
`
	err := os.WriteFile(validFile, []byte(validContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Create an invalid YAML file
	invalidFile := filepath.Join(tmpDir, "invalid.yaml")
	invalidContent := `
dependencies:
  kubernetes: 1.28.0  # Too old
  argocd: 2.8.0       # Too old
`
	err = os.WriteFile(invalidFile, []byte(invalidContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	var buf bytes.Buffer
	config := Config{
		Path:    tmpDir,
		Verbose: true,
		Strict:  false,
	}

	err = Run(config, &buf)
	if err == nil {
		t.Fatal("Expected Run to fail due to validation errors, but it succeeded")
	}

	output := buf.String()

	// Should contain validation summary
	if !strings.Contains(output, "Validation Summary") {
		t.Error("Expected validation summary not found in output")
	}

	// Should contain error details
	if !strings.Contains(output, "❌ ERRORS:") {
		t.Error("Expected error section not found in output")
	}

	// Should contain the specific validation errors
	if !strings.Contains(output, "kubernetes 1.28.0") {
		t.Error("Expected kubernetes version error not found in output")
	}
}

func TestRunValidationSuccessful(t *testing.T) {
	// Create a temporary directory with only valid files
	tmpDir := t.TempDir()

	validFile := filepath.Join(tmpDir, "valid.yaml")
	validContent := `
dependencies:
  kubernetes: 1.32.0
  argocd: 3.1.0
  kpt: v1.0.0-beta.55
`
	err := os.WriteFile(validFile, []byte(validContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	var buf bytes.Buffer
	config := Config{
		Path:    tmpDir,
		Verbose: false,
		Strict:  false,
	}

	err = Run(config, &buf)
	if err != nil {
		t.Fatalf("Expected Run to succeed, but it failed: %v", err)
	}

	output := buf.String()

	// Should contain success message
	if !strings.Contains(output, "✅ Validation PASSED") {
		t.Error("Expected success message not found in output")
	}
}

func TestRunValidationStrictMode(t *testing.T) {
	// Create a temporary directory with warnings
	tmpDir := t.TempDir()

	warningFile := filepath.Join(tmpDir, "kafka-warning.yaml")
	warningContent := `
kafka:
  config:
    zookeeper.connect: "localhost:2181"
`
	err := os.WriteFile(warningFile, []byte(warningContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	var buf bytes.Buffer
	config := Config{
		Path:    tmpDir,
		Verbose: false,
		Strict:  true, // Strict mode should fail on warnings
	}

	err = Run(config, &buf)
	if err == nil {
		t.Fatal("Expected Run to fail in strict mode due to warnings, but it succeeded")
	}

	output := buf.String()

	// Should contain warning about strict mode
	if !strings.Contains(output, "strict mode") {
		t.Error("Expected strict mode message not found in output")
	}
}

func TestValidateVersionComparison(t *testing.T) {
	tests := []struct {
		name        string
		v1          string
		v2          string
		expected    int
		description string
	}{
		{"equal versions", "1.0.0", "1.0.0", 0, "versions should be equal"},
		{"v1 less than v2", "1.0.0", "1.1.0", -1, "v1 should be less than v2"},
		{"v1 greater than v2", "1.1.0", "1.0.0", 1, "v1 should be greater than v2"},
		{"beta versions equal", "v1.0.0-beta.55", "v1.0.0-beta.55", 0, "beta versions should be equal"},
		{"beta v1 less than v2", "v1.0.0-beta.55", "v1.0.0-beta.57", -1, "beta v1 should be less than v2"},
		{"beta v1 greater than v2", "v1.0.0-beta.57", "v1.0.0-beta.55", 1, "beta v1 should be greater than v2"},
		{"with v prefix", "v1.0.0", "1.0.0", 0, "v prefix should be handled"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := compareVersions(tt.v1, tt.v2)
			if result != tt.expected {
				t.Errorf("compareVersions(%q, %q) = %d, expected %d: %s",
					tt.v1, tt.v2, result, tt.expected, tt.description)
			}
		})
	}
}

func TestValidateFileWithAPIVersions(t *testing.T) {
	tmpDir := t.TempDir()

	apiFile := filepath.Join(tmpDir, "api-test.yaml")
	apiContent := `
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: test-app
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
`
	err := os.WriteFile(apiFile, []byte(apiContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	results := validateFile(apiFile, true) // verbose = true to capture API info

	// Should find API version info messages
	found := false
	for _, result := range results {
		if result.Component == "API" && result.Severity == "INFO" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected to find API version info messages in verbose mode")
	}
}

func TestValidateFileKafkaDeprecation(t *testing.T) {
	tmpDir := t.TempDir()

	kafkaFile := filepath.Join(tmpDir, "kafka-deprecated.yaml")
	kafkaContent := `
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: test-kafka
spec:
  kafka:
    config:
      zookeeper.connect: "localhost:2181"
`
	err := os.WriteFile(kafkaFile, []byte(kafkaContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	results := validateFile(kafkaFile, false)

	// Should find ZooKeeper deprecation warning
	found := false
	for _, result := range results {
		if result.Component == "Kafka" && result.Severity == "WARNING" && strings.Contains(result.Issue, "ZooKeeper") {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected to find ZooKeeper deprecation warning")
	}
}

func TestPrintResults(t *testing.T) {
	results := []ValidationResult{
		{
			File:      "test.yaml",
			Line:      1,
			Component: "kubernetes",
			Version:   "1.28.0",
			Issue:     "Version 1.28.0 is below minimum 1.30.0",
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

	var buf bytes.Buffer
	printResults(results, &buf)

	output := buf.String()

	// Should contain error and warning sections
	if !strings.Contains(output, "❌ ERRORS:") {
		t.Error("Expected error section not found in output")
	}

	if !strings.Contains(output, "⚠️  WARNINGS:") {
		t.Error("Expected warning section not found in output")
	}

	// Should contain the specific issues
	if !strings.Contains(output, "kubernetes 1.28.0") {
		t.Error("Expected kubernetes error not found in output")
	}

	if !strings.Contains(output, "kafka 4.0.0") {
		t.Error("Expected kafka warning not found in output")
	}
}

func TestEmptyResults(t *testing.T) {
	var buf bytes.Buffer
	printResults([]ValidationResult{}, &buf)

	output := buf.String()
	if !strings.Contains(output, "No issues found!") {
		t.Error("Expected 'No issues found!' message for empty results")
	}
}
