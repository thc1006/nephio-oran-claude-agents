# O-RAN Central Unit (CU) Dockerfile
# Multi-stage build for security and efficiency

# Build stage
FROM golang:1.24.6-alpine AS builder

LABEL maintainer="O-RAN Development Team"
LABEL description="O-RAN Central Unit Network Function"
LABEL version="1.0.0"

# Security: Create non-root user for build
RUN adduser -D -s /bin/sh -u 10001 appuser

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache ca-certificates git tzdata && \
    update-ca-certificates

# Set working directory
WORKDIR /build

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY src/ ./

# Build with security flags and optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -a -installsuffix cgo \
    -ldflags '-w -s -extldflags "-static"' \
    -tags netgo \
    -o cu-app main.go

# Runtime stage
FROM scratch

# Import from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/passwd /etc/passwd

# Copy the binary
COPY --from=builder /build/cu-app /cu-app

# Use non-root user
USER 10001:10001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /cu-app --health-check || exit 1

# Metadata
LABEL org.opencontainers.image.title="O-RAN Central Unit"
LABEL org.opencontainers.image.description="O-RAN CU with F1, E1, and NGAP interfaces"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="2024-08-22T00:00:00Z"
LABEL org.opencontainers.image.revision="latest"
LABEL org.opencontainers.image.vendor="O-RAN Alliance"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Security labels
LABEL security.scan.required="true"
LABEL security.fips.enabled="false"
LABEL security.tls.required="true"

# Expose ports
EXPOSE 38472 38465 38412 9090

# Run the binary
ENTRYPOINT ["/cu-app"]