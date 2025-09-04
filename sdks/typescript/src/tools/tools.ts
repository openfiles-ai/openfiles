/**
 * @openfiles-ai/sdk/tools
 * 
 * Framework-agnostic tool definitions for AI agents
 * Provides OpenAI-compatible tool definitions and execution
 */

import type { OpenFilesClient } from '../core'
import { logger } from '../utils'
import type { 
  FileMetadata,
  FileVersionsResponse
} from '../core/generated/types.gen'

// OpenAI types
import type { OpenAI } from 'openai'
type ChatCompletion = OpenAI.Chat.ChatCompletion
type ChatCompletionMessageToolCall = OpenAI.Chat.ChatCompletionMessageToolCall

// Anthropic response type (proper structure for tool use)
type AnthropicResponse = {
  content: Array<{
    type: 'text' | 'tool_use'
    text?: string
    id?: string
    name?: string
    input?: Record<string, unknown>
  }>
  stop_reason?: string
  usage?: Record<string, unknown>
}

// Type aliases for file operation results (actual return types from client methods)
type FileOperationResult = 
  | FileMetadata  // writeFile, editFile, appendToFile, overwriteFile, getFileMetadata
  | string        // readFile
  | { files: FileMetadata[], total: number }  // listFiles
  | { versions: NonNullable<FileVersionsResponse['data']['versions']>, total: number }  // getFileVersions

// OpenAI tool call type (for our use)
type ToolCall = ChatCompletionMessageToolCall & { 
  function: { 
    name: string; 
    arguments: string 
  } 
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    strict?: boolean  // Optional strict mode for OpenAI
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
      additionalProperties?: boolean  // Optional for strict schemas
    }
  }
}

export interface ToolResult {
  toolCallId: string
  status: 'success' | 'error'
  data?: FileOperationResult
  error?: string
  function: string
  args?: Record<string, unknown>  // Include original arguments for upstream layers
}

export interface ProcessedToolCalls {
  handled: boolean
  results: ToolResult[]
  toolMessages: Array<{
    role: 'tool'
    tool_call_id: string
    content: string  // Always stringified JSON
  }>
}

export interface AnthropicProcessedToolCalls {
  handled: boolean
  results: ToolResult[]
  toolMessages: Array<{
    role: 'user'
    content: Array<{
      type: 'tool_result'
      tool_use_id: string
      content: string
    }>
  }>
}

// Removed - using internal ToolCall type alias instead

/**
 * OpenFiles Tools for AI Agents
 * 
 * Provides OpenAI-compatible tool definitions and automatic execution
 * for file operations. Only handles OpenFiles tools, ignoring others.
 * 
 * @example
 * ```typescript
 * const client = new OpenFilesClient({ apiKey: 'oa_...' })
 * const tools = new OpenFilesTools(client)
 * 
 * // With basePath for organized file structure
 * const projectTools = new OpenFilesTools(client, 'projects/website')
 * 
 * // Use with existing OpenAI client
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [...],
 *   tools: [...projectTools.definitions, ...myOtherTools]
 * })
 * 
 * // Process OpenFiles tools only
 * const processed = await projectTools.processToolCalls(response)
 * if (processed.handled) {
 *   console.log('Files created:', processed.results)
 * }
 * ```
 */
export class OpenFilesTools {
  private client: OpenFilesClient
  private basePath?: string
  public openai: OpenAIProvider
  public anthropic: AnthropicProvider

  constructor(client: OpenFilesClient, basePath?: string) {
    this.client = basePath ? client.withBasePath(basePath) : client
    this.basePath = basePath
    this.openai = new OpenAIProvider(this.client, this.getEffectiveBasePath(client, basePath))
    this.anthropic = new AnthropicProvider(this.client, this.getEffectiveBasePath(client, basePath))
  }
  
