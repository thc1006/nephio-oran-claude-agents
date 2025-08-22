// Package orchestrator implements modernized Go 1.24.6 patterns for Nephio R5/O-RAN L Release
package orchestrator

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"slices"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/google/uuid"
)

// Package-level logger configured once
var logger *slog.Logger

func init() {
	// Initialize package-level logger with JSON handler
	opts := &slog.HandlerOptions{
		Level:     slog.LevelInfo,
		AddSource: true,
	}

	// Use JSON handler for production, Text for development
	if os.Getenv("LOG_FORMAT") == "text" {
		handler := slog.NewTextHandler(os.Stdout, opts)
		logger = slog.New(handler)
	} else {
		handler := slog.NewJSONHandler(os.Stdout, opts)
		logger = slog.New(handler)
	}
}

// ErrorSeverity represents the severity of an error
type ErrorSeverity int

const (
	SeverityInfo ErrorSeverity = iota
	SeverityWarning
	SeverityError
	SeverityCritical
)

// OrchestratorError provides structured error handling
type OrchestratorError struct {
	Code          string        `json:"code"`
	Message       string        `json:"message"`
	Component     string        `json:"component"`
	CorrelationID string        `json:"correlation_id"`
	Severity      ErrorSeverity `json:"severity"`
	Timestamp     time.Time     `json:"timestamp"`
	Err           error         `json:"-"`
	Retryable     bool          `json:"retryable"`
}

func (e *OrchestratorError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %s (correlation: %s) - %v",
			e.Code, e.Component, e.Message, e.CorrelationID, e.Err)
	}
	return fmt.Sprintf("[%s] %s: %s (correlation: %s)",
		e.Code, e.Component, e.Message, e.CorrelationID)
}

func (e *OrchestratorError) Unwrap() error {
	return e.Err
}

// Orchestrator manages network function orchestration
type Orchestrator struct {
	correlationID string
	httpClient    *http.Client
	mu            sync.RWMutex
}

// NewOrchestrator creates a new orchestrator with context
func NewOrchestrator(ctx context.Context) *Orchestrator {
	// Extract or generate correlation ID
	correlationID, ok := ctx.Value("correlation_id").(string)
	if !ok || correlationID == "" {
		correlationID = uuid.New().String()
	}

	// Create HTTP client with timeout
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     90 * time.Second,
		},
	}

	return &Orchestrator{
		correlationID: correlationID,
		httpClient:    httpClient,
	}
}

// ProcessWithRetry demonstrates modern retry with exponential backoff
func (o *Orchestrator) ProcessWithRetry(ctx context.Context, data []string) error {
	// Add timeout to context
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	// Log with context and correlation ID
	logger.InfoContext(ctx, "Starting processing with retry",
		slog.String("correlation_id", o.correlationID),
		slog.Int("data_count", len(data)),
		slog.String("operation", "process_with_retry"))

	// Configure exponential backoff
	expBackoff := backoff.NewExponentialBackOff()
	expBackoff.InitialInterval = 500 * time.Millisecond
	expBackoff.MaxInterval = 10 * time.Second
	expBackoff.MaxElapsedTime = 1 * time.Minute
	expBackoff.Multiplier = 2.0
	expBackoff.RandomizationFactor = 0.1

	// Wrap operation with backoff
	operation := func() error {
		select {
		case <-ctx.Done():
			logger.WarnContext(ctx, "Context cancelled during retry",
				slog.String("correlation_id", o.correlationID))
			return backoff.Permanent(ctx.Err())
		default:
		}

		// Actual processing logic
		if err := o.process(ctx, data); err != nil {
			// Determine if error is retryable
			var orchErr *OrchestratorError
			if errors.As(err, &orchErr) && !orchErr.Retryable {
				logger.ErrorContext(ctx, "Non-retryable error encountered",
					slog.String("correlation_id", o.correlationID),
					slog.String("error_code", orchErr.Code))
				return backoff.Permanent(err)
			}

			logger.WarnContext(ctx, "Retryable error, will retry",
				slog.String("correlation_id", o.correlationID),
				slog.String("error", err.Error()))
			return err
		}
		return nil
	}

	// Execute with retry
	if err := backoff.Retry(operation, backoff.WithContext(expBackoff, ctx)); err != nil {
		logger.ErrorContext(ctx, "Processing failed after retries",
			slog.String("correlation_id", o.correlationID),
			slog.String("error", err.Error()))
		return &OrchestratorError{
			Code:          "PROCESS_FAILED",
			Message:       "Failed to process data after retries",
			Component:     "Orchestrator",
			CorrelationID: o.correlationID,
			Severity:      SeverityCritical,
			Timestamp:     time.Now(),
			Err:           err,
			Retryable:     false,
		}
	}

	logger.InfoContext(ctx, "Processing completed successfully",
		slog.String("correlation_id", o.correlationID))
	return nil
}

