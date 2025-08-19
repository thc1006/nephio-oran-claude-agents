package verifymatrix

import (
	"bufio"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// VersionConstraint represents version validation rules
type VersionConstraint struct {
	Min         string
	Recommended string
	Max         string
	Pattern     *regexp.Regexp
}

// ValidationResult represents a single validation finding
type ValidationResult struct {
	File      string
	Line      int
	Component string
	Version   string
	Issue     string
	Severity  string // ERROR, WARNING, INFO
}

// Config holds validation configuration
type Config struct {
	Path    string
	Verbose bool
	Strict  bool
}

// Version constraints from COMPATIBILITY_MATRIX.md
var versionMatrix = map[string]VersionConstraint{
	"kubernetes": {
		Min:         "1.29.0",
		Recommended: "1.32.0",
		Max:         "1.32.2",
		Pattern:     regexp.MustCompile(`kubernetes:\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)`),
	},
	"argocd": {
		Min:         "3.0.0",
		Recommended: "3.1.0",
		Max:         "3.1.2",
		Pattern:     regexp.MustCompile(`argocd:\s*v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)`),
	},
	"kafka": {
		Min:         "3.6.0",
		Recommended: "3.8.0",
		Max:         "3.8.1",
		Pattern:     regexp.MustCompile(`kafka(?:\.version)?:\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)`),
	},
	"kpt": {
		Min:         "v1.0.0-beta.50",
		Recommended: "v1.0.0-beta.55",
		Max:         "v1.0.0-beta.57",
		Pattern:     regexp.MustCompile(`kpt(?:\/kpt)?[@:]?\s*v?([0-9]+\.[0-9]+\.[0-9]+[-\w.]+)`),
	},
	"prometheus": {
		Min:         "2.48.0",
		Recommended: "3.5.0",
		Max:         "3.5.1",
		Pattern:     regexp.MustCompile(`prometheus:\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)`),
	},
	"grafana": {
		Min:         "10.3.0",
		Recommended: "12.1.0",
		Max:         "12.1.1",
		Pattern:     regexp.MustCompile(`grafana:\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)`),
	},
}

// API version constraints
var apiVersions = map[string]string{
	"argoproj.io/v1alpha1":              "ArgoCD Application/ApplicationSet",
	"kafka.strimzi.io/v1beta2":          "Strimzi Kafka",
	"metal3.io/v1alpha1":                "Metal3 BareMetalHost",
	"kpt.dev/v1":                        "Kpt package",
	"monitoring.coreos.com/v1":          "Prometheus ServiceMonitor",
	"admissionregistration.k8s.io/v1":   "ValidatingWebhookConfiguration",
	"networking.k8s.io/v1":              "Ingress/NetworkPolicy",
	"batch/v1":                          "Job/CronJob",
	"apps/v1":                           "Deployment/StatefulSet/DaemonSet",
	"v1":                                "Core resources (Service/ConfigMap/Secret)",
}

// Run executes the verification process
func Run(config Config, out io.Writer) error {
	results := []ValidationResult{}
	errorCount := 0
	warningCount := 0

	// Walk through all YAML files
	err := filepath.WalkDir(config.Path, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip non-YAML files
		if d.IsDir() || (!strings.HasSuffix(path, ".yaml") && !strings.HasSuffix(path, ".yml")) {
			return nil
		}

		// Skip test and vendor directories
		if strings.Contains(path, "/vendor/") || strings.Contains(path, "/test/") {
			return nil
		}

		fileResults := validateFile(path, config.Verbose)
		results = append(results, fileResults...)

		for _, r := range fileResults {
			if r.Severity == "ERROR" {
				errorCount++
			} else if r.Severity == "WARNING" {
				warningCount++
			}
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("error walking directory: %w", err)
	}

	// Print results
	printResults(results, out)

	// Print summary
	fmt.Fprintf(out, "\n========================================\n")
	fmt.Fprintf(out, "Validation Summary\n")
	fmt.Fprintf(out, "========================================\n")
	fmt.Fprintf(out, "Files scanned: %d\n", len(results))
	fmt.Fprintf(out, "Errors found: %d\n", errorCount)
	fmt.Fprintf(out, "Warnings found: %d\n", warningCount)

	// Determine exit behavior
	if errorCount > 0 {
		fmt.Fprintf(out, "\n❌ Validation FAILED with %d errors\n", errorCount)
		return fmt.Errorf("validation failed with %d errors", errorCount)
	} else if warningCount > 0 && config.Strict {
		fmt.Fprintf(out, "\n⚠️ Validation FAILED with %d warnings (strict mode)\n", warningCount)
		return fmt.Errorf("validation failed with %d warnings in strict mode", warningCount)
	} else {
		fmt.Fprintf(out, "\n✅ Validation PASSED\n")
		return nil
	}
}

func validateFile(filepath string, verbose bool) []ValidationResult {
	results := []ValidationResult{}

	file, err := os.Open(filepath)
	if err != nil {
		return results
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// Check for version references
		for component, constraint := range versionMatrix {
			if constraint.Pattern.MatchString(line) {
				matches := constraint.Pattern.FindStringSubmatch(line)
				if len(matches) > 1 {
					version := matches[1]
					result := validateVersion(filepath, lineNum, component, version, constraint, verbose)
					if result != nil {
						results = append(results, *result)
					}
				}
			}
		}

		// Check for API versions
		if strings.Contains(line, "apiVersion:") {
			apiVersion := strings.TrimSpace(strings.Split(line, ":")[1])
			if description, ok := apiVersions[apiVersion]; ok {
				if verbose {
					results = append(results, ValidationResult{
						File:      filepath,
						Line:      lineNum,
						Component: "API",
						Version:   apiVersion,
						Issue:     fmt.Sprintf("Valid API version for %s", description),
						Severity:  "INFO",
					})
				}
			}
		}

		// Check for deprecated patterns
		if strings.Contains(line, "zookeeper.connect") && strings.Contains(filepath, "kafka") {
			results = append(results, ValidationResult{
				File:      filepath,
				Line:      lineNum,
				Component: "Kafka",
				Version:   "ZooKeeper mode",
				Issue:     "ZooKeeper is deprecated in Kafka 3.8.x, use KRaft mode",
				Severity:  "WARNING",
			})
		}
	}

	return results
}

func validateVersion(file string, line int, component, version string, constraint VersionConstraint, verbose bool) *ValidationResult {
	// Clean up version string
	version = strings.TrimPrefix(version, "v")
	version = strings.TrimSuffix(version, "+")

	// Special handling for kpt beta versions
	if component == "kpt" {
		if !strings.Contains(version, "beta") {
			version = "v" + version
		} else if !strings.HasPrefix(version, "v") {
			version = "v" + version
		}
	}

	// Compare versions
	if compareVersions(version, constraint.Min) < 0 {
		return &ValidationResult{
			File:      file,
			Line:      line,
			Component: component,
			Version:   version,
			Issue:     fmt.Sprintf("Version %s is below minimum %s", version, constraint.Min),
			Severity:  "ERROR",
		}
	}

	if compareVersions(version, constraint.Max) > 0 {
		return &ValidationResult{
			File:      file,
			Line:      line,
			Component: component,
			Version:   version,
			Issue:     fmt.Sprintf("Version %s exceeds maximum tested %s", version, constraint.Max),
			Severity:  "WARNING",
		}
	}

	if version != constraint.Recommended && verbose {
		return &ValidationResult{
			File:      file,
			Line:      line,
			Component: component,
			Version:   version,
			Issue:     fmt.Sprintf("Consider upgrading to recommended version %s", constraint.Recommended),
			Severity:  "INFO",
		}
	}

	return nil
}

func compareVersions(v1, v2 string) int {
	// Simplified version comparison
	v1 = strings.TrimPrefix(v1, "v")
	v2 = strings.TrimPrefix(v2, "v")

	// Handle beta versions
	if strings.Contains(v1, "beta") && strings.Contains(v2, "beta") {
		// Extract beta numbers
		v1Parts := strings.Split(v1, "beta.")
		v2Parts := strings.Split(v2, "beta.")
		if len(v1Parts) > 1 && len(v2Parts) > 1 {
			// Convert beta numbers to integers for proper comparison
			beta1, err1 := strconv.Atoi(v1Parts[1])
			beta2, err2 := strconv.Atoi(v2Parts[1])
			if err1 == nil && err2 == nil {
				if beta1 < beta2 {
					return -1
				} else if beta1 > beta2 {
					return 1
				}
				return 0
			}
			// Fallback to string comparison if conversion fails
			if v1Parts[1] < v2Parts[1] {
				return -1
			} else if v1Parts[1] > v2Parts[1] {
				return 1
			}
			return 0
		}
	}

	// Simple string comparison for other versions
	if v1 < v2 {
		return -1
	} else if v1 > v2 {
		return 1
	}
	return 0
}

func printResults(results []ValidationResult, out io.Writer) {
	if len(results) == 0 {
		fmt.Fprintln(out, "No issues found!")
		return
	}

	// Group by severity
	errors := []ValidationResult{}
	warnings := []ValidationResult{}
	info := []ValidationResult{}

	for _, r := range results {
		switch r.Severity {
		case "ERROR":
			errors = append(errors, r)
		case "WARNING":
			warnings = append(warnings, r)
		case "INFO":
			info = append(info, r)
		}
	}

	// Print errors
	if len(errors) > 0 {
		fmt.Fprintln(out, "\n❌ ERRORS:")
		for _, r := range errors {
			fmt.Fprintf(out, "  %s:%d - %s %s: %s\n", r.File, r.Line, r.Component, r.Version, r.Issue)
		}
	}

	// Print warnings
	if len(warnings) > 0 {
		fmt.Fprintln(out, "\n⚠️  WARNINGS:")
		for _, r := range warnings {
			fmt.Fprintf(out, "  %s:%d - %s %s: %s\n", r.File, r.Line, r.Component, r.Version, r.Issue)
		}
	}

	// Print info (only in verbose mode)
	if len(info) > 0 {
		fmt.Fprintln(out, "\nℹ️  INFO:")
		for _, r := range info {
			fmt.Fprintf(out, "  %s:%d - %s %s: %s\n", r.File, r.Line, r.Component, r.Version, r.Issue)
		}
	}
}