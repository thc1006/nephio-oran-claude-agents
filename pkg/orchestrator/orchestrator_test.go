package orchestrator

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {
	// Setup test logger
	opts := &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}
	handler := slog.NewTextHandler(os.Stdout, opts)
	logger = slog.New(handler)

	os.Exit(m.Run())
}

func TestNewOrchestrator(t *testing.T) {
	tests := []struct {
		name         string
		setupContext func() context.Context
		checkID      bool
	}{
		{
			name: "with correlation ID",
			setupContext: func() context.Context {
				ctx := context.Background()
				return context.WithValue(ctx, "correlation_id", "test-correlation-id")
			},
			checkID: true,
		},
		{
			name: "without correlation ID",
			setupContext: func() context.Context {
				return context.Background()
			},
			checkID: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := tt.setupContext()
			orch := NewOrchestrator(ctx)

			if orch == nil {
				t.Fatal("NewOrchestrator returned nil")
			}

			if orch.httpClient == nil {
				t.Error("HTTP client not initialized")
			}

			if tt.checkID {
				if orch.correlationID != "test-correlation-id" {
					t.Errorf("Expected correlation ID 'test-correlation-id', got %s", orch.correlationID)
				}
			} else {
				if orch.correlationID == "" {
					t.Error("Correlation ID should be auto-generated when not provided")
				}
			}
		})
	}
}

func TestProcessWithRetry(t *testing.T) {
	tests := []struct {
		name        string
		data        []string
		timeout     time.Duration
		shouldError bool
	}{
		{
			name:        "successful processing",
			data:        []string{"item1", "item2", "item3"},
			timeout:     5 * time.Second,
			shouldError: false,
		},
		{
			name:        "empty data",
			data:        []string{},
			timeout:     5 * time.Second,
			shouldError: false,
		},
		{
			name:        "context timeout",
			data:        []string{"item1", "item2", "item3"},
			timeout:     1 * time.Millisecond, // Very short timeout to trigger error
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), tt.timeout)
			defer cancel()

			orch := NewOrchestrator(ctx)
			err := orch.ProcessWithRetry(ctx, tt.data)

			if tt.shouldError && err == nil {
				t.Error("Expected error but got nil")
			}

			if !tt.shouldError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestChunkSlice(t *testing.T) {
	tests := []struct {
		name            string
		input           []string
		chunkSize       int
		expectedBatches int
	}{
		{
			name:            "even chunks",
			input:           []string{"a", "b", "c", "d", "e", "f"},
			chunkSize:       2,
			expectedBatches: 3,
		},
		{
			name:            "uneven chunks",
			input:           []string{"a", "b", "c", "d", "e"},
			chunkSize:       2,
			expectedBatches: 3,
		},
		{
			name:            "single chunk",
			input:           []string{"a", "b"},
			chunkSize:       5,
			expectedBatches: 1,
		},
		{
			name:            "empty slice",
			input:           []string{},
			chunkSize:       2,
			expectedBatches: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			batches := 0
			totalItems := 0

			for batch := range ChunkSlice(tt.input, tt.chunkSize) {
				batches++
				totalItems += len(batch)

				if len(batch) > tt.chunkSize {
					t.Errorf("Batch size %d exceeds chunk size %d", len(batch), tt.chunkSize)
				}
			}

			if batches != tt.expectedBatches {
				t.Errorf("Expected %d batches, got %d", tt.expectedBatches, batches)
			}

			if totalItems != len(tt.input) {
				t.Errorf("Expected %d total items, got %d", len(tt.input), totalItems)
			}
		})
	}
}

func TestProcessBatchesWithIterator(t *testing.T) {
	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	items := []string{"item1", "item2", "item3", "item4", "item5"}
	batchSize := 2

	err := orch.ProcessBatchesWithIterator(ctx, items, batchSize)
	if err != nil {
		t.Errorf("ProcessBatchesWithIterator failed: %v", err)
	}
}