  private getEffectiveBasePath(client: OpenFilesClient, basePath?: string): string | undefined {
    // Get the client's effective basePath (what will actually be used in API calls)
    const clientBasePath = (client as any).scopedBasePath || (client as any).config?.basePath
    
    if (basePath) {
      // If we're adding a basePath to an existing client basePath, combine them
      if (clientBasePath) {
        return `${clientBasePath}/${basePath}`
      }
      return basePath
    }
    
    // If no additional basePath, just use the client's basePath
    return clientBasePath
  }

  /**
   * Create a new OpenFilesTools instance with a base path prefix
   * All file operations will automatically prefix paths with the base path
   * 
   * @param basePath - The base path to prefix to all operations
   * @returns New OpenFilesTools instance with the specified base path
   * 
   * @example
   * ```typescript
   * const tools = new OpenFilesTools(client)
   * const projectTools = tools.withBasePath('projects/website')
   * 
   * // AI operations will create files under 'projects/website/'
   * ```
   */
  withBasePath(basePath: string): OpenFilesTools {
    const effectiveClient = this.client.withBasePath(basePath)
    const effectiveBasePath = this.basePath ? `${this.basePath}/${basePath}` : basePath
    return new OpenFilesTools(effectiveClient, effectiveBasePath)
  }

}

class OpenAIProvider {
  private client: OpenFilesClient
  private basePath?: string

  constructor(client: OpenFilesClient, basePath?: string) {
    this.client = client
    this.basePath = basePath
  }

  /**
   * Strip basePath from response to make it transparent to AI
   */
  private stripBasePath(result: any): any {
    if (!this.basePath || !result) return result


    // Handle FileMetadata objects
    if (result.path && typeof result.path === 'string') {
      if (result.path.startsWith(this.basePath + '/')) {
        const strippedPath = result.path.slice(this.basePath.length + 1)
        result = { ...result, path: strippedPath }
      }
    }

    // Handle file list responses
    if (result.files && Array.isArray(result.files)) {
      result = {
        ...result,
        files: result.files.map((file: any) => {
          if (file.path && typeof file.path === 'string' && this.basePath && file.path.startsWith(this.basePath + '/')) {
            return { ...file, path: file.path.slice(this.basePath.length + 1) }
          }
          return file
        })
      }
    }

    // Handle file versions response
    if (result.versions && Array.isArray(result.versions)) {
      result = {
        ...result,
        versions: result.versions.map((version: any) => {
          if (version.path && typeof version.path === 'string' && this.basePath && version.path.startsWith(this.basePath + '/')) {
            return { ...version, path: version.path.slice(this.basePath.length + 1) }
          }
          return version
        })
      }
    }

    return result
  }

