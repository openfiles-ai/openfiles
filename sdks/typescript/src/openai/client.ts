/**
 * @openfiles-ai/sdk/openai
 * 
 * OpenAI client with OpenFiles tool integration
 * Follows OpenAI 2025 best practices for tool calling with structured outputs
 */

import { OpenAI as OriginalOpenAI } from 'openai'
import type { ClientOptions as OriginalClientOptions } from 'openai'

// Use proper OpenAI namespace types
type OriginalCreateParams = OriginalOpenAI.Chat.ChatCompletionCreateParams
type ChatCompletion = OriginalOpenAI.Chat.ChatCompletion
type ChatCompletionCreateMethod = OriginalOpenAI.Chat.Completions['create']
import { OpenFilesClient } from '../core'
import { OpenFilesTools } from '../tools'
import { logger } from '../utils'
import type { 
  FileMetadata,
  FileVersionsResponse
} from '../core/generated/types.gen'

// Type aliases for better clarity (actual return types from client methods)
type FileOperationResult = 
  | FileMetadata  // writeFile, editFile, appendToFile, overwriteFile, getFileMetadata
  | string        // readFile
  | { files: FileMetadata[], total: number }  // listFiles
  | { versions: NonNullable<FileVersionsResponse['data']['versions']>, total: number }  // getFileVersions
type OpenAICreateResponse = ChatCompletion | AsyncIterable<any>
type ToolMessage = { role: 'tool'; tool_call_id: string; content: string }

export interface FileOperation {
  action: string
  path?: string
  version?: number
  success: boolean
  error?: string
  data?: FileOperationResult
}

export interface ToolExecution {
  toolCallId: string
  function: string
  duration?: number
  success: boolean
  result?: FileOperationResult
  error?: string
}

// Enhanced OpenAI configuration that includes OpenFiles functionality
export interface ClientOptions extends OriginalClientOptions {
  /** OpenFiles API key (required for file operations) */
  openFilesApiKey: string
  /** Base URL for OpenFiles API (optional) */
  openFilesBaseUrl?: string
  /** Base path prefix for all file operations (optional) */
  basePath?: string

  // Optional callbacks for monitoring file operations
  onFileOperation?: (operation: FileOperation) => void
  onToolExecution?: (execution: ToolExecution) => void
  onError?: (error: Error) => void
}

// Re-export OpenAI types with same names for drop-in compatibility
export type ChatCompletionCreateParams = OriginalCreateParams
export type { ChatCompletion }

// Re-export commonly used OpenAI types for convenience
export type ChatCompletionMessage = OriginalOpenAI.Chat.ChatCompletionMessage
export type ChatCompletionMessageParam = OriginalOpenAI.Chat.ChatCompletionMessageParam
export type ChatCompletionTool = OriginalOpenAI.Chat.ChatCompletionTool
export type ChatCompletionCreateParamsNonStreaming = OriginalOpenAI.Chat.ChatCompletionCreateParamsNonStreaming
export type ChatCompletionCreateParamsStreaming = OriginalOpenAI.Chat.ChatCompletionCreateParamsStreaming

/**
 * Drop-in replacement for OpenAI client with automatic file operations
 * 
 * Simply replace your OpenAI import and add openFilesApiKey to get
 * automatic file operation capabilities with zero code changes.
 * 
 * @example
 * ```typescript
 * // Before: import OpenAI from 'openai'
 * // After:  import OpenAI from '@openfiles-ai/sdk/openai'
 * 
 * const ai = new OpenAI({
 *   apiKey: 'sk_your_openai_key',           // Same as before
 *   openFilesApiKey: 'oa_your_key',    // Add this
 *   basePath: 'projects/website',           // Optional: organize files
 *   onFileOperation: (op) => console.log(`${op.action}: ${op.path}`)  // Optional
 * })
 * 
 * // Create scoped clients for different areas
 * const configAI = ai.withBasePath('config')
 * const docsAI = ai.withBasePath('documentation')
 * 
 * // Everything else works exactly the same!
 * const response = await configAI.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Generate app configuration file' }],
 *   tools: [...myCustomTools]  // Your tools + OpenFiles tools (auto-injected)
 * })
 * 
 * // File operations happen automatically, response ready to use!
 * console.log(response.choices[0].message.content)
 * ```
 */
