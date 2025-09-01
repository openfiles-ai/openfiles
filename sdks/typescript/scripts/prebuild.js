#!/usr/bin/env node
/**
 * Prebuild TypeScript SDK - Fetch OpenAPI spec and generate client
 */

import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { config as loadDotenv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')

async function prebuildTypeScriptSDK() {
  console.log('🔧 Prebuilding TypeScript SDK...')
  
  // Load environment variables from .env files
  loadDotenv({ path: resolve(packageRoot, '.env.local') })
  loadDotenv({ path: resolve(packageRoot, '.env') })
  
  const OPENFILES_OPENAPI_URL = process.env.OPENFILES_OPENAPI_URL
  const localSpecPath = resolve(packageRoot, 'openapi-spec.json')
  
  // Step 1: Try to fetch OpenAPI spec from URL
  if (OPENFILES_OPENAPI_URL) {
    try {
      console.log('🌐 Fetching OpenAPI spec from:', OPENFILES_OPENAPI_URL)
      
      const response = await fetch(OPENFILES_OPENAPI_URL)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const spec = await response.json()
      writeFileSync(localSpecPath, JSON.stringify(spec, null, 2))
      
      console.log('✅ OpenAPI spec updated from URL')
      console.log(`🎯 Spec contains ${Object.keys(spec.paths || {}).length} endpoints`)
      
    } catch (error) {
      console.log('⚠️  Failed to fetch OpenAPI spec:', error.message)
      console.log('📄 Will try to use existing spec or fallback to OpenAPI package')
    }
  } else {
    console.log('📄 No OPENFILES_OPENAPI_URL provided')
  }
  
  // Step 2: Determine which spec file to use
  let specPath = localSpecPath
  
  if (!existsSync(localSpecPath)) {
    console.log('📦 No local spec found, trying OpenAPI package...')
    const packageSpecPath = resolve(packageRoot, '../openapi/dist/sdk-openapi.json')
    
    if (existsSync(packageSpecPath)) {
      specPath = packageSpecPath
      console.log('✅ Using OpenAPI package spec')
    } else {
      console.error('❌ No OpenAPI spec found!')
      console.error('💡 Either set OPENFILES_OPENAPI_URL or build the OpenAPI package')
      process.exit(1)
    }
  }
  
  // Step 3: Validate the spec
  try {
    const spec = JSON.parse(readFileSync(specPath, 'utf8'))
    console.log(`🎯 Using spec with ${Object.keys(spec.paths || {}).length} endpoints`)
  } catch (error) {
    console.error('❌ Invalid JSON in OpenAPI spec:', error.message)
    process.exit(1)
  }
  
  // Step 4: Generate TypeScript client
  try {
    console.log('🎯 Generating TypeScript client...')
    
    await runCommand('npx', [
      '@hey-api/openapi-ts',
      '-i', specPath,
      '-o', 'src/core/generated'
    ], packageRoot)
    
    console.log('✅ TypeScript client generated successfully')
    
  } catch (error) {
    console.error('❌ Failed to generate TypeScript client:', error.message)
    process.exit(1)
  }
  
  console.log('🎉 TypeScript SDK prebuild complete!')
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    
    child.on('error', reject)
  })
}

prebuildTypeScriptSDK()