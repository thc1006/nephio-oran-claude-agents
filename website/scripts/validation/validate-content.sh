#!/bin/bash

# Content validation script for Nephio O-RAN Claude Agents documentation
# Shell script version for CI/CD pipelines

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    EXIT_CODE=1
}

# Arrays for banned phrases and required versions
BANNED_PHRASES=(
    "expected later"
    "2024-2025"
    "beta.27"
)

REQUIRED_VERSIONS=(
    "O-RAN L (2025-06-30)"
    "kpt v1.0.0-beta.55"
)

# Function to check banned phrases
check_banned_phrases() {
    log_info "Checking for banned phrases..."
    local found_issues=false
    
    for phrase in "${BANNED_PHRASES[@]}"; do
        log_info "Checking for: $phrase"
        
        # Search in multiple directories
        if grep -r --include="*.md" --include="*.mdx" --include="*.ts" --include="*.tsx" \
           "$phrase" "$PROJECT_ROOT/website/" "$PROJECT_ROOT/agents/" "$PROJECT_ROOT/docs/" 2>/dev/null; then
            log_error "Found banned phrase: $phrase"
            found_issues=true
        else
            log_success "No instances of: $phrase"
        fi
    done
    
    if [ "$found_issues" = false ]; then
        log_success "Banned phrases check passed"
    fi
}

# Function to check version consistency
check_version_consistency() {
    log_info "Checking version consistency..."
    local found_issues=false
    
    for version in "${REQUIRED_VERSIONS[@]}"; do
        log_info "Checking for: $version"
        
        if ! grep -r "$version" "$PROJECT_ROOT/website/" "$PROJECT_ROOT/agents/" "$PROJECT_ROOT/docs/" >/dev/null 2>&1; then
            log_error "Required version not found: $version"
            found_issues=true
        else
            log_success "Found required version: $version"
        fi
    done
    
    # Check Nephio R5 pattern
    log_info "Checking for Nephio R5 version pattern (v5.x)..."
    if ! grep -rE "Nephio R5.*v5\.[0-9]+" "$PROJECT_ROOT/website/" "$PROJECT_ROOT/agents/" "$PROJECT_ROOT/docs/" >/dev/null 2>&1; then
        log_warning "Nephio R5 version pattern not found - ensure version consistency"
    else
        log_success "Nephio R5 version pattern found"
    fi
    
    if [ "$found_issues" = false ]; then
        log_success "Version consistency check passed"
    fi
}

# Function to check Kubernetes version policy
check_kubernetes_policy() {
    log_info "Checking Kubernetes version policy references..."
    
    if grep -r "latest three minor releases\|three latest minor releases" \
       "$PROJECT_ROOT/website/" "$PROJECT_ROOT/agents/" "$PROJECT_ROOT/docs/" >/dev/null 2>&1; then
        log_success "Kubernetes version policy reference found"
    else
        log_warning "Kubernetes version policy not explicitly referenced"
    fi
}