  /**
   * OpenAI-compatible tool definitions
   */
  get definitions(): ToolDefinition[] {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'write_file',
          description: 'CREATE a NEW file (fails if file exists). Use when user wants to: create, generate, make, or write a new file. For existing files, use edit_file, append_to_file, or overwrite_file instead.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'document.md'
              },
              content: {
                type: 'string',
                description: 'File content to write'
              },
              contentType: {
                type: 'string',
                description: 'MIME type of file content. Provide specific type (e.g., text/plain, text/markdown, application/json) or use application/octet-stream as default',
                default: 'application/octet-stream',
                example: 'text/markdown'
              }
            },
            required: ['path', 'content', 'contentType'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'read_file',
          description: 'READ and DISPLAY existing file content. Use when user asks to: see, show, read, view, display, or retrieve file content. Returns the actual content to show the user.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'document.md'
              },
              version: {
                type: 'number',
                description: 'Specific version to read (use 0 or omit for latest version)',
                default: 0
              }
            },
            required: ['path', 'version'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'edit_file',
          description: 'MODIFY parts of an existing file by replacing specific text. Use when user wants to: update, change, fix, or edit specific portions while keeping the rest.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'document.md'
              },
              oldString: {
                type: 'string',
                description: 'Exact string to find and replace'
              },
              newString: {
                type: 'string',
                description: 'Replacement string'
              }
            },
            required: ['path', 'oldString', 'newString'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'list_files',
          description: 'LIST files. Use when user wants to: browse files, see what exists, explore contents, or find available files. IMPORTANT: Always use recursive=true unless user explicitly asks for a specific directory only.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory path to list files from',
                example: 'folder/',
                default: '/'
              },
              recursive: {
                type: 'boolean',
                description: 'IMPORTANT: Use true to search all directories (recommended for "list all files"), false only for specific directory browsing',
                default: true
              },
              limit: {
                type: 'number',
                description: 'Maximum number of files to return',
                default: 10,
                minimum: 1,
                maximum: 100
              }
            },
            required: ['directory', 'recursive', 'limit'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'append_to_file',
          description: 'ADD content to the END of existing file. Use for: adding to logs, extending lists, continuing documents, or accumulating data without losing existing content.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'logs/daily-operations.log'
              },
              content: {
                type: 'string',
                description: 'Content to append to the file'
              }
            },
            required: ['path', 'content'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'overwrite_file',
          description: 'REPLACE ALL content in existing file. Use when user wants to: completely rewrite, reset, or replace entire file content. Keeps the file but changes everything inside.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'policies/employee-handbook.md'
              },
              content: {
                type: 'string',
                description: 'New content to replace existing content'
              },
              isBase64: {
                type: 'boolean',
                description: 'Whether the content is base64 encoded',
                default: false
              }
            },
            required: ['path', 'content', 'isBase64'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_file_metadata',
          description: 'GET file information (size, version, dates) WITHOUT content. Use for: checking file stats, properties, or metadata when content is not needed.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'document.md'
              },
              version: {
                type: 'number',
                description: 'Specific version to get metadata for (use 0 for latest version)',
                default: 0
              }
            },
            required: ['path', 'version'],
            additionalProperties: false
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_file_versions',
          description: 'GET version history of a file. Use when user wants to: see file history, list all versions, or access previous versions.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path (S3-style, no leading slash)',
                example: 'document.md'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of versions to return',
                default: 10,
                minimum: 1,
                maximum: 100
              },
              offset: {
                type: 'number',
                description: 'Number of versions to skip for pagination',
                default: 0,
                minimum: 0
              }
            },
            required: ['path', 'limit', 'offset'],
            additionalProperties: false
          }
        }
      }
    ]
  }

  /**
   * Process OpenAI tool calls and execute OpenFiles tools
   * 
   * Handles ONLY OpenFiles tools, completely ignores others.
   * This allows you to use OpenFiles alongside other tools.
   * 
   * Returns tool messages formatted for OpenAI conversation flow.
   */
  // Type guard for function tool calls
  private isFunctionToolCall(toolCall: ChatCompletionMessageToolCall): toolCall is ChatCompletionMessageToolCall & { function: { name: string; arguments: string } } {
    return 'function' in toolCall && toolCall.function && typeof toolCall.function.name === 'string';
  }

  async processToolCalls(response: ChatCompletion): Promise<ProcessedToolCalls> {
    const results: ToolResult[] = []
    const toolMessages: Array<{ role: 'tool', tool_call_id: string, content: string }> = []
    let handled = false

    for (const choice of response.choices || []) {
      const toolCalls = choice.message?.tool_calls || []

      for (const toolCall of toolCalls) {
        // Only process function tool calls
        if (!this.isFunctionToolCall(toolCall)) continue;
        
        if (this.isOpenFilesTool(toolCall.function.name)) {
          handled = true

          try {
            const args = JSON.parse(toolCall.function.arguments)
            const result = await this.executeTool(toolCall)  // result is already stripped
            
            results.push({
              toolCallId: toolCall.id,
              status: 'success',
              data: result,  // stripped result
              function: toolCall.function.name,
              args: args
            })

            // Generate tool message for successful execution
            toolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: true,
                data: result,  // stripped result
                operation: toolCall.function.name
              })
            })
          } catch (error) {
            const args = JSON.parse(toolCall.function.arguments)
            const errorMessage = error instanceof Error ? error.message : String(error)
            
            results.push({
              toolCallId: toolCall.id,
              status: 'error',
              error: errorMessage,
              function: toolCall.function.name,
              args: args
            })

            // Generate tool message for error
            toolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: false,
                error: {
                  code: 'EXECUTION_ERROR',
                  message: errorMessage
                },
                operation: toolCall.function.name
              })
            })
          }
        }
        // Completely ignore non-OpenFiles tools
      }
    }

    return {
      handled,
      results,
      toolMessages
    }
  }

  /**
   * Check if a tool name is an OpenFiles tool (internal method)
   */
  private isOpenFilesTool(name: string): boolean {
    return [
      'write_file', 
      'read_file', 
      'edit_file', 
      'list_files',
      'append_to_file',
      'overwrite_file', 
      'get_file_metadata', 
      'get_file_versions'
    ].includes(name)
  }

  /**
   * Execute a single tool call (private - for internal use only)
   */
  private async executeTool(toolCall: ToolCall): Promise<FileOperationResult> {
    const args = JSON.parse(toolCall.function.arguments)
    let result: FileOperationResult

    switch (toolCall.function.name) {
      case 'write_file':
        result = await this.client.writeFile({
          path: args.path as string,
          content: args.content as string as string,
          contentType: args.contentType as any
        })
        break

      case 'read_file': {
        const content = await this.client.readFile({
          path: args.path as string,
          version: args.version === 0 ? undefined : (args.version as number)
        })
        return content  // String content doesn't need path stripping
      }

      case 'edit_file':
        result = await this.client.editFile({
          path: args.path as string,
          oldString: args.oldString as string,
          newString: args.newString as string
        })
        break

      case 'list_files': {
        const listParams: {
          directory?: string;
          limit?: number;
          recursive?: boolean;
        } = {
          directory: args.directory as string,
          limit: args.limit as number
        }
        if (args.recursive !== undefined) {
          listParams.recursive = args.recursive as boolean
        }
        logger.debug(`list_files params: ${JSON.stringify(listParams, null, 2)}`)
        result = await this.client.listFiles(listParams)
        break
      }

      case 'append_to_file':
        result = await this.client.appendToFile({
          path: args.path as string,
          content: args.content as string
        })
        break

      case 'overwrite_file':
        result = await this.client.overwriteFile({
          path: args.path as string,
          content: args.content as string as string,
          isBase64: args.isBase64 as boolean
        })
        break

      case 'get_file_metadata':
        result = await this.client.getFileMetadata({
          path: args.path as string,
          version: args.version === 0 ? undefined : (args.version as number)
        })
        break

      case 'get_file_versions':
        result = await this.client.getFileVersions({
          path: args.path as string,
          limit: args.limit as number,
          offset: args.offset as number
        })
        break

      default:
        throw new Error(`Unknown tool: ${toolCall.function.name}`)
    }

    // Strip basePath from the result to make it transparent to AI
    return this.stripBasePath(result)
  }
}