// process simulates internal processing
func (o *Orchestrator) process(ctx context.Context, data []string) error {
	// Simulate processing with context check
	for i, item := range data {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			logger.DebugContext(ctx, "Processing item",
				slog.String("correlation_id", o.correlationID),
				slog.Int("index", i),
				slog.String("item", item))
			// Simulate work
			time.Sleep(10 * time.Millisecond)
		}
	}
	return nil
}

// ProcessBatchesWithIterator demonstrates modern iterator pattern for batch processing
func (o *Orchestrator) ProcessBatchesWithIterator(ctx context.Context, items []string, batchSize int) error {
	// Add timeout for entire batch processing
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	logger.InfoContext(ctx, "Starting batch processing with iterator",
		slog.String("correlation_id", o.correlationID),
		slog.Int("total_items", len(items)),
		slog.Int("batch_size", batchSize))

	// Use slices.Chunk for clean iteration (Go 1.23+)
	// For Go 1.24.6, we'll implement a compatible version
	batchNum := 0
	for batch := range ChunkSlice(items, batchSize) {
		batchNum++

		// Create batch-specific context with timeout
		batchCtx, batchCancel := context.WithTimeout(ctx, 30*time.Second)

		logger.DebugContext(batchCtx, "Processing batch",
			slog.String("correlation_id", o.correlationID),
			slog.Int("batch_num", batchNum),
			slog.Int("batch_size", len(batch)))

		// Process batch with retry
		err := o.processBatchWithBackoff(batchCtx, batch, batchNum)
		batchCancel()

		if err != nil {
			logger.ErrorContext(ctx, "Batch processing failed",
				slog.String("correlation_id", o.correlationID),
				slog.Int("batch_num", batchNum),
				slog.String("error", err.Error()))
			return err
		}
	}

	logger.InfoContext(ctx, "All batches processed successfully",
		slog.String("correlation_id", o.correlationID),
		slog.Int("total_batches", batchNum))
	return nil
}

// ChunkSlice implements iterator pattern for batch processing
// Compatible with Go 1.24.6 (slices.Chunk may not be available)
func ChunkSlice[T any](slice []T, size int) <-chan []T {
	ch := make(chan []T)
	go func() {
		defer close(ch)
		for i := 0; i < len(slice); i += size {
			end := i + size
			if end > len(slice) {
				end = len(slice)
			}
			ch <- slice[i:end]
		}
	}()
	return ch
}

// processBatchWithBackoff processes a batch with retry logic
func (o *Orchestrator) processBatchWithBackoff(ctx context.Context, batch []string, batchNum int) error {
	b := backoff.NewExponentialBackOff()
	b.MaxElapsedTime = 20 * time.Second
	b.InitialInterval = 100 * time.Millisecond

	operation := func() error {
		select {
		case <-ctx.Done():
			return backoff.Permanent(ctx.Err())
		default:
			// Simulate batch processing
			for _, item := range batch {
				if err := o.processItem(ctx, item); err != nil {
					return err
				}
			}
			return nil
		}
	}

	return backoff.Retry(operation, backoff.WithContext(b, ctx))
}