# Function to validate markdown files
validate_markdown() {
    log_info "Validating Markdown files..."
    
    # Check if markdownlint is available
    if command -v markdownlint >/dev/null 2>&1; then
        # Create temporary markdownlint config
        cat > "$PROJECT_ROOT/.markdownlint-temp.json" << 'EOF'
{
  "default": true,
  "MD013": {
    "line_length": 120,
    "code_blocks": false,
    "tables": false
  },
  "MD033": false,
  "MD041": false,
  "MD036": false
}
EOF
        
        # Find markdown files
        local md_files=()
        while IFS= read -r -d '' file; do
            md_files+=("$file")
        done < <(find "$PROJECT_ROOT/website/docs" "$PROJECT_ROOT/website/blog" "$PROJECT_ROOT/agents" "$PROJECT_ROOT/docs" \
                 -name "*.md" -not -path "*/node_modules/*" -print0 2>/dev/null || true)
        
        if [ ${#md_files[@]} -gt 0 ]; then
            if markdownlint "${md_files[@]}" --config "$PROJECT_ROOT/.markdownlint-temp.json"; then
                log_success "Markdown linting passed"
            else
                log_error "Markdown linting failed"
            fi
        else
            log_warning "No markdown files found for linting"
        fi
        
        # Cleanup temp config
        rm -f "$PROJECT_ROOT/.markdownlint-temp.json"
    else
        log_warning "markdownlint not available, skipping markdown validation"
    fi
}

# Function to check for broken internal links
check_internal_links() {
    log_info "Checking for potentially broken internal links..."
    
    # Find markdown files and check for relative links
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            # Check for relative links that might be broken
            if grep -n "\](\.\/\|\]\(\.\.\/\)" "$file" 2>/dev/null; then
                log_warning "Found relative links in $file - verify they work correctly"
            fi
            
            # Check for missing alt text in images
            if grep -n "!\[\](" "$file" 2>/dev/null; then
                log_warning "Found images without alt text in $file"
            fi
        fi
    done < <(find "$PROJECT_ROOT/website" "$PROJECT_ROOT/agents" "$PROJECT_ROOT/docs" \
             -name "*.md" -o -name "*.mdx" -not -path "*/node_modules/*" -print0 2>/dev/null || true)
}

# Function to validate YAML front matter
validate_frontmatter() {
    log_info "Validating YAML front matter..."
    
    local files_with_issues=()
    
    # Check markdown files for front matter
    while IFS= read -r -d '' file; do
        if [ -f "$file" ] && head -n 1 "$file" | grep -q "^---$"; then
            # Extract front matter and validate basic YAML syntax
            local front_matter
            front_matter=$(sed -n '/^---$/,/^---$/p' "$file" | head -n -1 | tail -n +2)
            
            # Check for required fields (title)
            if ! echo "$front_matter" | grep -q "^title:"; then
                files_with_issues+=("$file: missing title field")
            fi
            
            # Check for balanced quotes (basic check)
            if echo "$front_matter" | grep -q '".*[^"]$'; then
                files_with_issues+=("$file: potential unbalanced quotes")
            fi
        fi
    done < <(find "$PROJECT_ROOT/website/docs" "$PROJECT_ROOT/website/blog" \
             -name "*.md" -o -name "*.mdx" -not -path "*/node_modules/*" -print0 2>/dev/null || true)
    
    if [ ${#files_with_issues[@]} -eq 0 ]; then
        log_success "Front matter validation passed"
    else
        for issue in "${files_with_issues[@]}"; do
            log_warning "Front matter issue: $issue"
        done
    fi
}

# Function to check file structure
check_file_structure() {
    log_info "Checking file structure..."
    
    # Check for essential Docusaurus files
    essential_files=(
        "website/docusaurus.config.ts"
        "website/package.json"
        "website/sidebars.ts"
    )
    
    for file in "${essential_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            log_error "Essential file missing: $file"
        else
            log_success "Found essential file: $file"
        fi
    done
    
    # Check for docs directory structure
    if [ ! -d "$PROJECT_ROOT/website/docs" ]; then
        log_error "docs directory missing"
    else
        log_success "docs directory found"
    fi
    
    # Check for at least one documentation file
    if ! find "$PROJECT_ROOT/website/docs" -name "*.md" -o -name "*.mdx" | head -n 1 | grep -q .; then
        log_error "No documentation files found in website/docs"
    else
        log_success "Documentation files found"
    fi
}

# Function to run TypeScript validation
validate_typescript() {
    log_info "Validating TypeScript files..."
    
    cd "$PROJECT_ROOT/website"
    
    # Check if TypeScript compiler is available
    if command -v tsc >/dev/null 2>&1; then
        if npm run typecheck; then
            log_success "TypeScript validation passed"
        else
            log_error "TypeScript validation failed"
        fi
    elif [ -f "node_modules/.bin/tsc" ]; then
        if npx tsc --noEmit; then
            log_success "TypeScript validation passed"
        else
            log_error "TypeScript validation failed"
        fi
    else
        log_warning "TypeScript compiler not available, skipping type checking"
    fi
    
    cd - > /dev/null
}

# Main execution
main() {
    log_info "Starting content validation for Nephio O-RAN Claude Agents documentation"
    log_info "Project root: $PROJECT_ROOT"
    
    # Run all validation checks
    check_file_structure
    check_banned_phrases
    check_version_consistency
    check_kubernetes_policy
    validate_markdown
    check_internal_links
    validate_frontmatter
    validate_typescript
    
    # Summary
    echo ""
    if [ $EXIT_CODE -eq 0 ]; then
        log_success "All content validation checks passed!"
    else
        log_error "Content validation failed with $EXIT_CODE error(s)"
        echo ""
        log_info "Please fix the issues above and run the validation again"
    fi
    
    exit $EXIT_CODE
}

# Show help
show_help() {
    echo "Content Validation Script for Nephio O-RAN Claude Agents"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --no-color     Disable colored output"
    echo ""
    echo "Environment variables:"
    echo "  PROJECT_ROOT   Override the project root directory"
    echo ""
    echo "This script validates:"
    echo "  • Banned phrases and terminology"
    echo "  • Version consistency (O-RAN L, Nephio R5, kpt)"
    echo "  • Kubernetes policy compliance"
    echo "  • Markdown file structure and syntax"
    echo "  • Internal link validity"
    echo "  • YAML front matter"
    echo "  • TypeScript compilation"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --no-color)
            RED=''
            GREEN=''
            YELLOW=''
            BLUE=''
            NC=''
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Override project root if environment variable is set
if [ -n "${PROJECT_ROOT:-}" ]; then
    PROJECT_ROOT="$PROJECT_ROOT"
fi

# Run main function
main "$@"