class AnthropicProvider {
  private client: OpenFilesClient
  private basePath?: string

  constructor(client: OpenFilesClient, basePath?: string) {
    this.client = client
    this.basePath = basePath
  }

  /**
   * Strip basePath from response to make it transparent to AI
   */
  private stripBasePath(result: any): any {
    if (!this.basePath || !result) return result


    // Handle FileMetadata objects
    if (result.path && typeof result.path === 'string') {
      if (result.path.startsWith(this.basePath + '/')) {
        const strippedPath = result.path.slice(this.basePath.length + 1)
        result = { ...result, path: strippedPath }
      }
    }

    // Handle file list responses
    if (result.files && Array.isArray(result.files)) {
      result = {
        ...result,
        files: result.files.map((file: any) => {
          if (file.path && typeof file.path === 'string' && this.basePath && file.path.startsWith(this.basePath + '/')) {
            return { ...file, path: file.path.slice(this.basePath.length + 1) }
          }
          return file
        })
      }
    }

    // Handle file versions response
    if (result.versions && Array.isArray(result.versions)) {
      result = {
        ...result,
        versions: result.versions.map((version: any) => {
          if (version.path && typeof version.path === 'string' && this.basePath && version.path.startsWith(this.basePath + '/')) {
            return { ...version, path: version.path.slice(this.basePath.length + 1) }
          }
          return version
        })
      }
    }

    return result
  }

