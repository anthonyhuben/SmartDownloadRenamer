#!/bin/bash

##############################################################################
# SmartDownloadRenamer - Package Verification Script
#
# Verifies that built extension packages contain all required files
# and have correct structure for each store.
#
# Usage: ./verify-packages.sh
##############################################################################

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${PROJECT_DIR}/dist"
TEMP_VERIFY_DIR="${PROJECT_DIR}/.verify-tmp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Required files that must be in all packages
REQUIRED_FILES=(
    "manifest.json"
    "popup.html"
    "popup.css"
    "popup.js"
    "background.js"
    "smart-rename-utils.js"
)

# Icon files
ICON_FILES=(
    "icons/icon-16.png"
    "icons/icon-48.png"
    "icons/icon-128.png"
    "icons/icon-16.svg"
    "icons/icon-48.svg"
    "icons/icon-128.svg"
)

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

##############################################################################
# Verification Functions
##############################################################################

verify_file_exists() {
    local file="$1"
    local zip_path="$2"

    if unzip -t "${zip_path}" "${file}" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

check_required_files() {
    local zip_file="$1"
    local browser="$2"
    local missing=0

    log_info "Checking required files in ${browser}..."

    for file in "${REQUIRED_FILES[@]}"; do
        if verify_file_exists "${file}" "${zip_file}"; then
            log_success "  ${file}"
        else
            log_error "  ${file} (MISSING)"
            missing=$((missing + 1))
        fi
    done

    return ${missing}
}

check_icon_files() {
    local zip_file="$1"
    local browser="$2"
    local missing=0

    log_info "Checking icon files in ${browser}..."

    for file in "${ICON_FILES[@]}"; do
        if verify_file_exists "${file}" "${zip_file}"; then
            log_success "  ${file}"
        else
            log_warn "  ${file} (optional - missing)"
            # Don't fail on missing optional files
        fi
    done
}

check_excluded_files() {
    local zip_file="$1"
    local browser="$2"
    local found_excluded=0

    log_info "Checking for excluded files in ${browser}..."

    # Extract list of files
    local file_list=$(unzip -l "${zip_file}" | awk '{print $4}' | grep -v "^$")

    # Check for documentation files that should be excluded
    for file in ${file_list}; do
        case "${file}" in
            *.md|README|QUICKSTART|SUMMARY.txt|.DS_Store)
                log_warn "  ${file} (should be excluded)"
                found_excluded=$((found_excluded + 1))
                ;;
        esac
    done

    if [[ ${found_excluded} -eq 0 ]]; then
        log_success "  No excluded files found"
    fi

    return 0
}

check_manifest_valid() {
    local zip_file="$1"
    local browser="$2"

    log_info "Validating manifest.json in ${browser}..."

    # Extract manifest temporarily
    unzip -q -o "${zip_file}" manifest.json -d "${TEMP_VERIFY_DIR}/" 2>/dev/null

    if [[ ! -f "${TEMP_VERIFY_DIR}/manifest.json" ]]; then
        log_error "  manifest.json not found in package"
        return 1
    fi

    # Check for required manifest fields
    local manifest="${TEMP_VERIFY_DIR}/manifest.json"
    local errors=0

    # Check for valid JSON
    if ! jq empty "${manifest}" 2>/dev/null; then
        log_error "  Invalid JSON in manifest.json"
        errors=$((errors + 1))
    fi

    # Check required fields
    local fields=("name" "version" "manifest_version" "description")
    for field in "${fields[@]}"; do
        if grep -q "\"${field}\"" "${manifest}"; then
            local value=$(jq -r ".${field}" "${manifest}" 2>/dev/null || echo "")
            log_success "  ${field}: ${value}"
        else
            log_error "  ${field} (MISSING)"
            errors=$((errors + 1))
        fi
    done

    rm -f "${TEMP_VERIFY_DIR}/manifest.json"

    return ${errors}
}

verify_package() {
    local zip_file="$1"
    local browser="${2:-Unknown}"
    local errors=0

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Verifying ${browser} package..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ ! -f "${zip_file}" ]]; then
        log_error "Package not found: ${zip_file}"
        return 1
    fi

    local size=$(du -h "${zip_file}" | cut -f1)
    log_success "Package found: ${size}"
    echo ""

    check_required_files "${zip_file}" "${browser}" || errors=$((errors + 1))
    echo ""

    check_icon_files "${zip_file}" "${browser}"
    echo ""

    check_excluded_files "${zip_file}" "${browser}"
    echo ""

    check_manifest_valid "${zip_file}" "${browser}" || errors=$((errors + 1))

    echo ""
    if [[ ${errors} -eq 0 ]]; then
        log_success "All checks passed for ${browser}"
    else
        log_error "${errors} issue(s) found in ${browser}"
    fi

    return ${errors}
}

##############################################################################
# Main
##############################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║   SmartDownloadRenamer - Package Verification  ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""

    # Setup
    if [[ ! -d "${DIST_DIR}" ]]; then
        log_error "dist/ directory not found"
        echo "Run './package.sh all' to create packages first"
        exit 1
    fi

    mkdir -p "${TEMP_VERIFY_DIR}"

    # Find and verify packages
    local packages=(${DIST_DIR}/*.zip)
    local total_packages=${#packages[@]}

    if [[ ${total_packages} -eq 0 ]]; then
        log_error "No packages found in dist/"
        exit 1
    fi

    log_info "Found ${total_packages} package(s) to verify"

    local failed=0
    for zip_file in "${packages[@]}"; do
        # Extract browser name from filename
        local filename=$(basename "${zip_file}")
        local browser=$(echo "${filename}" | sed -E 's/SmartDownloadRenamer-([^-]+)-.*/\1/')

        verify_package "${zip_file}" "${browser}" || failed=$((failed + 1))
    done

    # Cleanup
    rm -rf "${TEMP_VERIFY_DIR}"

    # Summary
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║   Verification Complete                        ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""

    if [[ ${failed} -eq 0 ]]; then
        log_success "All packages verified successfully!"
        echo ""
        log_info "Ready for distribution:"
        ls -1 "${DIST_DIR}"/*.zip | while read file; do
            local browser=$(basename "${file}" | sed -E 's/SmartDownloadRenamer-([^-]+)-.*/\1/')
            local size=$(du -h "${file}" | cut -f1)
            echo "  • $(basename "${file}") (${size})"
        done
        exit 0
    else
        log_error "${failed} package(s) failed verification"
        exit 1
    fi
}

# Run main function
main "$@"
