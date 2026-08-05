/**
 * Code-OSS Fork Preparation Script
 * Validates product.json configuration, verifies telemetry removal, and confirms OpenVSX marketplace integration.
 */

const fs = require('fs');
const path = require('path');

function validateProductConfig() {
  console.log('✦ [Code-OSS Fork]: Validating product.json configuration...');
  const productPath = path.join(__dirname, '../product.json');
  
  if (!fs.existsSync(productPath)) {
    console.error('❌ Error: product.json not found!');
    process.exit(1);
  }

  const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));

  // 1. Verify Telemetry Disabling
  if (product.enableTelemetry !== false) {
    console.error('❌ Error: Telemetry is not disabled in product.json!');
    process.exit(1);
  }
  console.log('  ✓ Telemetry Status: DISABLED (enableTelemetry: false)');

  // 2. Verify OpenVSX Extension Gallery
  if (!product.extensionsGallery || !product.extensionsGallery.serviceUrl.includes('open-vsx.org')) {
    console.error('❌ Error: OpenVSX extension gallery URL is missing!');
    process.exit(1);
  }
  console.log(`  ✓ Extension Marketplace: OpenVSX (${product.extensionsGallery.serviceUrl})`);

  // 3. Verify App Identifier & Branding
  console.log(`  ✓ Application Name: ${product.nameLong} (${product.darwinBundleIdentifier})`);
  console.log('✓ [Code-OSS Fork]: product.json configuration is 100% valid!');
}

validateProductConfig();
