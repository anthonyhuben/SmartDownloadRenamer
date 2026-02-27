.PHONY: help package package-all package-firefox package-chrome package-safari clean verify install-tools

# SmartDownloadRenamer - Makefile for packaging operations

help:
	@echo "SmartDownloadRenamer - Packaging Targets"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  package              Build all browser packages (default)"
	@echo "  package-all          Build all browser packages (same as package)"
	@echo "  package-firefox      Build Firefox package only"
	@echo "  package-chrome       Build Chrome package only"
	@echo "  package-safari       Build Safari package only"
	@echo "  verify               Verify all packages in dist/"
	@echo "  clean                Remove all built packages"
	@echo "  install-tools        Install web-ext for Firefox packaging"
	@echo "  list                 List all built packages with details"
	@echo ""
	@echo "Examples:"
	@echo "  make package              # Build all browsers"
	@echo "  make package-chrome       # Build Chrome only"
	@echo "  make verify               # Check all packages"
	@echo "  make clean                # Remove all packages"
	@echo ""

package: package-all

package-all:
	@echo "📦 Building all extension packages..."
	@./package.sh all

package-firefox:
	@echo "🦊 Building Firefox extension..."
	@./package.sh firefox

package-chrome:
	@echo "🎨 Building Chrome extension..."
	@./package.sh chrome

package-safari:
	@echo "🧭 Building Safari extension..."
	@./package.sh safari

verify:
	@echo "✓ Verifying packages..."
	@./verify-packages.sh

clean:
	@echo "🗑️  Removing all built packages..."
	@rm -rf dist/*.zip
	@echo "✓ Cleaned dist/ directory"

list:
	@if [ -d dist ] && [ -n "$$(ls -A dist/*.zip 2>/dev/null)" ]; then \
		echo "📋 Built Packages:"; \
		ls -lh dist/*.zip | awk '{print "  " $$9 " (" $$5 ")"}'; \
	else \
		echo "No packages found in dist/"; \
	fi

install-tools:
	@echo "📥 Installing web-ext..."
	@npm install -g web-ext
	@echo "✓ web-ext installed. You can now build Firefox packages."

.DEFAULT_GOAL := help
