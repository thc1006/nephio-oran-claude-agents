#!/bin/bash

# verify_oran_links.sh - Validate O-RAN L Release alignment
# Exit codes: 0 = success, 1 = failure

set -e

echo "==========================================="
echo "O-RAN L Release Link & Reference Validator"
echo "==========================================="
echo ""

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_result() {
    if [ "$1" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED_CHECKS++))
    elif [ "$1" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED_CHECKS++))
    elif [ "$1" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $2"
        ((WARNINGS++))
    fi
    ((TOTAL_CHECKS++))
}

echo "1. Checking for 'upcoming L' references..."
echo "-------------------------------------------"

# Check for "upcoming L" references
if grep -r "upcoming L" --include="*.md" --include="*.yaml" --include="*.yml" agents/ docs/ examples/ 2>/dev/null; then
    print_result "FAIL" "Found 'upcoming L' references that should be updated"
else
    print_result "PASS" "No 'upcoming L' references found"
fi

# Check for "L Release expected" references
if grep -r "L Release expected" --include="*.md" --include="*.yaml" agents/ docs/ 2>/dev/null; then
    print_result "FAIL" "Found 'L Release expected' references that should be updated"
else
    print_result "PASS" "No 'L Release expected' references found"
fi

# Check for "Expected late 2025" references
if grep -r "Expected late 2025" --include="*.md" agents/ docs/ 2>/dev/null; then
    print_result "FAIL" "Found 'Expected late 2025' references that should be updated"
else
    print_result "PASS" "No 'Expected late 2025' references found"
fi

echo ""
echo "2. Verifying L Release current status..."
echo "----------------------------------------"

# Check for proper L Release date references
if grep -r "L Release (June 30, 2025)" --include="*.md" agents/ docs/ reports/ >/dev/null 2>&1; then
    print_result "PASS" "Found L Release (June 30, 2025) date references"
else
    print_result "WARN" "Missing L Release (June 30, 2025) date references"
fi

# Check for "✅ Current" status for O-RAN SC
if grep -r "O-RAN SC.*✅ Current" --include="*.md" agents/ >/dev/null 2>&1; then
    print_result "PASS" "O-RAN SC marked as current in version tables"
else
    print_result "WARN" "O-RAN SC not marked as current in some version tables"
fi

echo ""
echo "3. Checking documentation URLs..."
echo "---------------------------------"

# List of O-RAN documentation URLs to verify (using curl HEAD)
URLS=(
    "https://docs.o-ran-sc.org/projects/o-ran-sc-doc/en/latest/"
    "https://docs.o-ran-sc.org/projects/o-ran-sc-doc/en/latest/release-notes.html"
    "https://docs.o-ran-sc.org/projects/o-ran-sc-oam/en/latest/release-notes.html"
    "https://docs.o-ran-sc.org/projects/o-ran-sc-teiv/en/latest/release-notes.html"
    "https://docs.o-ran-sc.org/projects/o-ran-sc-o-du-l2/en/latest/release-notes.html"
    "https://o-ran-sc.org/"
)

for url in "${URLS[@]}"; do
    if curl -s --head --request GET "$url" | grep "200 OK" > /dev/null 2>&1; then
        print_result "PASS" "URL accessible: ${url:0:50}..."
    elif curl -s --head --request GET "$url" | grep "301\|302\|303\|307\|308" > /dev/null 2>&1; then
        print_result "WARN" "URL redirects: ${url:0:50}..."
    else
        # Try without curl if not available
        if command -v wget >/dev/null 2>&1; then
            if wget --spider "$url" 2>/dev/null; then
                print_result "PASS" "URL accessible (wget): ${url:0:50}..."
            else
                print_result "WARN" "Cannot verify URL: ${url:0:50}..."
            fi
        else
            print_result "WARN" "Cannot verify URL (no curl/wget): ${url:0:50}..."
        fi
    fi
done

echo ""
echo "4. Verifying component-level L release notes..."
echo "-----------------------------------------------"

# Check for OAM L Release references
if grep -r "OAM L Release" --include="*.md" reports/ docs/ >/dev/null 2>&1; then
    print_result "PASS" "OAM L Release documented"
