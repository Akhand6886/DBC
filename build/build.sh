#!/usr/bin/env bg-sh
# Code-OSS Build & Packaging Automation Script

set -e

echo "===================================================="
echo "✦ Agentic AI IDE — Code-OSS Distribution Build Tool"
echo "===================================================="

# Step 1: Validate Product Configuration & Telemetry Removal
node scripts/prepare-fork.js

# Step 2: Apply Custom Branding & OpenVSX Extensions Gallery
node scripts/apply-branding.js

echo "✓ Code-OSS build environment prepared successfully."
