#!/bin/bash

##############################################################################
# SmartDownloadRenamer - Multi-Browser Extension Packager
#
# This script packages the extension for Firefox, Chrome, and Safari
# distribution using web-ext and standard zip tools.
#
# Usage: ./package.sh [browser] [--skip-clean]
#   browser: firefox, chrome, safari, or all (default: all)
#   --skip-clean: Don't remove existing dist files before building
#
# Output: dist/SmartDownloadRenamer-{browser}-{version}.zip
##############################################################################

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${PROJECT_DIR}/dist"
BROWSERS=("Firefox" "Chrome" "Safari")
BUILD_BROWSER="${1:-all}"
SKIP_CLEAN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

check_tool() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed"
        return 1
    fi
}

##############################################################################
# Validation
##############################################################################

validate_args() {
    case "${BUILD_BROWSER}" in
        firefox|Firefox)
            BROWSERS=("Firefox")
            BUILD_BROWSER="Firefox"
            ;;
        chrome|Chrome)
            BROWSERS=("Chrome")
            BUILD_BROWSER="Chrome"
            ;;
        safari|Safari)
            BROWSERS=("Safari")
            BUILD_BROWSER="Safari"
            ;;
        all)
            BROWSERS=("Firefox" "Chrome" "Safari")
            ;;
        --skip-clean)
            SKIP_CLEAN=true
            ;;
        *)
            log_error "Invalid browser: $BUILD_BROWSER"
            echo "Usage: ./package.sh [firefox|chrome|safari|all] [--skip-clean]"
            exit 1
            ;;
    esac

    # Check second argument for --skip-clean
    if [[ "$2" == "--skip-clean" ]]; then
        SKIP_CLEAN=true
    fi
}

check_dependencies() {
    log_info "Checking dependencies..."
    local missing=0

    check_tool "zip" || missing=1

    # web-ext is only needed for Firefox builds
    if [[ " ${BROWSERS[@]} " =~ "Firefox" ]]; then
        if ! command -v web-ext &> /dev/null; then
            log_warn "web-ext not found. Install with: npm install -g web-ext"
            missing=1
        fi
    fi

    if [[ $missing -eq 1 ]]; then
        exit 1
    fi

    log_success "All dependencies found"
}

##############################################################################
# Setup
##############################################################################

setup_dist_dir() {
    if [[ ! -d "${DIST_DIR}" ]]; then
        log_info "Creating dist directory"
        mkdir -p "${DIST_DIR}"
    fi

    if [[ "${SKIP_CLEAN}" == false ]]; then
        log_info "Cleaning previous builds"
        rm -f "${DIST_DIR}"/*.zip
    fi
}

##############################################################################
# Build Functions
##############################################################################

get_version() {
    local manifest="${1}/manifest.json"
    if [[ -f "${manifest}" ]]; then
        grep '"version"' "${manifest}" | sed -E 's/.*"version": "([^"]+)".*/\1/'
    else
        echo "1.0.0"
    fi
}