export class OpenAI extends OriginalOpenAI {
  private artifacts: OpenFilesClient
  private toolsInstance: OpenFilesTools
  private config: ClientOptions

  constructor(config: ClientOptions) {
    // Extract OpenAI-specific options
    const { openFilesApiKey, openFilesBaseUrl, basePath, ...openAIConfig } = config
    super(openAIConfig)

    this.config = config
    const clientConfig: { apiKey: string; baseUrl?: string; basePath?: string } = {
      apiKey: openFilesApiKey,
      ...(openFilesBaseUrl && { baseUrl: openFilesBaseUrl }),
      ...(basePath && { basePath: basePath })
    }
    this.artifacts = new OpenFilesClient(clientConfig)
    this.toolsInstance = new OpenFilesTools(this.artifacts)
    
    logger.info(`OpenAI client initialized with file operations${basePath ? ` (basePath: ${basePath})` : ''}`)

    // Override chat.completions.create to auto-handle OpenFiles tools
    const originalCreate = this.chat.completions.create.bind(this.chat.completions)
    ;(this.chat.completions as any).create = this.createEnhancedMethod(originalCreate)
  }

  /**
   * Create a new OpenAI client instance with a base path prefix
   * All file operations will automatically prefix paths with the base path
   * 
   * @param basePath - The base path to prefix to all operations
   * @returns New OpenAI client instance with the specified base path
   * 
   * @example
   * ```typescript
   * const ai = new OpenAI({ apiKey: 'sk_...', openFilesApiKey: 'oa_...' })
   * const projectAI = ai.withBasePath('projects/website')
   * 
   * // AI operations will create files under 'projects/website/'
   * const response = await projectAI.chat.completions.create({
   *   model: 'gpt-4',
   *   messages: [{ role: 'user', content: 'Create config.json' }]
   * })
   * ```
   */
  withBasePath(basePath: string): OpenAI {
    const enhancedConfig = {
      ...this.config,
      basePath: this.config.basePath 
        ? `${this.config.basePath}/${basePath}`.replace(/\/+/g, '/').replace(/\/+$/, '')
        : basePath
    }
    return new OpenAI(enhancedConfig)
  }

  /**
   * Create enhanced method with proper typing for OpenAI API overloads
   */
  private createEnhancedMethod(originalCreate: ChatCompletionCreateMethod) {
    return async (params: ChatCompletionCreateParams) => {
      return this.enhancedCreate(originalCreate, params)
    }
  }

  /**
   * Enhanced create method that auto-handles OpenFiles tools
   * True drop-in replacement - user doesn't need to manage tool flow
   */
  private async enhancedCreate(originalCreate: ChatCompletionCreateMethod, params: ChatCompletionCreateParams): Promise<OpenAICreateResponse> {
    // Auto-inject OpenFiles tools alongside user's tools
    const enhancedParams: ChatCompletionCreateParams = {
      ...params,
      parallel_tool_calls: false,  // Force sequential execution for reliable file operations
      tools: [
        ...this.toolsInstance.openai.definitions,
        ...(params.tools || [])
      ]
    }

    // Call OpenAI API
    const response = await originalCreate(enhancedParams)

    // Check if response is streamable (has Symbol.asyncIterator)
    if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
      // For streaming responses, return as-is without tool processing
      return response
    }
    
    const chatResponse = response as ChatCompletion

    // Auto-execute OpenFiles tools if present
    const toolMessages = await this.executeTools(chatResponse)
    
    if (toolMessages.length > 0) {
      // Continue conversation with tool results automatically
      const finalResponse = await originalCreate({
        ...params,
        messages: [
          ...params.messages,
          chatResponse.choices[0].message,
          ...toolMessages
        ]
      }) as ChatCompletion
      return finalResponse
    }