  /**
   * Anthropic-compatible tool definitions
   */
  get definitions(): any[] {
    return [
      {
        name: 'write_file',
        description: 'CREATE a NEW file (fails if file exists). Use when user wants to: create, generate, make, or write a new file. For existing files, use edit_file, append_to_file, or overwrite_file instead.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            content: {
              type: 'string',
              description: 'File content to write'
            },
            contentType: {
              type: 'string',
              description: 'MIME type of file content. Provide specific type (e.g., text/plain, text/markdown, application/json) or use application/octet-stream as default',
              default: 'application/octet-stream'
            }
          },
          required: ['path', 'content', 'contentType']
        }
      },
      {
        name: 'read_file',
        description: 'READ and DISPLAY existing file content. Use when user asks to: see, show, read, view, display, or retrieve file content. Returns the actual content to show the user.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            version: {
              type: 'number',
              description: 'Specific version to read (use 0 or omit for latest version)',
              default: 0
            }
          },
          required: ['path', 'version']
        }
      },
      {
        name: 'edit_file',
        description: 'MODIFY parts of an existing file by replacing specific text. Use when user wants to: update, change, fix, or edit specific portions while keeping the rest.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            oldString: {
              type: 'string',
              description: 'Exact string to find and replace'
            },
            newString: {
              type: 'string',
              description: 'Replacement string'
            }
          },
          required: ['path', 'oldString', 'newString']
        }
      },
      {
        name: 'list_files',
        description: 'LIST files. Use when user wants to: browse files, see what exists, explore contents, or find available files. IMPORTANT: Always use recursive=true unless user explicitly asks for a specific directory only.',
        input_schema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory path to list files from',
              default: '/'
            },
            recursive: {
              type: 'boolean',
              description: 'IMPORTANT: Use true to search all directories (recommended for "list all files"), false only for specific directory browsing',
              default: true
            },
            limit: {
              type: 'number',
              description: 'Maximum number of files to return',
              default: 10,
              minimum: 1,
              maximum: 100
            }
          },
          required: ['directory', 'recursive', 'limit']
        }
      },
      {
        name: 'append_to_file',
        description: 'ADD content to the END of existing file. Use for: adding to logs, extending lists, continuing documents, or accumulating data without losing existing content.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            content: {
              type: 'string',
              description: 'Content to append to the file'
            }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'overwrite_file',
        description: 'REPLACE ALL content in existing file. Use when user wants to: completely rewrite, reset, or replace entire file content. Keeps the file but changes everything inside.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            content: {
              type: 'string',
              description: 'New content to replace existing content'
            },
            isBase64: {
              type: 'boolean',
              description: 'Whether the content is base64 encoded',
              default: false
            }
          },
          required: ['path', 'content', 'isBase64']
        }
      },
      {
        name: 'get_file_metadata',
        description: 'GET file information (size, version, dates) WITHOUT content. Use for: checking file stats, properties, or metadata when content is not needed.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            version: {
              type: 'number',
              description: 'Specific version to get metadata for (use 0 for latest version)',
              default: 0
            }
          },
          required: ['path', 'version']
        }
      },
      {
        name: 'get_file_versions',
        description: 'GET version history of a file. Use when user wants to: see file history, list all versions, or access previous versions.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path (S3-style, no leading slash)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of versions to return',
              default: 10,
              minimum: 1,
              maximum: 100
            },
            offset: {
              type: 'number',
              description: 'Number of versions to skip for pagination',
              default: 0,
              minimum: 0
            }
          },
          required: ['path', 'limit', 'offset']
        }
      }
    ]
  }

  /**
   * Process Anthropic tool calls and execute OpenFiles tools
   */
  async processToolCalls(response: AnthropicResponse): Promise<AnthropicProcessedToolCalls> {
    const results: ToolResult[] = []
    const toolMessages: Array<{
      role: 'user'
      content: Array<{
        type: 'tool_result'
        tool_use_id: string
        content: string
      }>
    }> = []
    let handled = false

    // Anthropic format: response.content is an array with tool_use objects
    const content = response.content || []
    const toolResults: Array<{
      type: 'tool_result'
      tool_use_id: string
      content: string
    }> = []

    for (const item of content) {
      if (item.type === 'tool_use' && item.name && this.isOpenFilesTool(item.name)) {
        handled = true

        try {
          const result = await this.executeTool({
            id: item.id || '',
            name: item.name,
            input: item.input || {}
          })
          
          results.push({
            toolCallId: item.id || '',
            status: 'success',
            data: result,
            function: item.name,
            args: item.input || {}
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: item.id || '',
            content: JSON.stringify({
              success: true,
              data: result,
              operation: item.name
            })
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          
          results.push({
            toolCallId: item.id || '',
            status: 'error',
            error: errorMessage,
            function: item.name || '',
            args: item.input || {}
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: item.id || '',
            content: JSON.stringify({
              success: false,
              error: {
                code: 'EXECUTION_ERROR',
                message: errorMessage
              },
              operation: item.name || ''
            })
          })
        }
      }
    }

    if (toolResults.length > 0) {
      toolMessages.push({
        role: 'user',
        content: toolResults
      })
    }

    return {
      handled,
      results,
      toolMessages
    }
  }

  /**
   * Check if a tool name is an OpenFiles tool
   */
  private isOpenFilesTool(name: string): boolean {
    return [
      'write_file', 
      'read_file', 
      'edit_file', 
      'list_files',
      'append_to_file',
      'overwrite_file', 
      'get_file_metadata', 
      'get_file_versions'
    ].includes(name)
  }

  /**
   * Execute a single Anthropic tool call
   */
  private async executeTool(toolCall: { id: string, name: string, input: Record<string, unknown> }): Promise<FileOperationResult> {
    const args = toolCall.input
    let result: FileOperationResult

    switch (toolCall.name) {
      case 'write_file':
        result = await this.client.writeFile({
          path: args.path as string,
          content: args.content as string as string,
          contentType: args.contentType as any
        })
        break

      case 'read_file': {
        const content = await this.client.readFile({
          path: args.path as string,
          version: args.version === 0 ? undefined : (args.version as number)
        })
        return content  // String content doesn't need path stripping
      }

      case 'edit_file':
        result = await this.client.editFile({
          path: args.path as string,
          oldString: args.oldString as string,
          newString: args.newString as string
        })
        break

      case 'list_files':
        const listParams: {
          directory?: string;
          limit?: number;
          recursive?: boolean;
        } = {
          directory: args.directory as string,
          limit: args.limit as number
        }
        if (args.recursive !== undefined) {
          listParams.recursive = args.recursive as boolean
        }
        logger.debug(`list_files params: ${JSON.stringify(listParams, null, 2)}`)
        result = await this.client.listFiles(listParams)
        break

      case 'append_to_file':
        result = await this.client.appendToFile({
          path: args.path as string,
          content: args.content as string
        })
        break

      case 'overwrite_file':
        result = await this.client.overwriteFile({
          path: args.path as string,
          content: args.content as string as string,
          isBase64: args.isBase64 as boolean
        })
        break

      case 'get_file_metadata':
        result = await this.client.getFileMetadata({
          path: args.path as string,
          version: args.version === 0 ? undefined : (args.version as number)
        })
        break

      case 'get_file_versions':
        result = await this.client.getFileVersions({
          path: args.path as string,
          limit: args.limit as number,
          offset: args.offset as number
        })
        break

      default:
        throw new Error(`Unknown tool: ${toolCall.name}`)
    }

    // Strip basePath from the result to make it transparent to AI
    return this.stripBasePath(result)
  }
}