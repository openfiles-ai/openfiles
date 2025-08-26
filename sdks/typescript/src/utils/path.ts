/**
 * Path utilities for OpenFiles SDK
 * Handles S3-style path conventions and base path resolution
 */

/**
 * Joins base path and relative path using S3-style conventions
 * - No leading slashes (S3-style)
 * - Handles empty paths gracefully
 * - Normalizes duplicate slashes
 * - Preserves trailing slashes only when meaningful
 * 
 * @param basePath - The base path to prefix with
 * @param relativePath - The relative path to append
 * @returns Combined path following S3-style conventions
 * 
 * @example
 * ```typescript
 * joinPaths("projects/website", "config.json") // "projects/website/config.json"
 * joinPaths("", "config.json") // "config.json"
 * joinPaths("projects", "") // "projects"
 * joinPaths("projects/", "config.json") // "projects/config.json"
 * joinPaths("projects//", "/config.json") // "projects/config.json"
 * ```
 */
export function joinPaths(basePath: string, relativePath: string): string {
  // Handle empty cases
  if (!basePath && !relativePath) return ''
  if (!basePath) return normalizePath(relativePath)
  if (!relativePath) return normalizePath(basePath)

  // Remove leading and trailing slashes, then normalize
  const normalizedBase = normalizePath(basePath)
  const normalizedRelative = normalizePath(relativePath)

  // If base path is empty after normalization, just return relative
  if (!normalizedBase) return normalizedRelative
  if (!normalizedRelative) return normalizedBase

  // Join with single slash
  return `${normalizedBase}/${normalizedRelative}`
}

/**
 * Normalizes a path by removing leading slashes and collapsing duplicate slashes
 * Follows S3-style path conventions (no leading slashes)
 * 
 * @param path - The path to normalize
 * @returns Normalized path
 * 
 * @example
 * ```typescript
 * normalizePath("/projects/website") // "projects/website"
 * normalizePath("projects//website") // "projects/website"
 * normalizePath("///projects/") // "projects"
 * ```
 */
export function normalizePath(path: string): string {
  if (!path) return ''

  return path
    // Remove leading slashes (S3-style: no leading slashes)
    .replace(/^\/+/, '')
    // Replace multiple slashes with single slash
    .replace(/\/+/g, '/')
    // Remove trailing slashes (unless it's a meaningful directory indicator)
    .replace(/\/+$/, '')
}

/**
 * Resolves the final path using priority: per-operation > scoped > constructor
 * 
 * @param constructorBasePath - Base path from client constructor
 * @param scopedBasePath - Base path from scoped client (withBasePath)
 * @param operationBasePath - Base path from individual operation call
 * @param relativePath - The relative path from the operation
 * @returns Final resolved path
 * 
 * @example
 * ```typescript
 * // Priority: operation > scoped > constructor
 * resolvePath("constructor", "scoped", "operation", "file.txt")
 * // Returns: "operation/file.txt"
 * 
 * resolvePath("constructor", "scoped", undefined, "file.txt")
 * // Returns: "scoped/file.txt"
 * 
 * resolvePath("constructor", undefined, undefined, "file.txt")
 * // Returns: "constructor/file.txt"
 * ```
 */
export function resolvePath(
  constructorBasePath?: string,
  scopedBasePath?: string,
  operationBasePath?: string,
  relativePath?: string
): string {
  // Determine the effective base path using priority order
  const effectiveBasePath = operationBasePath || scopedBasePath || constructorBasePath || ''
  
  // If no relative path, return just the base path
  if (!relativePath) return normalizePath(effectiveBasePath)
  
  // Join the effective base path with relative path
  return joinPaths(effectiveBasePath, relativePath)
}

/**
 * Validates that a path is valid for S3-style storage
 * 
 * @param path - The path to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidPath("projects/website/config.json") // true
 * isValidPath("") // false (empty path)
 * isValidPath("../malicious") // false (path traversal)
 * ```
 */
export function isValidPath(path: string): boolean {
  if (!path || path.trim().length === 0) return false
  
  // Check for path traversal attempts
  if (path.includes('..')) return false
  
  // Check for invalid characters (basic validation)
  // eslint-disable-next-line no-control-regex
  const invalidChars = /[<>:"|?*\x00-\x1f]/
  if (invalidChars.test(path)) return false
  
  return true
}