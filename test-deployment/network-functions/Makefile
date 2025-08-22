# O-RAN Network Functions Makefile
# Build and deploy O-RAN CU, DU, and RU network functions

.PHONY: all build-images deploy-namespace deploy-cu deploy-du deploy-ru deploy-all clean test lint security-scan

# Variables
DOCKER_REGISTRY ?= localhost:5000
IMAGE_TAG ?= latest
NAMESPACE = oran-network-functions
GO_VERSION = 1.24.6

# Default target
all: build-images deploy-all

# Build all Docker images
build-images: build-cu build-du build-ru

# Build CU image
build-cu:
	@echo "Building O-RAN Central Unit image..."
	cd cu && docker build -t $(DOCKER_REGISTRY)/oran/cu:$(IMAGE_TAG) -f Dockerfile .
	@echo "CU image built successfully"

# Build DU image  
build-du:
	@echo "Building O-RAN Distributed Unit image..."
	cd du && docker build -t $(DOCKER_REGISTRY)/oran/du:$(IMAGE_TAG) -f Dockerfile .
	@echo "DU image built successfully"

# Build RU image
build-ru:
	@echo "Building O-RAN Radio Unit image..."
	cd ru && docker build -t $(DOCKER_REGISTRY)/oran/ru:$(IMAGE_TAG) -f Dockerfile .
	@echo "RU image built successfully"

# Push images to registry
push-images: build-images
	@echo "Pushing images to registry..."
	docker push $(DOCKER_REGISTRY)/oran/cu:$(IMAGE_TAG)
	docker push $(DOCKER_REGISTRY)/oran/du:$(IMAGE_TAG) 
	docker push $(DOCKER_REGISTRY)/oran/ru:$(IMAGE_TAG)
	@echo "Images pushed successfully"

# Deploy namespace and common resources
deploy-namespace:
	@echo "Creating namespace and common resources..."
	kubectl apply -f namespace.yaml
	kubectl apply -f monitoring.yaml
	@echo "Namespace deployed successfully"

# Deploy CU
deploy-cu:
	@echo "Deploying O-RAN Central Unit..."
	kubectl apply -f cu/manifests/deployment.yaml
	kubectl rollout status deployment/oran-cu -n $(NAMESPACE) --timeout=300s
	@echo "CU deployed successfully"

# Deploy DU
deploy-du:
	@echo "Deploying O-RAN Distributed Unit..."
	kubectl apply -f du/manifests/deployment.yaml
	kubectl rollout status deployment/oran-du -n $(NAMESPACE) --timeout=300s
	@echo "DU deployed successfully"

# Deploy RU
deploy-ru:
	@echo "Deploying O-RAN Radio Unit..."
	kubectl apply -f ru/manifests/deployment.yaml
	kubectl rollout status deployment/oran-ru -n $(NAMESPACE) --timeout=300s
	@echo "RU deployed successfully"

# Deploy all network functions
deploy-all: deploy-namespace deploy-cu deploy-du deploy-ru
	@echo "All O-RAN Network Functions deployed successfully"
	@echo "Checking service status..."
	kubectl get pods,svc -n $(NAMESPACE)

# Test network functions
test: test-build test-unit test-integration test-e2e

test-build:
	@echo "Testing Go build for all components..."
	cd cu/src && go build -v ./...
	cd du/src && go build -v ./...
	cd ru/src && go build -v ./...
	@echo "Build tests passed"

test-unit:
	@echo "Running unit tests..."
	cd cu/src && go test -v -race -coverprofile=coverage.out ./...
	cd du/src && go test -v -race -coverprofile=coverage.out ./...
	cd ru/src && go test -v -race -coverprofile=coverage.out ./...
	@echo "Unit tests passed"

test-integration:
	@echo "Running integration tests..."
	kubectl apply -f test/integration/
	kubectl wait --for=condition=complete job/integration-test -n $(NAMESPACE) --timeout=600s
	@echo "Integration tests passed"

test-e2e:
	@echo "Running end-to-end tests..."
	kubectl apply -f test/e2e/
	kubectl wait --for=condition=complete job/e2e-test -n $(NAMESPACE) --timeout=900s
	@echo "E2E tests passed"

# Lint Go code
lint:
	@echo "Running linters..."
	cd cu/src && golangci-lint run --config ../../.golangci.yml
	cd du/src && golangci-lint run --config ../../.golangci.yml
	cd ru/src && golangci-lint run --config ../../.golangci.yml
	@echo "Linting completed"

# Security scanning
security-scan: security-scan-code security-scan-images security-scan-k8s

security-scan-code:
	@echo "Running security scan on Go code..."
	cd cu/src && gosec -fmt sarif -out gosec-results.sarif ./...
	cd du/src && gosec -fmt sarif -out gosec-results.sarif ./...
	cd ru/src && gosec -fmt sarif -out gosec-results.sarif ./...
	@echo "Code security scan completed"

security-scan-images:
	@echo "Running security scan on container images..."
	trivy image --severity CRITICAL,HIGH $(DOCKER_REGISTRY)/oran/cu:$(IMAGE_TAG)
	trivy image --severity CRITICAL,HIGH $(DOCKER_REGISTRY)/oran/du:$(IMAGE_TAG)
	trivy image --severity CRITICAL,HIGH $(DOCKER_REGISTRY)/oran/ru:$(IMAGE_TAG)
	@echo "Image security scan completed"

security-scan-k8s:
	@echo "Running security scan on Kubernetes manifests..."
	kubesec scan cu/manifests/deployment.yaml
	kubesec scan du/manifests/deployment.yaml
	kubesec scan ru/manifests/deployment.yaml
	@echo "Kubernetes security scan completed"

