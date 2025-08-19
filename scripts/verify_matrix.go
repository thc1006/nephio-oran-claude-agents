package main

import (
	"bufio"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

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

type VersionConstraint struct {
	Min         string
	Recommended string
	Max         string
	Pattern     *regexp.Regexp
}

type ValidationResult struct {
	File     string
	Line     int
	Component string
	Version  string
	Issue    string
	Severity string // ERROR, WARNING, INFO
}

var (
	pathFlag    = flag.String("path", ".", "Path to scan for YAML files")
	verboseFlag = flag.Bool("verbose", false, "Enable verbose output")
	strictFlag  = flag.Bool("strict", false, "Fail on warnings")
)

func main() {
	flag.Parse()

	results := []ValidationResult{}
	errorCount := 0
	warningCount := 0

	// Walk through all YAML files
	err := filepath.WalkDir(*pathFlag, func(path string, d fs.DirEntry, err error) error {
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

		fileResults := validateFile(path)
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
		log.Fatalf("Error walking directory: %v", err)
	}

	// Print results
	printResults(results)

	// Print summary
	fmt.Printf("\n========================================\n")
	fmt.Printf("Validation Summary\n")
	fmt.Printf("========================================\n")
	fmt.Printf("Files scanned: %d\n", len(results))
	fmt.Printf("Errors found: %d\n", errorCount)
	fmt.Printf("Warnings found: %d\n", warningCount)

	// Exit code
	if errorCount > 0 {
		fmt.Printf("\n❌ Validation FAILED with %d errors\n", errorCount)
		os.Exit(1)
	} else if warningCount > 0 && *strictFlag {
		fmt.Printf("\n⚠️ Validation FAILED with %d warnings (strict mode)\n", warningCount)
		os.Exit(1)
	} else {
		fmt.Printf("\n✅ Validation PASSED\n")
		os.Exit(0)
	}
}

func validateFile(filepath string) []ValidationResult {
	results := []ValidationResult{}

	file, err := os.Open(filepath)
	if err != nil {
		log.Printf("Error opening file %s: %v", filepath, err)
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
					result := validateVersion(filepath, lineNum, component, version, constraint)
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
				if *verboseFlag {
					results = append(results, ValidationResult{
						File:     filepath,
						Line:     lineNum,
						Component: "API",
						Version:  apiVersion,
						Issue:    fmt.Sprintf("Valid API version for %s", description),
						Severity: "INFO",
					})
				}
			}
		}

		// Check for deprecated patterns
		if strings.Contains(line, "zookeeper.connect") && strings.Contains(filepath, "kafka") {
			results = append(results, ValidationResult{
				File:     filepath,
				Line:     lineNum,
				Component: "Kafka",
				Version:  "ZooKeeper mode",
				Issue:    "ZooKeeper is deprecated in Kafka 3.8.x, use KRaft mode",
				Severity: "WARNING",
			})
		}

		// Check for old kpt versions
		if strings.Contains(line, "beta.27") && strings.Contains(line, "kpt") {
			results = append(results, ValidationResult{
				File:     filepath,
				Line:     lineNum,
				Component: "kpt",
				Version:  "v1.0.0-beta.27",
				Issue:    "Outdated kpt version, upgrade to v1.0.0-beta.55+",
				Severity: "WARNING",
			})
		}
	}

	return results
}

func validateVersion(file string, line int, component, version string, constraint VersionConstraint) *ValidationResult {
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

	// Compare versions (simplified - would use semver library in production)
	if compareVersions(version, constraint.Min) < 0 {
		return &ValidationResult{
			File:     file,
			Line:     line,
			Component: component,
			Version:  version,
			Issue:    fmt.Sprintf("Version %s is below minimum %s", version, constraint.Min),
			Severity: "ERROR",
		}
	}

	if compareVersions(version, constraint.Max) > 0 {
		return &ValidationResult{
			File:     file,
			Line:     line,
			Component: component,
			Version:  version,
			Issue:    fmt.Sprintf("Version %s exceeds maximum tested %s", version, constraint.Max),
			Severity: "WARNING",
		}
	}

	if version != constraint.Recommended && *verboseFlag {
		return &ValidationResult{
			File:     file,
			Line:     line,
			Component: component,
			Version:  version,
			Issue:    fmt.Sprintf("Consider upgrading to recommended version %s", constraint.Recommended),
			Severity: "INFO",
		}
	}

	return nil
}

func compareVersions(v1, v2 string) int {
	// Simplified version comparison
	// In production, use a proper semver library
	v1 = strings.TrimPrefix(v1, "v")
	v2 = strings.TrimPrefix(v2, "v")

	// Handle beta versions
	if strings.Contains(v1, "beta") && strings.Contains(v2, "beta") {
		// Extract beta numbers
		v1Parts := strings.Split(v1, "beta.")
		v2Parts := strings.Split(v2, "beta.")
		if len(v1Parts) > 1 && len(v2Parts) > 1 {
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

func printResults(results []ValidationResult) {
	if len(results) == 0 {
		fmt.Println("No issues found!")
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
		fmt.Println("\n❌ ERRORS:")
		for _, r := range errors {
			fmt.Printf("  %s:%d - %s %s: %s\n", r.File, r.Line, r.Component, r.Version, r.Issue)
		}
	}

	// Print warnings
	if len(warnings) > 0 {
		fmt.Println("\n⚠️  WARNINGS:")
		for _, r := range warnings {
			fmt.Printf("  %s:%d - %s %s: %s\n", r.File, r.Line, r.Component, r.Version, r.Issue)
		}
	}

	// Print info (only in verbose mode)
	if len(info) > 0 && *verboseFlag {
		fmt.Println("\nℹ️  INFO:")
		for _, r := range info {
			fmt.Printf("  %s:%d - %s %s: %s\n", r.File, r.Line, r.Component, r.Version, r.Issue)
		}
	}
}