build_firefox() {
    local browser_dir="${PROJECT_DIR}/Firefox"
    local version=$(get_version "${browser_dir}")
    local output_name="SmartDownloadRenamer-Firefox-${version}"

    log_info "Building Firefox extension (v${version})..."

    if [[ ! -d "${browser_dir}" ]]; then
        log_error "Firefox directory not found: ${browser_dir}"
        return 1
    fi

    # web-ext build outputs to artifacts directory
    cd "${browser_dir}"

    # Run web-ext build (output goes to DIST_DIR with lowercase name)
    # Exclude documentation and metadata files
    web-ext build \
        --source-dir="${browser_dir}" \
        --artifacts-dir="${DIST_DIR}" \
        --ignore-files "*.md" "*.txt" ".DS_Store" \
        --overwrite-dest \
        2>&1 | grep -v "^addons:" || true

    # web-ext creates files with lowercase names (e.g., smart_download_renamer-1.0.0.zip)
    # Find the most recently created .zip file in DIST_DIR
    local built_file=$(ls -t "${DIST_DIR}"/*.zip 2>/dev/null | head -1)

    if [[ -n "${built_file}" && -f "${built_file}" ]]; then
        # Rename to our standard naming convention
        if [[ "${built_file}" != "${DIST_DIR}/${output_name}.zip" ]]; then
            mv "${built_file}" "${DIST_DIR}/${output_name}.zip"
        fi

        local size=$(du -h "${DIST_DIR}/${output_name}.zip" | cut -f1)
        log_success "Firefox package created: ${output_name}.zip (${size})"
    else
        log_error "Failed to build Firefox extension"
        return 1
    fi

    cd "${PROJECT_DIR}"
}

build_chrome() {
    local browser_dir="${PROJECT_DIR}/Chrome"
    local version=$(get_version "${browser_dir}")
    local output_name="SmartDownloadRenamer-Chrome-${version}"
    local output_file="${DIST_DIR}/${output_name}.zip"

    log_info "Building Chrome extension (v${version})..."

    if [[ ! -d "${browser_dir}" ]]; then
        log_error "Chrome directory not found: ${browser_dir}"
        return 1
    fi

    # Create zip excluding unnecessary files
    cd "${browser_dir}"
    zip -q -r "${output_file}" . \
        -x ".*" \
        ".DS_Store" \
        "*.md" \
        "INSTALLATION.md" \
        "PROJECT_STRUCTURE.md" \
        "QUICKSTART.md" \
        "README.md" \
        "SUMMARY.txt" || {
        log_error "Failed to create Chrome zip"
        return 1
    }

    if [[ -f "${output_file}" ]]; then
        local size=$(du -h "${output_file}" | cut -f1)
        log_success "Chrome package created: ${output_name}.zip (${size})"
    else
        log_error "Failed to create Chrome extension package"
        return 1
    fi

    cd "${PROJECT_DIR}"
}

build_safari() {
    local browser_dir="${PROJECT_DIR}/Safari"
    local version=$(get_version "${browser_dir}")
    local output_name="SmartDownloadRenamer-Safari-${version}"
    local output_file="${DIST_DIR}/${output_name}.zip"

    log_info "Building Safari extension (v${version})..."

    if [[ ! -d "${browser_dir}" ]]; then
        log_error "Safari directory not found: ${browser_dir}"
        return 1
    fi

    # Create zip excluding unnecessary files
    cd "${browser_dir}"
    zip -q -r "${output_file}" . \
        -x ".*" \
        ".DS_Store" \
        "*.md" \
        "INSTALLATION.md" \
        "PROJECT_STRUCTURE.md" \
        "QUICKSTART.md" \
        "README.md" \
        "SUMMARY.txt" || {
        log_error "Failed to create Safari zip"
        return 1
    }

    if [[ -f "${output_file}" ]]; then
        local size=$(du -h "${output_file}" | cut -f1)
        log_success "Safari package created: ${output_name}.zip (${size})"
    else
        log_error "Failed to create Safari extension package"
        return 1
    fi

    cd "${PROJECT_DIR}"
}

build_all() {
    local failed=0

    for browser in "${BROWSERS[@]}"; do
        case "${browser}" in
            Firefox)
                build_firefox || failed=$((failed + 1))
                ;;
            Chrome)
                build_chrome || failed=$((failed + 1))
                ;;
            Safari)
                build_safari || failed=$((failed + 1))
                ;;
        esac
    done

    return ${failed}
}

##############################################################################
# Summary
##############################################################################

print_summary() {
    echo ""
    log_info "Build Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ -d "${DIST_DIR}" ]]; then
        local count=$(ls -1 "${DIST_DIR}"/*.zip 2>/dev/null | wc -l)
        if [[ ${count} -gt 0 ]]; then
            echo ""
            log_success "Created ${count} package(s):"
            ls -lh "${DIST_DIR}"/*.zip | awk '{print "  • " $9 " (" $5 ")"}'
            echo ""
            log_info "Location: ${DIST_DIR}"
            echo ""
            echo "Distribution Instructions:"
            echo "  Firefox:  Upload to https://addons.mozilla.org/developers/"
            echo "  Chrome:   Upload to https://chrome.google.com/webstore/devconsole/"
            echo "  Safari:   Use Xcode to create app extension bundle"
        else
            log_error "No packages were created"
        fi
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

##############################################################################
# Main
##############################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║   SmartDownloadRenamer - Extension Packager   ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""

    validate_args "$@"
    check_dependencies
    setup_dist_dir

    if build_all; then
        print_summary
        log_success "All packages built successfully!"
        exit 0
    else
        print_summary
        log_error "Some packages failed to build"
        exit 1
    fi
}

# Run main function
main "$@"