func TestProcessConcurrently(t *testing.T) {
	tests := []struct {
		name        string
		items       []string
		workers     int
		timeout     time.Duration
		shouldError bool
	}{
		{
			name:        "successful concurrent processing",
			items:       []string{"a", "b", "c", "d", "e"},
			workers:     3,
			timeout:     5 * time.Second,
			shouldError: false,
		},
		{
			name:        "single worker",
			items:       []string{"a", "b", "c"},
			workers:     1,
			timeout:     5 * time.Second,
			shouldError: false,
		},
		{
			name:        "empty items",
			items:       []string{},
			workers:     3,
			timeout:     5 * time.Second,
			shouldError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), tt.timeout)
			defer cancel()

			orch := NewOrchestrator(ctx)
			err := orch.ProcessConcurrently(ctx, tt.items, tt.workers)

			if tt.shouldError && err == nil {
				t.Error("Expected error but got nil")
			}

			if !tt.shouldError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestOrchestratorError(t *testing.T) {
	baseErr := errors.New("base error")
	orchErr := &OrchestratorError{
		Code:          "TEST_ERROR",
		Message:       "Test error message",
		Component:     "TestComponent",
		CorrelationID: "test-123",
		Severity:      SeverityError,
		Timestamp:     time.Now(),
		Err:           baseErr,
		Retryable:     true,
	}

	// Test Error() method
	errStr := orchErr.Error()
	if errStr == "" {
		t.Error("Error string should not be empty")
	}

	// Test Unwrap
	unwrapped := orchErr.Unwrap()
	if unwrapped != baseErr {
		t.Error("Unwrap should return the base error")
	}

	// Test without wrapped error
	orchErr2 := &OrchestratorError{
		Code:          "TEST_ERROR_2",
		Message:       "Test error without wrapped",
		Component:     "TestComponent",
		CorrelationID: "test-456",
		Severity:      SeverityWarning,
		Timestamp:     time.Now(),
		Err:           nil,
		Retryable:     false,
	}

	errStr2 := orchErr2.Error()
	if errStr2 == "" {
		t.Error("Error string should not be empty even without wrapped error")
	}
}

// BenchmarkChunkSlice benchmarks the chunk slice iterator
func BenchmarkChunkSlice(b *testing.B) {
	items := make([]string, 1000)
	for i := range items {
		items[i] = fmt.Sprintf("item%d", i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		count := 0
		for range ChunkSlice(items, 50) {
			count++
		}
	}
}

// BenchmarkProcessConcurrently benchmarks concurrent processing with different worker counts
func BenchmarkProcessConcurrently(b *testing.B) {
	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	items := make([]string, 100)
	for i := range items {
		items[i] = fmt.Sprintf("item%d", i)
	}

	workerCounts := []int{1, 2, 5, 10, 20}
	for _, workers := range workerCounts {
		b.Run(fmt.Sprintf("workers_%d", workers), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_ = orch.ProcessConcurrently(ctx, items, workers)
			}
		})
	}
}

// BenchmarkProcessWithRetry benchmarks retry processing with different data sizes
func BenchmarkProcessWithRetry(b *testing.B) {
	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	dataSizes := []int{10, 50, 100, 500}
	for _, size := range dataSizes {
		b.Run(fmt.Sprintf("data_size_%d", size), func(b *testing.B) {
			data := make([]string, size)
			for i := range data {
				data[i] = fmt.Sprintf("item%d", i)
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = orch.ProcessWithRetry(ctx, data)
			}
		})
	}
}

// BenchmarkChunkSliceIterator benchmarks the ChunkSlice iterator with different sizes
func BenchmarkChunkSliceIterator(b *testing.B) {
	items := make([]string, 1000)
	for i := range items {
		items[i] = fmt.Sprintf("item%d", i)
	}

	chunkSizes := []int{5, 10, 25, 50, 100}
	for _, chunkSize := range chunkSizes {
		b.Run(fmt.Sprintf("chunk_size_%d", chunkSize), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				count := 0
				for range ChunkSlice(items, chunkSize) {
					count++
				}
			}
		})
	}
}

// Test memory usage patterns
func TestMemoryUsage(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping memory usage test in short mode")
	}

	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	// Test with moderate data sets for CI efficiency (reduced from 10000)
	largeData := make([]string, 1000)
	for i := range largeData {
		largeData[i] = fmt.Sprintf("large_item_%d", i)
	}

	// Process in chunks to avoid timeout
	err := orch.ProcessBatchesWithIterator(ctx, largeData, 50)
	assert.NoError(t, err)
}

// Test concurrent safety
func TestConcurrentSafety(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping concurrent safety test in short mode")
	}

	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	var wg sync.WaitGroup
	goroutineCount := 3     // Reduced from 10
	itemsPerGoroutine := 10 // Reduced from 50

	for i := 0; i < goroutineCount; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			items := make([]string, itemsPerGoroutine)
			for j := range items {
				items[j] = fmt.Sprintf("goroutine_%d_item_%d", id, j)
			}

			err := orch.ProcessConcurrently(ctx, items, 2) // Reduced worker count
			assert.NoError(t, err)
		}(i)
	}

	wg.Wait()
}

// Test context cancellation handling
func TestContextCancellation(t *testing.T) {
	tests := []struct {
		name     string
		timeout  time.Duration
		function string
	}{
		{"ProcessWithRetry timeout", 10 * time.Millisecond, "retry"},
		{"ProcessConcurrently timeout", 10 * time.Millisecond, "concurrent"},
		{"ProcessBatchesWithIterator timeout", 10 * time.Millisecond, "batch"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), tt.timeout)
			defer cancel()

			orch := NewOrchestrator(ctx)
			items := make([]string, 100)
			for i := range items {
				items[i] = fmt.Sprintf("item%d", i)
			}

			var err error
			switch tt.function {
			case "retry":
				err = orch.ProcessWithRetry(ctx, items)
			case "concurrent":
				err = orch.ProcessConcurrently(ctx, items, 5)
			case "batch":
				err = orch.ProcessBatchesWithIterator(ctx, items, 10)
			}

			assert.Error(t, err)
			assert.Contains(t, err.Error(), "context deadline exceeded")
		})
	}
}

