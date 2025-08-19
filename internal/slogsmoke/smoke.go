package slogsmoke

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
)

// RunSmokeTests executes all slog smoke tests and writes output to the provided writer
func RunSmokeTests(w io.Writer) error {
	fmt.Fprintln(w, "=== SLOG Smoke Test ===")
	fmt.Fprintln(w)

	// Test 1: JSON Handler
	fmt.Fprintln(w, "Test 1: JSON Handler Output")
	fmt.Fprintln(w, "----------------------------")
	if err := RunJSONHandlerTest(w); err != nil {
		return fmt.Errorf("JSON handler test failed: %w", err)
	}
	fmt.Fprintln(w)

	// Test 2: Text Handler
	fmt.Fprintln(w, "Test 2: Text Handler Output")
	fmt.Fprintln(w, "----------------------------")
	if err := RunTextHandlerTest(w); err != nil {
		return fmt.Errorf("text handler test failed: %w", err)
	}
	fmt.Fprintln(w)

	// Test 3: Context logging
	fmt.Fprintln(w, "Test 3: Context Logging")
	fmt.Fprintln(w, "------------------------")
	if err := RunContextLoggingTest(w); err != nil {
		return fmt.Errorf("context logging test failed: %w", err)
	}
	fmt.Fprintln(w)

	// Test 4: Structured attributes
	fmt.Fprintln(w, "Test 4: Structured Attributes")
	fmt.Fprintln(w, "------------------------------")
	if err := RunStructuredAttributesTest(w); err != nil {
		return fmt.Errorf("structured attributes test failed: %w", err)
	}
	fmt.Fprintln(w)

	// Test 5: Log levels
	fmt.Fprintln(w, "Test 5: Log Levels")
	fmt.Fprintln(w, "------------------")
	if err := RunLogLevelsTest(w); err != nil {
		return fmt.Errorf("log levels test failed: %w", err)
	}
	fmt.Fprintln(w)

	// Test 6: Verify JSON keys
	fmt.Fprintln(w, "Test 6: Verify JSON Keys")
	fmt.Fprintln(w, "------------------------")
	if err := RunJSONKeysVerificationTest(w); err != nil {
		fmt.Fprintln(w, "❌ JSON keys verification FAILED")
		return fmt.Errorf("JSON keys verification failed: %w", err)
	}
	fmt.Fprintln(w, "✅ JSON keys verification PASSED")
	fmt.Fprintln(w)

	fmt.Fprintln(w, "=== All smoke tests completed successfully ===")
	return nil
}

// RunJSONHandlerTest tests JSON handler functionality
func RunJSONHandlerTest(w io.Writer) error {
	opts := &slog.HandlerOptions{
		Level:     slog.LevelDebug,
		AddSource: true,
	}
	handler := slog.NewJSONHandler(w, opts)
	logger := slog.New(handler)

	logger.Debug("Debug message", slog.String("handler", "json"))
	logger.Info("Info message", slog.String("handler", "json"))
	logger.Warn("Warning message", slog.String("handler", "json"))
	logger.Error("Error message", slog.String("handler", "json"))
	
	return nil
}

// RunTextHandlerTest tests text handler functionality
func RunTextHandlerTest(w io.Writer) error {
	opts := &slog.HandlerOptions{
		Level:     slog.LevelInfo,
		AddSource: false,
	}
	handler := slog.NewTextHandler(w, opts)
	logger := slog.New(handler)

	logger.Info("Info with text handler",
		slog.String("format", "text"),
		slog.Int("count", 42))
	logger.Warn("Warning with text handler",
		slog.Duration("elapsed", 1500*time.Millisecond))
	
	return nil
}

