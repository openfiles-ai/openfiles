/**
 * Tests for path utility functions
 */

import { describe, it, expect } from 'vitest'
import { joinPaths, normalizePath, resolvePath, isValidPath } from './path'

describe('path utilities', () => {
  describe('normalizePath', () => {
    it('should remove leading slashes (S3-style)', () => {
      expect(normalizePath('/projects/website')).toBe('projects/website')
      expect(normalizePath('///projects/website')).toBe('projects/website')
      expect(normalizePath('/projects')).toBe('projects')
    })

    it('should remove trailing slashes', () => {
      expect(normalizePath('projects/website/')).toBe('projects/website')
      expect(normalizePath('projects/website///')).toBe('projects/website')
      expect(normalizePath('projects/')).toBe('projects')
    })

    it('should collapse duplicate slashes', () => {
      expect(normalizePath('projects//website')).toBe('projects/website')
      expect(normalizePath('projects///website//config')).toBe('projects/website/config')
    })

    it('should handle empty paths', () => {
      expect(normalizePath('')).toBe('')
      expect(normalizePath('/')).toBe('')
      expect(normalizePath('///')).toBe('')
    })

    it('should handle normal paths unchanged', () => {
      expect(normalizePath('projects/website')).toBe('projects/website')
      expect(normalizePath('config.json')).toBe('config.json')
      expect(normalizePath('src/components/Header.tsx')).toBe('src/components/Header.tsx')
    })
  })

  describe('joinPaths', () => {
    it('should join normal paths', () => {
      expect(joinPaths('projects/website', 'config.json')).toBe('projects/website/config.json')
      expect(joinPaths('src', 'components/Header.tsx')).toBe('src/components/Header.tsx')
    })

    it('should handle empty base paths', () => {
      expect(joinPaths('', 'config.json')).toBe('config.json')
      expect(joinPaths('', 'src/components')).toBe('src/components')
    })

    it('should handle empty relative paths', () => {
      expect(joinPaths('projects/website', '')).toBe('projects/website')
      expect(joinPaths('src', '')).toBe('src')
    })

    it('should handle both empty paths', () => {
      expect(joinPaths('', '')).toBe('')
    })

    it('should normalize paths during joining', () => {
      expect(joinPaths('projects/', '/config.json')).toBe('projects/config.json')
      expect(joinPaths('/projects//', '//config.json')).toBe('projects/config.json')
      expect(joinPaths('projects//website/', '/config.json')).toBe('projects/website/config.json')
    })

    it('should handle complex path combinations', () => {
      expect(joinPaths('projects/website', 'assets/images/logo.png')).toBe('projects/website/assets/images/logo.png')
      expect(joinPaths('/', 'projects/website/config.json')).toBe('projects/website/config.json')
    })
  })

  describe('resolvePath', () => {
    it('should use constructor basePath when no other paths provided', () => {
      expect(resolvePath('constructor', undefined, undefined, 'file.txt')).toBe('constructor/file.txt')
      expect(resolvePath('projects/website', undefined, undefined, 'config.json')).toBe('projects/website/config.json')
    })

    it('should prioritize scoped basePath over constructor basePath', () => {
      expect(resolvePath('constructor', 'scoped', undefined, 'file.txt')).toBe('scoped/file.txt')
      expect(resolvePath('projects', 'website', undefined, 'config.json')).toBe('website/config.json')
    })

    it('should prioritize operation basePath over all others', () => {
      expect(resolvePath('constructor', 'scoped', 'operation', 'file.txt')).toBe('operation/file.txt')
      expect(resolvePath('projects', 'website', 'temp', 'config.json')).toBe('temp/config.json')
    })

    it('should handle undefined basePaths gracefully', () => {
      expect(resolvePath(undefined, undefined, undefined, 'file.txt')).toBe('file.txt')
      expect(resolvePath(undefined, 'scoped', undefined, 'file.txt')).toBe('scoped/file.txt')
      expect(resolvePath('constructor', undefined, 'operation', 'file.txt')).toBe('operation/file.txt')
    })

    it('should handle empty strings as basePaths', () => {
      expect(resolvePath('', '', '', 'file.txt')).toBe('file.txt')
      expect(resolvePath('constructor', '', '', 'file.txt')).toBe('constructor/file.txt')
      expect(resolvePath('', 'scoped', '', 'file.txt')).toBe('scoped/file.txt')
    })

    it('should return normalized basePath when no relative path provided', () => {
      expect(resolvePath('constructor', 'scoped', 'operation', '')).toBe('operation')
      expect(resolvePath('constructor', 'scoped', undefined, undefined)).toBe('scoped')
      expect(resolvePath('constructor', undefined, undefined, undefined)).toBe('constructor')
    })

    it('should normalize all path components', () => {
      expect(resolvePath('/constructor/', '//scoped//', '///operation///', '/file.txt')).toBe('operation/file.txt')
      expect(resolvePath('projects/', '/website/', 'temp/', '/config.json')).toBe('temp/config.json')
    })

    describe('complex real-world scenarios', () => {
      it('should handle client constructor with basePath', () => {
        // Client created with basePath: 'projects/website'
        expect(resolvePath('projects/website', undefined, undefined, 'config.json')).toBe('projects/website/config.json')
      })

      it('should handle scoped client chains', () => {
        // client.withBasePath('projects').withBasePath('website').withBasePath('config')
        expect(resolvePath(undefined, 'projects/website/config', undefined, 'database.json')).toBe('projects/website/config/database.json')
      })

      it('should handle all three levels of basePath', () => {
        // Constructor: 'base', scoped: 'scoped', operation: 'operation'
        expect(resolvePath('base', 'scoped', 'operation', 'file.txt')).toBe('operation/file.txt')
        // Constructor: 'base', scoped: 'scoped', no operation override
        expect(resolvePath('base', 'scoped', undefined, 'file.txt')).toBe('scoped/file.txt')
        // Constructor: 'base', no scoped, no operation
        expect(resolvePath('base', undefined, undefined, 'file.txt')).toBe('base/file.txt')
      })
    })
  })

  describe('isValidPath', () => {
    it('should validate normal file paths', () => {
      expect(isValidPath('config.json')).toBe(true)
      expect(isValidPath('projects/website/config.json')).toBe(true)
      expect(isValidPath('src/components/Header.tsx')).toBe(true)
      expect(isValidPath('assets/images/logo.png')).toBe(true)
    })

    it('should reject empty paths', () => {
      expect(isValidPath('')).toBe(false)
      expect(isValidPath('   ')).toBe(false)
      expect(isValidPath('\t\n')).toBe(false)
    })

    it('should reject paths with path traversal attempts', () => {
      expect(isValidPath('../../../etc/passwd')).toBe(false)
      expect(isValidPath('projects/../../../secret')).toBe(false)
      expect(isValidPath('..\\windows\\system32')).toBe(false)
      expect(isValidPath('legitimate/path/../../../malicious')).toBe(false)
    })

    it('should reject paths with invalid characters', () => {
      expect(isValidPath('file<script>.js')).toBe(false)
      expect(isValidPath('file>redirect.txt')).toBe(false)
      expect(isValidPath('file:alternate.dat')).toBe(false)
      expect(isValidPath('file"quote.txt')).toBe(false)
      expect(isValidPath('file|pipe.log')).toBe(false)
      expect(isValidPath('file?query.html')).toBe(false)
      expect(isValidPath('file*wildcard.txt')).toBe(false)
    })

    it('should reject paths with control characters', () => {
      expect(isValidPath('file\x00null.txt')).toBe(false)
      expect(isValidPath('file\x01control.txt')).toBe(false)
      expect(isValidPath('file\x1fcontrol.txt')).toBe(false)
    })

    it('should accept paths with safe special characters', () => {
      expect(isValidPath('my-project/config_dev.json')).toBe(true)
      expect(isValidPath('user@domain/file.txt')).toBe(true)
      expect(isValidPath('project (backup)/file.txt')).toBe(true)
      expect(isValidPath('file-name_with.dots.txt')).toBe(true)
    })

    it('should handle edge cases', () => {
      expect(isValidPath('a')).toBe(true) // Single character
      expect(isValidPath('a.b')).toBe(true) // Minimal file with extension
      expect(isValidPath('very/deep/nested/directory/structure/file.txt')).toBe(true) // Deep nesting
    })
  })
})