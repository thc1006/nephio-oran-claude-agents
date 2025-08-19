// slog_smoke.go - Smoke test for slog implementation  
// Run with: go run cmd/slog-smoke/main.go
package main

import (
	"os"

	"github.com/nephio-oran-claude-agents/internal/slogsmoke"
)

func main() {
	if err := slogsmoke.RunSmokeTests(os.Stdout); err != nil {
		os.Exit(1)
	}
}