# Performance testing
perf-test:
	@echo "Running performance tests..."
	kubectl apply -f test/performance/
	kubectl wait --for=condition=complete job/performance-test -n $(NAMESPACE) --timeout=1200s
	@echo "Performance tests completed"

# Monitoring setup
setup-monitoring:
	@echo "Setting up monitoring stack..."
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo add grafana https://grafana.github.io/helm-charts
	helm repo update
	
	helm install prometheus prometheus-community/kube-prometheus-stack \
		--namespace monitoring --create-namespace \
		--values monitoring/prometheus-values.yaml
	
	helm install jaeger jaegertracing/jaeger \
		--namespace istio-system \
		--values monitoring/jaeger-values.yaml
	@echo "Monitoring stack deployed"

# Certificate management
setup-certs:
	@echo "Setting up certificates..."
	kubectl apply -f security/cert-manager.yaml
	kubectl apply -f security/ca-issuer.yaml
	kubectl apply -f security/certificates.yaml
	@echo "Certificates configured"

# Istio service mesh setup
setup-istio:
	@echo "Setting up Istio service mesh..."
	istioctl install --set values.defaultRevision=default -y
	kubectl label namespace $(NAMESPACE) istio-injection=enabled --overwrite
	kubectl apply -f istio/
	@echo "Istio service mesh configured"

# Status check
status:
	@echo "Checking O-RAN Network Functions status..."
	kubectl get pods,svc,vs,dr -n $(NAMESPACE)
	kubectl get peerauthentication,authorizationpolicy -n $(NAMESPACE)
	
	@echo "\nChecking health endpoints..."
	kubectl port-forward -n $(NAMESPACE) svc/oran-cu-service 9090:9090 &
	sleep 2
	curl -s http://localhost:9090/health || echo "CU health check failed"
	pkill -f "port-forward.*oran-cu-service" || true
	
	kubectl port-forward -n $(NAMESPACE) svc/oran-du-service 9091:9091 &
	sleep 2
	curl -s http://localhost:9091/health || echo "DU health check failed"
	pkill -f "port-forward.*oran-du-service" || true
	
	kubectl port-forward -n $(NAMESPACE) svc/oran-ru-service 9092:9092 &
	sleep 2
	curl -s http://localhost:9092/health || echo "RU health check failed"
	pkill -f "port-forward.*oran-ru-service" || true

# Logs
logs:
	@echo "Fetching logs from O-RAN Network Functions..."
	kubectl logs -n $(NAMESPACE) -l app=oran-cu --tail=100
	kubectl logs -n $(NAMESPACE) -l app=oran-du --tail=100
	kubectl logs -n $(NAMESPACE) -l app=oran-ru --tail=100

# Debug
debug:
	@echo "Debug information for O-RAN Network Functions..."
	kubectl describe pods -n $(NAMESPACE)
	kubectl get events -n $(NAMESPACE) --sort-by=.metadata.creationTimestamp

# Cleanup
clean:
	@echo "Cleaning up O-RAN Network Functions..."
	kubectl delete -f ru/manifests/deployment.yaml --ignore-not-found=true
	kubectl delete -f du/manifests/deployment.yaml --ignore-not-found=true
	kubectl delete -f cu/manifests/deployment.yaml --ignore-not-found=true
	kubectl delete -f monitoring.yaml --ignore-not-found=true
	kubectl delete -f namespace.yaml --ignore-not-found=true
	@echo "Cleanup completed"

# Clean all (including images)
clean-all: clean
	@echo "Removing Docker images..."
	docker rmi $(DOCKER_REGISTRY)/oran/cu:$(IMAGE_TAG) || true
	docker rmi $(DOCKER_REGISTRY)/oran/du:$(IMAGE_TAG) || true
	docker rmi $(DOCKER_REGISTRY)/oran/ru:$(IMAGE_TAG) || true
	@echo "All resources cleaned"

# Development helpers
dev-setup:
	@echo "Setting up development environment..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/sast-scan/cmd/gosec@latest
	curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b $(HOME)/bin
	@echo "Development tools installed"

# Documentation
docs:
	@echo "Generating documentation..."
	cd cu/src && godoc -http=:6060 &
	cd du/src && godoc -http=:6061 &
	cd ru/src && godoc -http=:6062 &
	@echo "Documentation servers started"
	@echo "CU docs: http://localhost:6060"
	@echo "DU docs: http://localhost:6061"
	@echo "RU docs: http://localhost:6062"

# Help
help:
	@echo "O-RAN Network Functions Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  all                - Build images and deploy all components"
	@echo "  build-images       - Build all Docker images"
	@echo "  push-images        - Push images to registry"
	@echo "  deploy-all         - Deploy all network functions"
	@echo "  test               - Run all tests"
	@echo "  lint               - Run code linters"
	@echo "  security-scan      - Run security scans"
	@echo "  perf-test          - Run performance tests"
	@echo "  setup-monitoring   - Deploy monitoring stack"
	@echo "  setup-certs        - Configure certificates"
	@echo "  setup-istio        - Configure service mesh"
	@echo "  status             - Check deployment status"
	@echo "  logs               - Show component logs"
	@echo "  debug              - Show debug information"
	@echo "  clean              - Remove all deployments"
	@echo "  clean-all          - Remove deployments and images"
	@echo "  dev-setup          - Setup development tools"
	@echo "  docs               - Generate documentation"
	@echo "  help               - Show this help message"
	@echo ""
	@echo "Variables:"
	@echo "  DOCKER_REGISTRY    - Docker registry (default: localhost:5000)"
	@echo "  IMAGE_TAG          - Image tag (default: latest)"
	@echo "  NAMESPACE          - Kubernetes namespace (default: oran-network-functions)"