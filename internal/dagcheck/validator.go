package dagcheck

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"strings"
)

// ExecCommand is an injectable function for running external commands
var ExecCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
	return exec.CommandContext(ctx, name, args...)
}

// GeneratePNGVisualization creates a PNG from DOT file using Graphviz
func GeneratePNGVisualization(dotFile string, verbose bool, out io.Writer) error {
	pngFile := strings.TrimSuffix(dotFile, ".dot") + ".png"

	ctx := context.Background()
	cmd := ExecCommand(ctx, "dot", "-Tpng", dotFile, "-o", pngFile)

	if err := cmd.Run(); err != nil {
		if verbose {
			fmt.Fprintf(out, "Could not generate PNG (Graphviz not available): %v\n", err)
		}
		return err
	}

	fmt.Fprintf(out, "Generated PNG visualization: %s\n", pngFile)
	return nil
}

// GenerateSVGVisualization creates an SVG from DOT file using Graphviz
func GenerateSVGVisualization(dotFile string, verbose bool, out io.Writer) error {
	svgFile := strings.TrimSuffix(dotFile, ".dot") + ".svg"

	ctx := context.Background()
	cmd := ExecCommand(ctx, "dot", "-Tsvg", dotFile, "-o", svgFile)

	if err := cmd.Run(); err != nil {
		if verbose {
			fmt.Fprintf(out, "Could not generate SVG (Graphviz not available): %v\n", err)
		}
		return err
	}

	fmt.Fprintf(out, "Generated SVG visualization: %s\n", svgFile)
	return nil
}

// CheckGraphvizAvailable checks if Graphviz dot command is available
func CheckGraphvizAvailable() bool {
	ctx := context.Background()
	cmd := ExecCommand(ctx, "dot", "-V")
	return cmd.Run() == nil
}
