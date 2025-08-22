package main

import (
	"flag"
	"log"
	"os"

	"github.com/nephio-oran-claude-agents/internal/verifymatrix"
)

var (
	pathFlag    = flag.String("path", ".", "Path to scan for YAML files")
	verboseFlag = flag.Bool("verbose", false, "Enable verbose output")
	strictFlag  = flag.Bool("strict", false, "Fail on warnings")
)

func main() {
	flag.Parse()

	config := verifymatrix.Config{
		Path:    *pathFlag,
		Verbose: *verboseFlag,
		Strict:  *strictFlag,
	}

	if err := verifymatrix.Run(config, os.Stdout); err != nil {
		log.Fatal(err)
	}
}
