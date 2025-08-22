package dagcheck

import (
	"bytes"
	"context"
	"os/exec"
	"strings"
	"testing"
)

func TestGeneratePNGVisualizationSuccess(t *testing.T) {
	// Save original function
	originalExecCommand := ExecCommand
	defer func() { ExecCommand = originalExecCommand }()

	// Mock successful command execution
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		return exec.Command("echo", "success")
	}

	var buf bytes.Buffer
	err := GeneratePNGVisualization("test.dot", true, &buf)

	if err != nil {
		t.Fatalf("GeneratePNGVisualization failed: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Generated PNG visualization: test.png") {
		t.Error("Expected success message not found in output")
	}
}

func TestGeneratePNGVisualizationFailure(t *testing.T) {
	// Save original function
	originalExecCommand := ExecCommand
	defer func() { ExecCommand = originalExecCommand }()

	// Mock failing command execution
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		return exec.Command("false") // Command that always fails
	}

	var buf bytes.Buffer
	err := GeneratePNGVisualization("test.dot", true, &buf)

	if err == nil {
		t.Fatal("Expected GeneratePNGVisualization to fail, but it succeeded")
	}

	output := buf.String()
	if !strings.Contains(output, "Could not generate PNG") {
		t.Error("Expected failure message not found in output")
	}
}

func TestGeneratePNGVisualizationQuiet(t *testing.T) {
	// Save original function
	originalExecCommand := ExecCommand
	defer func() { ExecCommand = originalExecCommand }()

	// Mock failing command execution
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		return exec.Command("false") // Command that always fails
	}

	var buf bytes.Buffer
	err := GeneratePNGVisualization("test.dot", false, &buf) // verbose = false

	if err == nil {
		t.Fatal("Expected GeneratePNGVisualization to fail, but it succeeded")
	}

	output := buf.String()
	// Should not output error message when verbose is false
	if strings.Contains(output, "Could not generate PNG") {
		t.Error("Did not expect failure message in quiet mode")
	}
}

func TestGenerateSVGVisualizationSuccess(t *testing.T) {
	// Save original function
	originalExecCommand := ExecCommand
	defer func() { ExecCommand = originalExecCommand }()

	// Mock successful command execution
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		return exec.Command("echo", "success")
	}

	var buf bytes.Buffer
	err := GenerateSVGVisualization("test.dot", true, &buf)

	if err != nil {
		t.Fatalf("GenerateSVGVisualization failed: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Generated SVG visualization: test.svg") {
		t.Error("Expected success message not found in output")
	}
}

func TestCheckGraphvizAvailable(t *testing.T) {
	// Save original function
	originalExecCommand := ExecCommand
	defer func() { ExecCommand = originalExecCommand }()

	// Test when Graphviz is available
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		return exec.Command("echo", "success")
	}

	if !CheckGraphvizAvailable() {
		t.Error("Expected CheckGraphvizAvailable to return true for successful command")
	}

	// Test when Graphviz is not available
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		return exec.Command("false")
	}

	if CheckGraphvizAvailable() {
		t.Error("Expected CheckGraphvizAvailable to return false for failing command")
	}
}

func TestDotFileExtensionHandling(t *testing.T) {
	// Save original function
	originalExecCommand := ExecCommand
	defer func() { ExecCommand = originalExecCommand }()

	// Mock successful command execution
	ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
		// Verify the output filename is correct
		if len(args) >= 3 && args[2] == "-o" && len(args) >= 4 {
			expectedOutput := args[3]
			if !strings.HasSuffix(expectedOutput, ".png") {
				t.Errorf("Expected output filename to end with .png, got %s", expectedOutput)
			}
		}
		return exec.Command("echo", "success")
	}

	var buf bytes.Buffer

	// Test with .dot extension
	err := GeneratePNGVisualization("agent_graph.dot", false, &buf)
	if err != nil {
		t.Fatalf("GeneratePNGVisualization failed: %v", err)
	}

	// Test with different extension (should still work)
	err = GeneratePNGVisualization("agent_graph.gv", false, &buf)
	if err != nil {
		t.Fatalf("GeneratePNGVisualization failed: %v", err)
	}
}
