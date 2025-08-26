/**
 * @openfiles/sdk/tools
 * 
 * Framework-agnostic tool definitions for AI agents
 * Provides OpenAI-compatible tool definitions and execution
 */

import type { OpenFilesClient } from '../core'

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
  data?: any
  error?: string
  function: string
  args?: Record<string, any>  // Include original arguments for upstream layers
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

export interface ToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

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

  constructor(client: OpenFilesClient, basePath?: string) {
    this.client = client
    this.basePath = basePath
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
    const effectiveClient = this.basePath 
      ? this.client.withBasePath(this.basePath).withBasePath(basePath)
      : this.client.withBasePath(basePath)
    return new OpenFilesTools(effectiveClient)
  }

  /**
   * OpenAI-compatible tool definitions
   * Use these in your OpenAI chat completions request
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
                example: 'reports/quarterly-report.md'
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
                example: 'reports/quarterly-report.md'
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
                example: 'reports/quarterly-report.md'
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
          description: 'LIST files in a directory. Use when user wants to: browse files, see what exists, explore directory contents, or find available files.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory path to list files from',
                example: 'reports/',
                default: '/'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of files to return',
                default: 10,
                minimum: 1,
                maximum: 100
              }
            },
            required: ['directory', 'limit'],
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
                example: 'reports/quarterly-report.md'
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
                example: 'reports/quarterly-report.md'
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
  async processToolCalls(response: any): Promise<ProcessedToolCalls> {
    const results: ToolResult[] = []
    const toolMessages: Array<{ role: 'tool', tool_call_id: string, content: string }> = []
    let handled = false

    for (const choice of response.choices || []) {
      const toolCalls = choice.message?.tool_calls || []

      for (const toolCall of toolCalls) {
        if (this.isOpenFilesTool(toolCall.function.name)) {
          handled = true

          try {
            const args = JSON.parse(toolCall.function.arguments)
            const result = await this.executeTool(toolCall)
            
            results.push({
              toolCallId: toolCall.id,
              status: 'success',
              data: result,
              function: toolCall.function.name,
              args: args
            })

            // Generate tool message for successful execution
            toolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: true,
                data: result,
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
  private async executeTool(toolCall: ToolCall): Promise<any> {
    const args = JSON.parse(toolCall.function.arguments)

    switch (toolCall.function.name) {
      case 'write_file':
        return await this.client.writeFile({
          path: args.path,
          content: args.content,
          contentType: args.contentType
        })

      case 'read_file': {
        const content = await this.client.readFile({
          path: args.path,
          version: args.version === 0 ? undefined : args.version
        })
        return { path: args.path, content, version: args.version }
      }

      case 'edit_file':
        return await this.client.editFile({
          path: args.path,
          oldString: args.oldString,
          newString: args.newString
        })

      case 'list_files':
        return await this.client.listFiles({
          directory: args.directory,
          limit: args.limit
        })

      case 'append_to_file':
        return await this.client.appendToFile({
          path: args.path,
          content: args.content
        })

      case 'overwrite_file':
        return await this.client.overwriteFile({
          path: args.path,
          content: args.content,
          isBase64: args.isBase64
        })

      case 'get_file_metadata':
        return await this.client.getFileMetadata({
          path: args.path,
          version: args.version === 0 ? undefined : args.version
        })

      case 'get_file_versions':
        return await this.client.getFileVersions({
          path: args.path,
          limit: args.limit,
          offset: args.offset
        })

      default:
        throw new Error(`Unknown tool: ${toolCall.function.name}`)
    }
  }
}