// Test HTTP client functionality
func TestMakeHTTPRequest(t *testing.T) {
	tests := []struct {
		name        string
		url         string
		expectError bool
	}{
		{
			name:        "invalid URL",
			url:         "not-a-valid-url",
			expectError: true,
		},
		{
			name:        "empty URL",
			url:         "",
			expectError: true,
		},
		{
			name:        "malformed URL",
			url:         "http://[invalid]:80/",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			orch := NewOrchestrator(ctx)

			resp, err := orch.MakeHTTPRequest(ctx, tt.url)

			if tt.expectError {
				assert.Error(t, err)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				if resp != nil {
					resp.Body.Close()
				}
			}
		})
	}
}

// Test error wrapping and unwrapping
func TestErrorHandling(t *testing.T) {
	baseErr := errors.New("base error")
	orchErr := &OrchestratorError{
		Code:          "TEST_ERROR",
		Message:       "Test error message",
		Component:     "TestComponent",
		CorrelationID: "test-123",
		Severity:      SeverityError,
		Timestamp:     time.Now(),
		Err:           baseErr,
		Retryable:     true,
	}

	// Test errors.Is functionality
	assert.True(t, errors.Is(orchErr, baseErr))

	// Test errors.As functionality
	var targetErr *OrchestratorError
	assert.True(t, errors.As(orchErr, &targetErr))
	assert.Equal(t, "TEST_ERROR", targetErr.Code)

	// Test error formatting
	errorStr := orchErr.Error()
	assert.Contains(t, errorStr, "TEST_ERROR")
	assert.Contains(t, errorStr, "TestComponent")
	assert.Contains(t, errorStr, "test-123")
}

// Test ProcessWithIteratorV2 with slices.All
func TestProcessWithIteratorV2(t *testing.T) {
	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	items := []string{"item1", "item2", "item3", "item4", "item5"}

	err := orch.ProcessWithIteratorV2(ctx, items)
	assert.NoError(t, err)
}

// Test edge cases and error conditions
func TestEdgeCases(t *testing.T) {
	t.Run("nil context", func(t *testing.T) {
		// Note: NewOrchestrator expects a valid context
		// This test checks behavior with background context
		orch := NewOrchestrator(context.Background())
		assert.NotNil(t, orch)
		assert.NotEmpty(t, orch.correlationID)
	})

	t.Run("empty data processing", func(t *testing.T) {
		ctx := context.Background()
		orch := NewOrchestrator(ctx)

		err := orch.ProcessWithRetry(ctx, []string{})
		assert.NoError(t, err)

		err = orch.ProcessConcurrently(ctx, []string{}, 5)
		assert.NoError(t, err)

		err = orch.ProcessBatchesWithIterator(ctx, []string{}, 10)
		assert.NoError(t, err)
	})

	t.Run("zero chunk size", func(t *testing.T) {
		items := []string{"item1", "item2", "item3"}

		// ChunkSlice should handle zero size gracefully
		count := 0
		for range ChunkSlice(items, 0) {
			count++
			if count > 10 { // Prevent infinite loop
				break
			}
		}
	})

	t.Run("negative worker count", func(t *testing.T) {
		ctx := context.Background()
		orch := NewOrchestrator(ctx)

		items := []string{"item1", "item2"}
		err := orch.ProcessConcurrently(ctx, items, -1)

		// Should handle gracefully - in our implementation, it processes successfully
		assert.NoError(t, err) // Current implementation handles negative workers gracefully
	})
}

// Integration test combining multiple orchestrator features
func TestOrchestratorIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	orch := NewOrchestrator(ctx)

	// Test full workflow with smaller dataset for CI efficiency
	large_dataset := make([]string, 100)
	for i := range large_dataset {
		large_dataset[i] = fmt.Sprintf("integration_item_%d", i)
	}

	// Process with different strategies
	t.Run("batch processing", func(t *testing.T) {
		err := orch.ProcessBatchesWithIterator(ctx, large_dataset, 10)
		assert.NoError(t, err)
	})

	t.Run("concurrent processing", func(t *testing.T) {
		err := orch.ProcessConcurrently(ctx, large_dataset[:20], 3)
		assert.NoError(t, err)
	})

	t.Run("retry processing", func(t *testing.T) {
		err := orch.ProcessWithRetry(ctx, large_dataset[:10])
		assert.NoError(t, err)
	})
}
