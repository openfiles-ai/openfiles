/**
 * OpenFiles Core Client - Direct API access
 * 
 * Provides type-safe access to the OpenFiles API with automatic
 * authentication, error handling, and response validation.
 */

import { 
  writeFile as _writeFile, 
  readFile as _readFile, 
  editFile as _editFile,
  appendFile as _appendFile,
  overwriteFile as _overwriteFile,
  listFiles as _listFiles 
} from './generated'
import { createClient, createConfig } from './generated/client'
import type { 
  FileMetadata,
  WriteFileRequest,
  FileContentResponse,
  FileVersionsResponse
} from './generated'
import { logger, resolvePath, joinPaths } from '../utils'

// Re-export types for convenience
export type { 
  FileMetadata,
  WriteFileRequest,
  FileContentResponse,
  FileListResponse,
  ErrorResponse,
  EditFileRequest,
  AppendFileRequest,
  OverwriteFileRequest,
  FileOperationResponse,
  FileMetadataResponse,
  FileVersionsResponse
} from './generated'

export interface OpenFilesConfig {
  /** OpenFiles API key (starts with 'oa_') */
  apiKey: string
  /** Base URL for the API. Defaults to production */
  baseUrl?: string
  /** Request timeout in milliseconds. Defaults to 30000 (30s) */
  timeout?: number
  /** Base path prefix for all file operations (optional) */
  basePath?: string
}

