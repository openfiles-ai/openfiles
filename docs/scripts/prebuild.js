#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Preparing OpenAPI spec for Mintlify docs...');

const docsDir = path.join(__dirname, '..');

async function prebuildDocs() {
  // Use default URL or override with environment variable
  const OPENFILES_OPENAPI_URL = process.env.OPENFILES_OPENAPI_URL || 'https://api.openfiles.ai/functions/v1/api/openapi.json';
  const targetSpec = path.join(docsDir, 'openapi.json');
  
  if (OPENFILES_OPENAPI_URL) {
    try {
      console.log('🌐 Fetching OpenAPI spec from:', OPENFILES_OPENAPI_URL);
      
      const response = await fetch(OPENFILES_OPENAPI_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const spec = await response.json();
      fs.writeFileSync(targetSpec, JSON.stringify(spec, null, 2));
      
      console.log('✅ OpenAPI spec updated from URL');
      console.log(`🎯 Spec contains ${Object.keys(spec.paths || {}).length} endpoints`);
      
    } catch (error) {
      console.log('⚠️  Failed to fetch OpenAPI spec:', error.message);
      console.log('📄 Continuing with existing openapi.json file');
    }
  }
  
  // Verify we have a valid spec file
  if (!fs.existsSync(targetSpec)) {
    console.error('❌ No openapi.json file found and unable to fetch from URL');
    console.error('💡 Either set OPENFILES_OPENAPI_URL or ensure openapi.json exists');
    process.exit(1);
  }
  
  // Validate the existing spec
  try {
    const spec = JSON.parse(fs.readFileSync(targetSpec, 'utf8'));
    console.log(`🎯 Using spec with ${Object.keys(spec.paths || {}).length} endpoints`);
  } catch (error) {
    console.error('❌ Invalid JSON in openapi.json:', error.message);
    process.exit(1);
  }
  
  console.log('🎉 Prebuild docs complete!');
}

prebuildDocs();