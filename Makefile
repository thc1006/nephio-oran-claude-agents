# Makefile for Nephio O-RAN Claude Agents
# Contains version definitions and common tasks

# Version Variables
KPT_VERSION := v1.0.0-beta.55
GO_VERSION := 1.24.6
KUBERNETES_VERSION := 1.32.x
NEPHIO_VERSION := v5.0.0

# kpt Installation and Configuration
.PHONY: install-kpt
install-kpt:
	@echo "Installing kpt $(KPT_VERSION)..."
	@if command -v kpt >/dev/null 2>&1; then \
		CURRENT_VERSION=$$(kpt version --short 2>/dev/null | grep -o 'v[0-9].*' || echo "unknown"); \
		if [ "$$CURRENT_VERSION" != "$(KPT_VERSION)" ]; then \
			echo "Current kpt version: $$CURRENT_VERSION"; \
			echo "Required version: $(KPT_VERSION)"; \
			echo "Installing required version..."; \
		else \
			echo "kpt $(KPT_VERSION) already installed"; \
			exit 0; \
		fi; \
	fi
	@case "$$(uname -s)" in \
		Linux*) \
			curl -L https://github.com/kptdev/kpt/releases/download/$(KPT_VERSION)/kpt_linux_amd64 -o /tmp/kpt && \
			chmod +x /tmp/kpt && \
			sudo mv /tmp/kpt /usr/local/bin/kpt; \
			;; \
		Darwin*) \
			curl -L https://github.com/kptdev/kpt/releases/download/$(KPT_VERSION)/kpt_darwin_amd64 -o /tmp/kpt && \
			chmod +x /tmp/kpt && \
			sudo mv /tmp/kpt /usr/local/bin/kpt; \
			;; \
		*) \
			echo "Unsupported platform: $$(uname -s)"; \
			exit 1; \
			;; \
	esac
	@echo "kpt $(KPT_VERSION) installed successfully"

.PHONY: verify-kpt
verify-kpt:
	@echo "Verifying kpt installation..."
	@if ! command -v kpt >/dev/null 2>&1; then \
		echo "ERROR: kpt not found in PATH"; \
		echo "Run 'make install-kpt' to install kpt $(KPT_VERSION)"; \
		exit 1; \
	fi
	@CURRENT_VERSION=$$(kpt version --short 2>/dev/null | grep -o 'v[0-9].*' || echo "unknown"); \
	if [ "$$CURRENT_VERSION" != "$(KPT_VERSION)" ]; then \
		echo "WARNING: kpt version mismatch"; \
		echo "Current: $$CURRENT_VERSION"; \
		echo "Required: $(KPT_VERSION)"; \
		echo "Run 'make install-kpt' to install the correct version"; \
		exit 1; \
	else \
		echo "✓ kpt $(KPT_VERSION) verified"; \
	fi

.PHONY: doctor
doctor: verify-kpt
	@echo "Running dependency doctor checks..."
	@./scripts/verify_versions.sh
	@if [ -f "scripts/doctor.sh" ]; then \
		./scripts/doctor.sh; \
	fi

.PHONY: update-kpt-references
update-kpt-references:
	@echo "Updating kpt version references to $(KPT_VERSION)..."
	@find . -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name "*.go" \) \
		-not -path "./.git/*" \
		-not -name "Makefile" \
		-exec grep -l "v1\.0\.0-beta\.27" {} \; | \
		xargs -r sed -i.bak 's/v1\.0\.0-beta\.27/$(KPT_VERSION)/g'
	@echo "Updated kpt references to $(KPT_VERSION)"
	@echo "Backup files created with .bak extension"

.PHONY: clean-backups
clean-backups:
	@echo "Cleaning backup files..."
	@find . -name "*.bak" -type f -delete
	@echo "Backup files removed"

.PHONY: show-versions
show-versions:
	@echo "Version Configuration:"
	@echo "  KPT_VERSION: $(KPT_VERSION)"
	@echo "  GO_VERSION: $(GO_VERSION)"
	@echo "  KUBERNETES_VERSION: $(KUBERNETES_VERSION)"
	@echo "  NEPHIO_VERSION: $(NEPHIO_VERSION)"

# Development targets
.PHONY: test
test:
	@echo "Running Python tests..."
	@cd tests && python validate_agents.py
	@cd tests && python test_agent_scenarios.py

.PHONY: validate
validate:
	@echo "Validating agent files..."
	@cd tests && python validate_agents.py

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install-kpt         Install kpt $(KPT_VERSION)"
	@echo "  verify-kpt          Verify kpt installation and version"
	@echo "  doctor              Run dependency doctor checks"
	@echo "  update-kpt-references Update all kpt version references"
	@echo "  clean-backups       Remove backup files created during updates"
	@echo "  show-versions       Display current version configuration"
	@echo "  test                Run Python tests for agents"
	@echo "  validate            Validate agent files"
	@echo "  help                Show this help message"

.DEFAULT_GOAL := help