export interface WriteParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** File content */
  content: string
  /** MIME type of the content */
  contentType?: WriteFileRequest['contentType']
  /** Whether content is base64 encoded */
  isBase64?: boolean
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface ReadParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** Specific version to read (optional) */
  version?: number
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface EditParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** Exact string to find and replace */
  oldString: string
  /** Replacement string */
  newString: string
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface AppendParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** Content to append */
  content: string
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface OverwriteParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** New content */
  content: string
  /** Whether content is base64 encoded */
  isBase64?: boolean
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface ListParams {
  /** Directory path to list (defaults to '/') */
  directory?: string
  /** If true, lists all files across all directories. If false (default), only lists files in the specified directory */
  recursive?: boolean
  /** Maximum number of files to return */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface MetadataParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** Specific version (optional) */
  version?: number
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

export interface VersionsParams {
  /** File path (S3-style, no leading slash) */
  path: string
  /** Maximum number of versions to return */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Base path prefix for this operation (overrides client basePath) */
  basePath?: string
}

/**
 * OpenFiles Client
 * 
 * High-level client that provides an intuitive interface for file operations
 * while leveraging the generated SDK functions under the hood.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const client = new OpenFilesClient({
 *   apiKey: 'oa_your_api_key_here'
 * })
 * 
 * // Write a file
 * const file = await client.writeFile({
 *   path: 'reports/quarterly-report.md',
 *   content: '# Q1 2025 Business Report\n\n## Executive Summary\nRevenue increased 15%...',
 *   contentType: 'text/markdown'
 * })
 * 
 * // Using basePath for organization
 * const projectClient = client.withBasePath('projects/website')
 * const configClient = projectClient.withBasePath('config')
 * 
 * // This creates the file at 'projects/website/config/settings.json'
 * await configClient.writeFile({
 *   path: 'settings.json',
 *   content: '{"theme": "dark", "language": "en"}'
 * })
 * 
 * // Per-operation basePath
 * await client.writeFile({
 *   basePath: 'temp/uploads',
 *   path: 'user-data.json',
 *   content: '{"userId": 123}'
 * })
 * ```
 */
export class OpenFilesClient {
  private client: ReturnType<typeof createClient>
  private config: OpenFilesConfig
  private scopedBasePath?: string

  constructor(config: OpenFilesConfig, scopedBasePath?: string) {
    // Validate API key format
    if (!config.apiKey || !config.apiKey.startsWith('oa_') || config.apiKey.length < 35) {
      throw new Error('Invalid API key format. API key must start with "oa_" and be at least 35 characters long')
    }

    // Debug: Log what we're getting
    const defaultUrl = 'https://api.openfiles.ai/functions/v1/api'
    const envUrl = process.env.OPENFILES_BASE_URL
    
    this.config = {
      baseUrl: envUrl || defaultUrl,
      timeout: 30000,
      ...config
    }
    
    // Extra debug check
    if (this.config.baseUrl !== defaultUrl && this.config.baseUrl !== envUrl) {
      logger.error(`WARNING: baseUrl was overridden to: ${this.config.baseUrl}`)
    }

    this.scopedBasePath = scopedBasePath

    // Create configured client
    this.client = createClient(createConfig({
      baseUrl: this.config.baseUrl,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    }))

    // Debug logging to track URL issues
    if (!this.config.baseUrl || this.config.baseUrl === 'undefined') {
      logger.error(`CRITICAL: baseUrl is ${this.config.baseUrl}`)
    }
    logger.info(`API connected: ${this.config.baseUrl || 'UNDEFINED'}${this.scopedBasePath ? ` (basePath: ${this.scopedBasePath})` : ''}`)
  }

  /**
   * Create a new client instance with a base path prefix
   * All file operations on the returned client will automatically prefix paths
   * 
   * @param basePath - The base path to prefix to all operations
   * @returns New client instance with the specified base path
   * 
   * @example
   * ```typescript
   * const client = new OpenFilesClient({ apiKey: 'oa_...' })
   * const projectClient = client.withBasePath('projects/website')
   * 
   * // This will create the file at 'projects/website/config.json'
   * await projectClient.writeFile({
   *   path: 'config.json',
   *   content: '{"theme": "dark"}'
   * })
   * ```
   */
  withBasePath(basePath: string): OpenFilesClient {
    // Combine constructor basePath, current scoped basePath, and new basePath
    const currentEffectiveBasePath = this.scopedBasePath || this.config.basePath || ''
    const resolvedBasePath = currentEffectiveBasePath 
      ? joinPaths(currentEffectiveBasePath, basePath)
      : basePath
    return new OpenFilesClient(this.config, resolvedBasePath)
  }

  /**
   * Write content to a file
   * Creates a new file or adds a new version to an existing file
   */
  async writeFile(params: WriteParams): Promise<FileMetadata> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Writing file: ${resolvedPath}`)

      try {
        const response = await _writeFile({
          client: this.client,
          body: {
            path: resolvedPath,
            content: params.content,
            contentType: params.contentType,
            isBase64: params.isBase64
          }
        })

        if (!response.data?.success || !response.data?.data) {
          throw new Error('Failed to write file')
        }

        return response.data.data
      } catch (error) {
        logger.error(`Write failed: ${this.handleError(error).message}`)
        throw this.handleError(error)
      }
    }

  /**
   * Read file content
   * Returns the content of the latest version or a specific version
   */
  async readFile(params: ReadParams): Promise<string> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Reading file: ${resolvedPath}${params.version ? ` v${params.version}` : ''}`)

      try {
        const response = await _readFile({
          client: this.client,
          path: {
            path: resolvedPath
          },
          query: {
            version: params.version
          }
        }) as { data?: FileContentResponse }

        if (!response.data?.success || !response.data?.data) {
          throw new Error('Failed to read file')
        }

        // Handle both old (string) and new (object with content) response formats
        const data = response.data.data
        if (typeof data === 'string') {
          return data
        } else if (data && typeof data === 'object' && 'content' in data && data.content) {
          return data.content
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        logger.error(`Read failed: ${this.handleError(error).message}`)
        throw this.handleError(error)
      }
    }

  /**
   * Edit file content
   * Performs precise string replacement in the file
   */
  async editFile(params: EditParams): Promise<FileMetadata> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Editing file: ${resolvedPath}`)

      try {
        const response = await _editFile({
          client: this.client,
          path: {
            path: resolvedPath
          },
          body: {
            oldString: params.oldString,
            newString: params.newString
          }
        })

        if (!response.data?.success || !response.data?.data) {
          throw new Error('Failed to edit file')
        }

        return response.data.data
      } catch (error) {
        logger.error(`Edit failed: ${this.handleError(error).message}`)
        throw this.handleError(error)
      }
    }

  /**
   * Append content to a file
   * Adds content to the end of an existing file
   */
  async appendToFile(params: AppendParams): Promise<FileMetadata> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Appending to file: ${resolvedPath}`)

      try {
        const response = await _appendFile({
          client: this.client,
          path: {
            path: resolvedPath
          },
          body: {
            content: params.content
          }
        })

        if (!response.data?.success || !response.data?.data) {
          throw new Error('Failed to append to file')
        }

        return response.data.data
      } catch (error) {
        logger.error(`Append failed: ${this.handleError(error).message}`)
        throw this.handleError(error)
      }
    }

  /**
   * Overwrite file content
   * Completely replaces the content of an existing file
   */
  async overwriteFile(params: OverwriteParams): Promise<FileMetadata> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Overwriting file: ${resolvedPath}`)

      try {
        const response = await _overwriteFile({
          client: this.client,
          path: {
            path: resolvedPath
          },
          body: {
            content: params.content,
            isBase64: params.isBase64
          }
        })

        if (!response.data?.success || !response.data?.data) {
          throw new Error('Failed to overwrite file')
        }

        return response.data.data
      } catch (error) {
        logger.error(`Overwrite failed: ${this.handleError(error).message}`)
        throw this.handleError(error)
      }
    }

  /**
   * List files in directory
   * Returns paginated file listing with metadata
   */
  async listFiles(params: ListParams = {}): Promise<{ files: FileMetadata[], total: number }> {
      const resolvedDirectory = params.directory 
        ? resolvePath(
            this.config.basePath,
            this.scopedBasePath,
            params.basePath,
            params.directory
          )
        : resolvePath(
            this.config.basePath,
            this.scopedBasePath,
            params.basePath
          ) || '/'
      
      logger.debug(`Listing files in: ${resolvedDirectory}`)

      try {
        const query: { directory: string; limit: number; offset: number; recursive?: boolean } = {
          directory: resolvedDirectory,
          limit: params.limit || 10,
          offset: params.offset || 0
        }
        if (params.recursive !== undefined) {
          query.recursive = params.recursive
        }
        
        const response = await _listFiles({
          client: this.client,
          query
        })

        if (!response.data?.success || !response.data?.data) {
          throw new Error('Failed to list files')
        }

        return {
          files: response.data.data.files || [],
          total: response.data.data.total || 0
        }
      } catch (error) {
        logger.error(`List failed: ${this.handleError(error).message}`)
        throw this.handleError(error)
      }
    }

  /**
   * Get file metadata
   * Returns metadata for a specific version or the latest version
   */
  async getFileMetadata(params: MetadataParams): Promise<FileMetadata> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Getting metadata for file: ${resolvedPath}${params.version ? ` v${params.version}` : ''}`)

    try {
      const response = await _readFile({
        client: this.client,
        path: {
          path: resolvedPath
        },
        query: {
          metadata: '',
          version: params.version
        }
      })

      if (!response.data?.success || !response.data?.data) {
        throw new Error('Failed to get file metadata')
      }

      return response.data.data as FileMetadata
    } catch (error) {
      logger.error(`Get metadata failed: ${this.handleError(error).message}`)
      throw this.handleError(error)
    }
  }

  /**
   * Get file versions
   * Returns a list of all versions for a specific file
   */
  async getFileVersions(params: VersionsParams): Promise<{ versions: NonNullable<FileVersionsResponse['data']['versions']>, total: number }> {
      const resolvedPath = resolvePath(
        this.config.basePath,
        this.scopedBasePath,
        params.basePath,
        params.path
      )
      
      logger.debug(`Getting versions for file: ${resolvedPath}`)

    try {
      const response = await _readFile({
        client: this.client,
        path: {
          path: resolvedPath
        },
        query: {
          versions: '',
          limit: params.limit || 10,
          offset: params.offset || 0
        }
      }) as { data?: FileVersionsResponse }

      if (!response.data?.success || !response.data?.data) {
        throw new Error('Failed to get file versions')
      }

      return {
        versions: response.data.data.versions || [],
        total: response.data.data.total || 0
      }
    } catch (error) {
      logger.error(`Get versions failed: ${this.handleError(error).message}`)
      throw this.handleError(error)
    }
  }

  /**
   * Handle and normalize errors from the API
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error
    }
    
    if (typeof error === 'string') {
      return new Error(error)
    }
    
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return new Error(String(error.message))
    }
    
    return new Error('An unknown error occurred')
  }
}