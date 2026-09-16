# DBC Platform - Master Makefile
# Provides standard build, dev, and distribution targets

.PHONY: all dev build dist dist-mac dist-win dist-all lint clean

all: build

# Start local Next.js development server
dev:
	npm run dev

# Build optimized static production bundle (Next.js export to out/)
build:
	npm run build

# Default distribution target: builds macOS DMG on Darwin, or native package
dist:
	npm run dist:mac

# Package macOS DMG installer
dist-mac:
	npm run dist:mac

# Package Windows NSIS installer
dist-win:
	npm run dist:win

# Package multi-platform distribution
dist-all:
	npm run dist:all

# Run ESLint validation
lint:
	npm run lint

# Clean all build outputs
clean:
	rm -rf .next out dist