    return chatResponse
  }

  /**
   * Execute OpenFiles tools from a completion response
   * Returns tool messages that should be added to the conversation
   * 
   * @param response - OpenAI completion response containing tool calls
   * @returns Array of tool messages to add to conversation
   */
  async executeTools(response: ChatCompletion): Promise<ToolMessage[]> {
    const toolMessages: ToolMessage[] = []
    
    // Track timing for the entire tool processing
    const startTime = Date.now()
    
    // Use the tools layer to process the response
    const processed = await this.toolsInstance.openai.processToolCalls(response)
    
    const totalDuration = Date.now() - startTime
    
    // Convert framework-agnostic results to OpenAI tool message format
    for (const result of processed.results) {
      if (result.status === 'success') {
        toolMessages.push({
          role: 'tool',
          tool_call_id: result.toolCallId,
          content: JSON.stringify({
            success: true,
            data: result.data,
            operation: result.function,
            message: result.data ? this.getOperationMessage(result.function, result.args || {}, result.data) : `Completed ${result.function} operation`
          })
        })

        // Trigger callbacks for successful operations
        let operationPath = (result.data as any)?.path || result.args?.path
        
        // Handle special cases for operations without specific paths
        if (result.function === 'list_files') {
          const directory = result.args?.directory || '/'
          operationPath = `${directory} (${(result.data as any)?.files?.length || 0} files)`
        }
        
        this.config.onFileOperation?.({
          action: result.function.replaceAll('_', ' '),
          path: operationPath,
          version: (result.data as any)?.version,
          success: true,
          data: result.data
        })

        this.config.onToolExecution?.({
          toolCallId: result.toolCallId,
          function: result.function,
          success: true,
          result: result.data,
          duration: totalDuration
        })

        // Handle logging with same logic as callbacks
        let logPath = (result.data as any)?.path || result.args?.path
        if (result.function === 'list_files') {
          const directory = result.args?.directory || '/'
          logPath = `${directory} (${(result.data as any)?.files?.length || 0} files)`
        }
        logger.success(result.function, logPath)
      } else {
        // Handle error results
        toolMessages.push({
          role: 'tool',
          tool_call_id: result.toolCallId,
          content: JSON.stringify({
            success: false,
            error: {
              code: 'EXECUTION_ERROR',
              message: result.error || 'Unknown error'
            },
            operation: result.function
          })
        })

        this.config.onError?.(new Error(result.error || 'Unknown error'))

        this.config.onToolExecution?.({
          toolCallId: result.toolCallId,
          function: result.function,
          success: false,
          error: result.error,
          duration: totalDuration
        })

        logger.error(`${result.function} failed: ${result.error}`)
      }
    }

    return toolMessages
  }


  /**
   * Generate descriptive message for tool operation result
   */
  private getOperationMessage(operation: string, args: Record<string, unknown>, result: FileOperationResult): string {
    // Helper function to safely access path from result
    const getPath = (result: FileOperationResult): string => {
      if (typeof result === 'object' && result && 'path' in result) {
        return (result as FileMetadata).path || '';
      }
      return '';
    };

    const fileName = (args.path as string) || getPath(result) || 'file';
    
    switch (operation) {
      case 'write_file':
      case 'overwrite_file': {
        const size = (typeof result === 'object' && result && 'size' in result) 
          ? (result as FileMetadata).size : 0;
        return `${operation === 'write_file' ? 'Created' : 'Overwrote'} file "${fileName}" (${size || 0} bytes)`;
      }
      case 'read_file': {
        const content = typeof result === 'string' ? result : '';
        return `Read content from "${fileName}" (${content.length || 0} characters)`;
      }
      case 'list_files': {
        const files = (typeof result === 'object' && result && 'files' in result)
          ? (result as { files: FileMetadata[], total: number }).files : [];
        return `Listed ${files?.length || 0} files in directory`;
      }
      case 'get_file_versions': {
        const versions = (typeof result === 'object' && result && 'versions' in result)
          ? (result as { versions: unknown[], total: number }).versions : [];
        return `Retrieved ${versions?.length || 0} versions for "${fileName}"`;
      }
      case 'edit_file':
        return `Updated file "${fileName}" with string replacement`;
      case 'append_to_file':
        return `Added content to "${fileName}"`;
      case 'get_file_metadata':
        return `Retrieved metadata for "${fileName}"`;
      default:
        return `Completed ${operation} operation`;
    }
  }

  /**
   * Get OpenFiles tool definitions for use in chat completions
   */
  get tools() {
    return {
      definitions: this.toolsInstance.openai.definitions
    }
  }

  /**
   * Access to the underlying OpenFiles client
   * For direct API calls when needed
   */
  get openfiles(): OpenFilesClient {
    return this.artifacts
  }
}

// Default export for drop-in replacement
export default OpenAI