// slog_smoke.go - Smoke test for slog implementation  
// Run with: go run cmd/slog-smoke/main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

func main() {
	fmt.Println("=== SLOG Smoke Test ===")
	fmt.Println()

	// Test 1: JSON Handler
	fmt.Println("Test 1: JSON Handler Output")
	fmt.Println("----------------------------")
	testJSONHandler()
	fmt.Println()

	// Test 2: Text Handler
	fmt.Println("Test 2: Text Handler Output")
	fmt.Println("----------------------------")
	testTextHandler()
	fmt.Println()

	// Test 3: Context logging
	fmt.Println("Test 3: Context Logging")
	fmt.Println("------------------------")
	testContextLogging()
	fmt.Println()

	// Test 4: Structured attributes
	fmt.Println("Test 4: Structured Attributes")
	fmt.Println("------------------------------")
	testStructuredAttributes()
	fmt.Println()

	// Test 5: Log levels
	fmt.Println("Test 5: Log Levels")
	fmt.Println("------------------")
	testLogLevels()
	fmt.Println()

	// Test 6: Verify JSON keys
	fmt.Println("Test 6: Verify JSON Keys")
	fmt.Println("------------------------")
	if verifyJSONKeys() {
		fmt.Println("✅ JSON keys verification PASSED")
	} else {
		fmt.Println("❌ JSON keys verification FAILED")
		os.Exit(1)
	}
	fmt.Println()

	fmt.Println("=== All smoke tests completed successfully ===")
}

func testJSONHandler() {
	// Create JSON handler
	opts := &slog.HandlerOptions{
		Level:     slog.LevelDebug,
		AddSource: true,
	}
	handler := slog.NewJSONHandler(os.Stdout, opts)
	logger := slog.New(handler)

	// Log various levels
	logger.Debug("Debug message", slog.String("handler", "json"))
	logger.Info("Info message", slog.String("handler", "json"))
	logger.Warn("Warning message", slog.String("handler", "json"))
	logger.Error("Error message", slog.String("handler", "json"))
}

func testTextHandler() {
	// Create Text handler
	opts := &slog.HandlerOptions{
		Level:     slog.LevelInfo,
		AddSource: false,
	}
	handler := slog.NewTextHandler(os.Stdout, opts)
	logger := slog.New(handler)

	// Log with text handler
	logger.Info("Info with text handler",
		slog.String("format", "text"),
		slog.Int("count", 42))
	logger.Warn("Warning with text handler",
		slog.Duration("elapsed", 1500*time.Millisecond))
}

func testContextLogging() {
	// Setup logger
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	// Create context with values
	ctx := context.Background()
	ctx = context.WithValue(ctx, "correlation_id", uuid.New().String())
	ctx = context.WithValue(ctx, "user_id", "user-123")
	ctx = context.WithValue(ctx, "request_id", "req-456")

	// Extract values and log with context
	correlationID, _ := ctx.Value("correlation_id").(string)
	userID, _ := ctx.Value("user_id").(string)
	requestID, _ := ctx.Value("request_id").(string)

	// Log with context
	logger.InfoContext(ctx, "Processing request",
		slog.String("correlation_id", correlationID),
		slog.String("user_id", userID),
		slog.String("request_id", requestID),
		slog.String("operation", "test_context"))

	// Simulate operation with timing
	start := time.Now()
	time.Sleep(100 * time.Millisecond)
	
	logger.InfoContext(ctx, "Request completed",
		slog.String("correlation_id", correlationID),
		slog.Duration("duration", time.Since(start)),
		slog.String("status", "success"))
}

func testStructuredAttributes() {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	// Create logger with common attributes
	serviceLogger := logger.With(
		slog.String("service", "nephio-orchestrator"),
		slog.String("version", "r5.0.1"),
		slog.String("environment", "production"),
	)

	// Log with service context
	serviceLogger.Info("Service started",
		slog.Int("port", 8080),
		slog.String("host", "0.0.0.0"))

	// Nested groups
	serviceLogger.Info("Metrics collected",
		slog.Group("metrics",
			slog.Int("requests", 1000),
			slog.Float64("latency_ms", 25.5),
			slog.Int("errors", 3),
		),
		slog.Group("resources",
			slog.Float64("cpu_percent", 45.2),
			slog.Float64("memory_mb", 512.7),
		))

	// Array of values
	serviceLogger.Info("Batch processed",
		slog.Any("items", []string{"item1", "item2", "item3"}),
		slog.Int("batch_size", 3))
}

func testLogLevels() {
	// Test different log levels
	levels := []slog.Level{
		slog.LevelDebug,
		slog.LevelInfo,
		slog.LevelWarn,
		slog.LevelError,
	}

	for _, level := range levels {
		handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: level,
		})
		logger := slog.New(handler)

		// This will only show if level is Debug or lower
		logger.Debug("Debug level test", slog.String("level", level.String()))
		
		// This will show for Info and lower
		logger.Info("Info level test", slog.String("level", level.String()))
		
		// This will show for Warn and lower
		logger.Warn("Warn level test", slog.String("level", level.String()))
		
		// This will always show
		logger.Error("Error level test", slog.String("level", level.String()))
	}
}

func verifyJSONKeys() bool {
	// Create a custom writer to capture output
	var buf strings.Builder
	handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	// Log a test message
	ctx := context.Background()
	logger.InfoContext(ctx, "Test message",
		slog.String("key1", "value1"),
		slog.Int("key2", 42),
		slog.Time("timestamp", time.Now()),
		slog.Duration("duration", 100*time.Millisecond),
		slog.Bool("flag", true),
	)

	// Parse the JSON output
	var result map[string]interface{}
	output := buf.String()
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		fmt.Printf("Failed to parse JSON: %v\n", err)
		fmt.Printf("Output was: %s\n", output)
		return false
	}

	// Verify expected keys exist
	requiredKeys := []string{"time", "level", "msg", "key1", "key2", "timestamp", "duration", "flag"}
	missingKeys := []string{}
	
	for _, key := range requiredKeys {
		if _, exists := result[key]; !exists {
			missingKeys = append(missingKeys, key)
		}
	}

	if len(missingKeys) > 0 {
		fmt.Printf("Missing required keys: %v\n", missingKeys)
		return false
	}

	// Verify values
	if result["key1"] != "value1" {
		fmt.Printf("Expected key1='value1', got %v\n", result["key1"])
		return false
	}

	// JSON numbers are float64 by default
	if int(result["key2"].(float64)) != 42 {
		fmt.Printf("Expected key2=42, got %v\n", result["key2"])
		return false
	}

	if result["flag"] != true {
		fmt.Printf("Expected flag=true, got %v\n", result["flag"])
		return false
	}

	fmt.Printf("JSON output verified successfully\n")
	fmt.Printf("Sample output: %s", output)
	return true
}

// TestError demonstrates error logging patterns
func testErrorLogging() {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	// Simulate an error with context
	err := fmt.Errorf("database connection failed: timeout after 30s")
	
	logger.Error("Operation failed",
		slog.String("operation", "database_connect"),
		slog.String("error", err.Error()),
		slog.String("severity", "critical"),
		slog.Bool("retryable", true),
		slog.Int("retry_count", 3),
		slog.Duration("retry_after", 5*time.Second),
	)
}