// RunContextLoggingTest tests context logging functionality
func RunContextLoggingTest(w io.Writer) error {
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	ctx := context.Background()
	ctx = context.WithValue(ctx, "correlation_id", uuid.New().String())
	ctx = context.WithValue(ctx, "user_id", "user-123")
	ctx = context.WithValue(ctx, "request_id", "req-456")

	correlationID, _ := ctx.Value("correlation_id").(string)
	userID, _ := ctx.Value("user_id").(string)
	requestID, _ := ctx.Value("request_id").(string)

	logger.InfoContext(ctx, "Processing request",
		slog.String("correlation_id", correlationID),
		slog.String("user_id", userID),
		slog.String("request_id", requestID),
		slog.String("operation", "test_context"))

	start := time.Now()
	time.Sleep(10 * time.Millisecond) // Reduced for tests
	
	logger.InfoContext(ctx, "Request completed",
		slog.String("correlation_id", correlationID),
		slog.Duration("duration", time.Since(start)),
		slog.String("status", "success"))
	
	return nil
}

// RunStructuredAttributesTest tests structured attributes functionality
func RunStructuredAttributesTest(w io.Writer) error {
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	serviceLogger := logger.With(
		slog.String("service", "nephio-orchestrator"),
		slog.String("version", "r5.0.1"),
		slog.String("environment", "production"),
	)

	serviceLogger.Info("Service started",
		slog.Int("port", 8080),
		slog.String("host", "0.0.0.0"))

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

	serviceLogger.Info("Batch processed",
		slog.Any("items", []string{"item1", "item2", "item3"}),
		slog.Int("batch_size", 3))
	
	return nil
}

// RunLogLevelsTest tests different log levels
func RunLogLevelsTest(w io.Writer) error {
	levels := []slog.Level{
		slog.LevelDebug,
		slog.LevelInfo,
		slog.LevelWarn,
		slog.LevelError,
	}

	for _, level := range levels {
		handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
			Level: level,
		})
		logger := slog.New(handler)

		logger.Debug("Debug level test", slog.String("level", level.String()))
		logger.Info("Info level test", slog.String("level", level.String()))
		logger.Warn("Warn level test", slog.String("level", level.String()))
		logger.Error("Error level test", slog.String("level", level.String()))
	}
	
	return nil
}

// RunJSONKeysVerificationTest verifies JSON output structure
func RunJSONKeysVerificationTest(w io.Writer) error {
	var buf strings.Builder
	handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	ctx := context.Background()
	logger.InfoContext(ctx, "Test message",
		slog.String("key1", "value1"),
		slog.Int("key2", 42),
		slog.Time("timestamp", time.Now()),
		slog.Duration("duration", 100*time.Millisecond),
		slog.Bool("flag", true),
	)

	var result map[string]interface{}
	output := buf.String()
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	requiredKeys := []string{"time", "level", "msg", "key1", "key2", "timestamp", "duration", "flag"}
	missingKeys := []string{}
	
	for _, key := range requiredKeys {
		if _, exists := result[key]; !exists {
			missingKeys = append(missingKeys, key)
		}
	}

	if len(missingKeys) > 0 {
		return fmt.Errorf("missing required keys: %v", missingKeys)
	}

	if result["key1"] != "value1" {
		return fmt.Errorf("expected key1='value1', got %v", result["key1"])
	}

	if int(result["key2"].(float64)) != 42 {
		return fmt.Errorf("expected key2=42, got %v", result["key2"])
	}

	if result["flag"] != true {
		return fmt.Errorf("expected flag=true, got %v", result["flag"])
	}

	fmt.Fprintf(w, "JSON output verified successfully\n")
	fmt.Fprintf(w, "Sample output: %s", output)
	return nil
}

// RunErrorLoggingTest demonstrates error logging patterns
func RunErrorLoggingTest(w io.Writer) error {
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(handler)

	err := fmt.Errorf("database connection failed: timeout after 30s")
	
	logger.Error("Operation failed",
		slog.String("operation", "database_connect"),
		slog.String("error", err.Error()),
		slog.String("severity", "critical"),
		slog.Bool("retryable", true),
		slog.Int("retry_count", 3),
		slog.Duration("retry_after", 5*time.Second),
	)
	
	return nil
}