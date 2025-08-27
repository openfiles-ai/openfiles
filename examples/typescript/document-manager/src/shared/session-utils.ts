#!/usr/bin/env tsx
/**
 * Session Utilities for Test Isolation
 * 
 * Provides unique session IDs and directory prefixes to prevent conflicts
 * when running tests repeatedly or concurrently between different examples.
 */

/**
 * Generate a unique session ID for test isolation
 * 
 * Format: 8 random alphanumeric characters + timestamp
 * Example: "a7k9m2n5_1693845123"
 * 
 * @returns Unique session identifier
 */
export function generateSessionId(): string {
  // Generate 8 random alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from({ length: 8 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  
  // Add timestamp for additional uniqueness
  const timestamp = Math.floor(Date.now() / 1000).toString()
  
  return `${randomPart}_${timestamp}`
}

/**
 * Create session-specific paths for organized testing
 * 
 * @param sessionId Unique session identifier
 * @param basePrefix Base prefix for the session (e.g., "test", "demo", "ai-gen")
 * @returns Object with common session paths
 */
export function createSessionPaths(sessionId: string, basePrefix: string = "test") {
  const sessionBase = `${basePrefix}/session_${sessionId}`
  
  return {
    base: sessionBase,
    businessApp: `${sessionBase}/business-app`,
    aiGenerated: `${sessionBase}/ai-generated`,
    demo: `${sessionBase}/demo`,
    reports: `${sessionBase}/reports`,
    config: `${sessionBase}/config`,
    data: `${sessionBase}/data`,
    logs: `${sessionBase}/logs`,
    analytics: `${sessionBase}/analytics`,
    salesDept: `${sessionBase}/sales-dept`,
    dataAnalytics: `${sessionBase}/data-analytics`,
    toolsTest: `${sessionBase}/tools-test`
  }
}

/**
 * Print session information for debugging and tracking
 * 
 * @param sessionId Current session identifier
 * @param paths Session paths object
 */
export function printSessionInfo(sessionId: string, paths: ReturnType<typeof createSessionPaths>): void {
  console.log(`🔖 Session ID: ${sessionId}`)
  console.log(`📁 Base path: ${paths.base}`)
  console.log('   All test files will be isolated under this session directory')
}