// processItem processes a single item
func (o *Orchestrator) processItem(ctx context.Context, item string) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
		// Simulate processing
		time.Sleep(5 * time.Millisecond)
		return nil
	}
}

// MakeHTTPRequest demonstrates HTTP call with proper timeout and context
func (o *Orchestrator) MakeHTTPRequest(ctx context.Context, url string) (*http.Response, error) {
	// Create request-specific timeout
	reqCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	logger.InfoContext(reqCtx, "Making HTTP request",
		slog.String("correlation_id", o.correlationID),
		slog.String("url", url))

	// Create request with context
	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, url, nil)
	if err != nil {
		logger.ErrorContext(reqCtx, "Failed to create request",
			slog.String("correlation_id", o.correlationID),
			slog.String("error", err.Error()))
		return nil, err
	}

	// Add correlation ID to headers
	req.Header.Set("X-Correlation-ID", o.correlationID)

	// Execute request with configured client
	resp, err := o.httpClient.Do(req)
	if err != nil {
		logger.ErrorContext(reqCtx, "HTTP request failed",
			slog.String("correlation_id", o.correlationID),
			slog.String("url", url),
			slog.String("error", err.Error()))
		return nil, err
	}

	logger.InfoContext(reqCtx, "HTTP request completed",
		slog.String("correlation_id", o.correlationID),
		slog.Int("status_code", resp.StatusCode))

	return resp, nil
}

// ProcessConcurrently demonstrates concurrent processing with proper context
func (o *Orchestrator) ProcessConcurrently(ctx context.Context, items []string, workers int) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Minute)
	defer cancel()

	logger.InfoContext(ctx, "Starting concurrent processing",
		slog.String("correlation_id", o.correlationID),
		slog.Int("items", len(items)),
		slog.Int("workers", workers))

	// Create channels
	itemChan := make(chan string, len(items))
	errChan := make(chan error, 1)
	var wg sync.WaitGroup

	// Add items to channel
	for _, item := range items {
		itemChan <- item
	}
	close(itemChan)

	// Start workers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()

			for item := range itemChan {
				select {
				case <-ctx.Done():
					select {
					case errChan <- ctx.Err():
					default:
					}
					return
				default:
					if err := o.processWithTimeout(ctx, item, workerID); err != nil {
						logger.ErrorContext(ctx, "Worker processing failed",
							slog.String("correlation_id", o.correlationID),
							slog.Int("worker_id", workerID),
							slog.String("item", item),
							slog.String("error", err.Error()))
						select {
						case errChan <- err:
						default:
						}
						return
					}
				}
			}
		}(i)
	}

	// Wait for completion or error
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.InfoContext(ctx, "Concurrent processing completed",
			slog.String("correlation_id", o.correlationID))
		return nil
	case err := <-errChan:
		cancel() // Cancel context to stop other workers
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}

// processWithTimeout processes an item with its own timeout
func (o *Orchestrator) processWithTimeout(ctx context.Context, item string, workerID int) error {
	// Item-specific timeout
	itemCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	logger.DebugContext(itemCtx, "Worker processing item",
		slog.String("correlation_id", o.correlationID),
		slog.Int("worker_id", workerID),
		slog.String("item", item))

	// Simulate processing
	select {
	case <-time.After(100 * time.Millisecond):
		return nil
	case <-itemCtx.Done():
		return itemCtx.Err()
	}
}

// ProcessWithIteratorV2 demonstrates using range over func (Go 1.23+)
func (o *Orchestrator) ProcessWithIteratorV2(ctx context.Context, items []string) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	logger.InfoContext(ctx, "Processing with iterator v2",
		slog.String("correlation_id", o.correlationID),
		slog.Int("items", len(items)))

	// Process items using iterator
	for i, item := range slices.All(items) {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			logger.DebugContext(ctx, "Processing item",
				slog.String("correlation_id", o.correlationID),
				slog.Int("index", i),
				slog.String("item", item))

			if err := o.processItem(ctx, item); err != nil {
				return err
			}
		}
	}

	return nil
}