else
    print_result "WARN" "OAM L Release not referenced"
fi

# Check for TEIV L Release references
if grep -r "TEIV L Release" --include="*.md" reports/ docs/ >/dev/null 2>&1; then
    print_result "PASS" "TEIV L Release documented"
else
    print_result "WARN" "TEIV L Release not referenced"
fi

# Check for O-DU-L2 L Release references
if grep -r "O-DU-L2 L Release" --include="*.md" reports/ docs/ >/dev/null 2>&1; then
    print_result "PASS" "O-DU-L2 L Release documented"
else
    print_result "WARN" "O-DU-L2 L Release not referenced"
fi

echo ""
echo "5. Checking L Release feature documentation..."
echo "----------------------------------------------"

# Check for Python simulator references
if grep -r "Python.*O-RU.*O-DU.*simulator" --include="*.md" agents/ docs/ reports/ >/dev/null 2>&1; then
    print_result "PASS" "Python-based simulators documented"
else
    print_result "WARN" "Python-based simulators not fully documented"
fi

# Check for November 2024 YANG model references
if grep -r "November 2024.*YANG" --include="*.md" agents/ docs/ >/dev/null 2>&1; then
    print_result "PASS" "November 2024 YANG models referenced"
else
    print_result "WARN" "November 2024 YANG models not referenced"
fi

# Check for hierarchical O-RU references
if grep -r "hierarchical.*O-RU\|hybrid.*O-RU" --include="*.md" reports/ docs/ >/dev/null 2>&1; then
    print_result "PASS" "Hierarchical/hybrid O-RU support documented"
else
    print_result "WARN" "Hierarchical/hybrid O-RU support not documented"
fi

echo ""
echo "6. Checking crosscheck report..."
echo "---------------------------------"

if [ -f "reports/oran_crosscheck.md" ]; then
    print_result "PASS" "Crosscheck report exists"
    
    # Verify report contains key sections
    if grep -q "L Release (June 30, 2025)" reports/oran_crosscheck.md; then
        print_result "PASS" "Crosscheck report contains L Release date"
    else
        print_result "FAIL" "Crosscheck report missing L Release date"
    fi
    
    if grep -q "Change Mapping" reports/oran_crosscheck.md; then
        print_result "PASS" "Crosscheck report contains change mapping"
    else
        print_result "FAIL" "Crosscheck report missing change mapping"
    fi
else
    print_result "FAIL" "Crosscheck report not found at reports/oran_crosscheck.md"
fi

echo ""
echo "7. Final validation checks..."
echo "-----------------------------"

# Check that at least some files have been updated
UPDATED_COUNT=$(grep -l "L Release (June 30, 2025)" agents/*.md 2>/dev/null | wc -l)
if [ "$UPDATED_COUNT" -gt 0 ]; then
    print_result "PASS" "Found $UPDATED_COUNT agent files with L Release updates"
else
    print_result "FAIL" "No agent files contain L Release updates"
fi

# Check for consistency in release references
if grep -r "L-Release-Beta" --include="*.md" agents/ 2>/dev/null; then
    print_result "FAIL" "Found outdated L-Release-Beta references"
else
    print_result "PASS" "No L-Release-Beta references found"
fi

echo ""
echo "==========================================="
echo "                SUMMARY                    "
echo "==========================================="
echo "Total checks:  $TOTAL_CHECKS"
echo -e "${GREEN}Passed:        $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings:      $WARNINGS${NC}"
echo -e "${RED}Failed:        $FAILED_CHECKS${NC}"
echo ""

# Determine exit code
if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCESS: All critical O-RAN L Release validations passed!${NC}"
    echo ""
    if [ "$WARNINGS" -gt 0 ]; then
        echo "Note: $WARNINGS warnings detected. These may be acceptable depending on context."
    fi
    exit 0
else
    echo -e "${RED}❌ FAILURE: $FAILED_CHECKS critical validation(s) failed!${NC}"
    echo ""
    echo "Please review and fix the failed checks above."
    exit 1
fi