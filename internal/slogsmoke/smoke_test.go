package slogsmoke

import (
	"bytes"
	"strings"
	"testing"
)

func TestRunSmokeTests(t *testing.T) {
	var buf bytes.Buffer
	err := RunSmokeTests(&buf)
	
	if err != nil {
		t.Fatalf("RunSmokeTests failed: %v", err)
	}
	
	output := buf.String()
	
	// Verify all test sections are present
	expectedSections := []string{
		"=== SLOG Smoke Test ===",
		"Test 1: JSON Handler Output",
		"Test 2: Text Handler Output",
		"Test 3: Context Logging",
		"Test 4: Structured Attributes",
		"Test 5: Log Levels",
		"Test 6: Verify JSON Keys",
		"✅ JSON keys verification PASSED",
		"=== All smoke tests completed successfully ===",
	}
	
	for _, section := range expectedSections {
		if !strings.Contains(output, section) {
			t.Errorf("Expected section %q not found in output", section)
		}
	}
}

func TestRunJSONHandlerTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunJSONHandlerTest(&buf)
	
	if err != nil {
		t.Fatalf("RunJSONHandlerTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should contain JSON formatted log lines
	if !strings.Contains(output, `"handler":"json"`) {
		t.Error("Expected JSON handler output not found")
	}
}

func TestRunTextHandlerTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunTextHandlerTest(&buf)
	
	if err != nil {
		t.Fatalf("RunTextHandlerTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should contain text formatted log lines
	if !strings.Contains(output, "format=text") {
		t.Error("Expected text handler output not found")
	}
}

func TestRunContextLoggingTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunContextLoggingTest(&buf)
	
	if err != nil {
		t.Fatalf("RunContextLoggingTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should contain context fields
	if !strings.Contains(output, "correlation_id") {
		t.Error("Expected correlation_id not found in context logging output")
	}
	if !strings.Contains(output, "user_id") {
		t.Error("Expected user_id not found in context logging output")
	}
}

func TestRunStructuredAttributesTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunStructuredAttributesTest(&buf)
	
	if err != nil {
		t.Fatalf("RunStructuredAttributesTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should contain structured data
	if !strings.Contains(output, "nephio-orchestrator") {
		t.Error("Expected service name not found in structured attributes output")
	}
}

func TestRunLogLevelsTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunLogLevelsTest(&buf)
	
	if err != nil {
		t.Fatalf("RunLogLevelsTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should contain different log levels
	levels := []string{"DEBUG", "INFO", "WARN", "ERROR"}
	for _, level := range levels {
		if !strings.Contains(output, level) {
			t.Errorf("Expected log level %s not found in output", level)
		}
	}
}

func TestRunJSONKeysVerificationTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunJSONKeysVerificationTest(&buf)
	
	if err != nil {
		t.Fatalf("RunJSONKeysVerificationTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should verify JSON structure
	if !strings.Contains(output, "JSON output verified successfully") {
		t.Error("Expected JSON verification success message not found")
	}
}

func TestRunErrorLoggingTest(t *testing.T) {
	var buf bytes.Buffer
	err := RunErrorLoggingTest(&buf)
	
	if err != nil {
		t.Fatalf("RunErrorLoggingTest failed: %v", err)
	}
	
	output := buf.String()
	
	// Should contain error context
	if !strings.Contains(output, "database connection failed") {
		t.Error("Expected error message not found in error logging output")
	}
}