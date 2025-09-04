/**
 * Tests for OpenFilesTools
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenFilesTools } from './tools'
import type { OpenFilesClient } from '../core'

const mockClient: OpenFilesClient = {
  writeFile: vi.fn(),
  readFile: vi.fn(),
  editFile: vi.fn(),
  appendToFile: vi.fn(),
  overwriteFile: vi.fn(),
  listFiles: vi.fn(),
  getFileMetadata: vi.fn(),
  getFileVersions: vi.fn(),
  withBasePath: vi.fn()
} as any

describe('OpenFilesTools', () => {
  let tools: OpenFilesTools

  beforeEach(() => {
    vi.clearAllMocks()
    tools = new OpenFilesTools(mockClient)
  })

  describe('openai.definitions', () => {
    it('should return OpenAI-compatible tool definitions', () => {
      const definitions = tools.openai.definitions

      expect(definitions).toHaveLength(8)
      expect(definitions[0].function.name).toBe('write_file')
      expect(definitions[1].function.name).toBe('read_file')
      expect(definitions[2].function.name).toBe('edit_file')
      expect(definitions[3].function.name).toBe('list_files')
      expect(definitions[4].function.name).toBe('append_to_file')
      expect(definitions[5].function.name).toBe('overwrite_file')
      expect(definitions[6].function.name).toBe('get_file_metadata')
      expect(definitions[7].function.name).toBe('get_file_versions')

      // Check structure
      definitions.forEach(def => {
        expect(def.type).toBe('function')
        expect(def.function).toHaveProperty('name')
        expect(def.function).toHaveProperty('description')
        expect(def.function).toHaveProperty('parameters')
        expect(def.function.parameters).toHaveProperty('type', 'object')
        expect(def.function.parameters).toHaveProperty('properties')
        expect(def.function.parameters).toHaveProperty('required')
      })
    })
  })

  describe('anthropic.definitions', () => {
    it('should return Anthropic-compatible tool definitions', () => {
      const definitions = tools.anthropic.definitions

      expect(definitions).toHaveLength(8)
      expect(definitions[0].name).toBe('write_file')
      expect(definitions[1].name).toBe('read_file')
      expect(definitions[2].name).toBe('edit_file')
      expect(definitions[3].name).toBe('list_files')
      expect(definitions[4].name).toBe('append_to_file')
      expect(definitions[5].name).toBe('overwrite_file')
      expect(definitions[6].name).toBe('get_file_metadata')
      expect(definitions[7].name).toBe('get_file_versions')

      // Check Anthropic structure (flat with input_schema)
      definitions.forEach(def => {
        expect(def).toHaveProperty('name')
        expect(def).toHaveProperty('description')
        expect(def).toHaveProperty('input_schema')
        expect(def.input_schema).toHaveProperty('type', 'object')
        expect(def.input_schema).toHaveProperty('properties')
        expect(def.input_schema).toHaveProperty('required')
      })
    })
  })

  describe('provider structure', () => {
    it('should have openai provider with correct methods', () => {
      expect(tools).toHaveProperty('openai')
      expect(tools.openai).toHaveProperty('definitions')
      expect(tools.openai).toHaveProperty('processToolCalls')
      expect(typeof tools.openai.processToolCalls).toBe('function')
    })

    it('should have anthropic provider with correct methods', () => {
      expect(tools).toHaveProperty('anthropic')
      expect(tools.anthropic).toHaveProperty('definitions')
      expect(tools.anthropic).toHaveProperty('processToolCalls')
      expect(typeof tools.anthropic.processToolCalls).toBe('function')
    })
  })

  describe('tool execution integration', () => {
    it('should execute tools through processToolCalls', async () => {
      const mockResult = { id: 'file-123', path: 'test.txt', version: 1 }
      ;(mockClient.writeFile as any).mockResolvedValue(mockResult)

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'write_file',
                arguments: JSON.stringify({
                  path: 'test.txt',
                  content: 'Hello World',
                  contentType: 'text/plain'
                })
              }
            }]
          }
        }]
      }

      const result = await tools.openai.processToolCalls(response)

      expect(mockClient.writeFile).toHaveBeenCalledWith({
        path: 'test.txt',
        content: 'Hello World',
        contentType: 'text/plain'
      })
      expect(result.handled).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].status).toBe('success')
    })
  })

  describe('openai.processToolCalls', () => {
    it('should process tool calls with OpenFiles tools', async () => {
      ;(mockClient.writeFile as any).mockResolvedValue({ id: 'file-123', path: 'test.txt' })

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'write_file',
                arguments: JSON.stringify({
                  path: 'test.txt',
                  content: 'Hello World'
                })
              }
            }]
          }
        }]
      }

      const result = await tools.openai.processToolCalls(response)

      expect(result.handled).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual({
        toolCallId: 'call-123',
        status: 'success',
        data: { id: 'file-123', path: 'test.txt' },
        function: 'write_file',
        args: { path: 'test.txt', content: 'Hello World' }
      })
    })

    it('should ignore non-OpenFiles tools', async () => {
      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'get_weather',
                arguments: '{"location": "NYC"}'
              }
            }]
          }
        }]
      }

      const result = await tools.openai.processToolCalls(response)

      expect(result.handled).toBe(false)
      expect(result.results).toHaveLength(0)
    })

    it('should handle mixed tools', async () => {
      ;(mockClient.readFile as any).mockResolvedValue('Hello World')

      const response = {
        choices: [{
          message: {
            tool_calls: [
              {
                id: 'call-123',
                function: {
                  name: 'read_file',
                  arguments: JSON.stringify({ path: 'test.txt' })
                }
              },
              {
                id: 'call-456',
                function: {
                  name: 'get_weather',
                  arguments: '{"location": "NYC"}'
                }
              }
            ]
          }
        }]
      }

      const result = await tools.openai.processToolCalls(response)

      expect(result.handled).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].function).toBe('read_file')
    })

    it('should handle tool execution errors', async () => {
      ;(mockClient.writeFile as any).mockRejectedValue(new Error('File already exists'))

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'write_file',
                arguments: JSON.stringify({
                  path: 'test.txt',
                  content: 'Hello World'
                })
              }
            }]
          }
        }]
      }

      const result = await tools.openai.processToolCalls(response)

      expect(result.handled).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual({
        toolCallId: 'call-123',
        status: 'error',
        error: 'File already exists',
        function: 'write_file',
        args: { path: 'test.txt', content: 'Hello World' }
      })
    })
  })

  describe('basePath functionality', () => {
    it('should create tools with constructor basePath', () => {
      const toolsWithBasePath = new OpenFilesTools(mockClient, 'projects/website')
      expect(toolsWithBasePath).toBeInstanceOf(OpenFilesTools)
    })

    it('should create scoped tools with withBasePath', () => {
      const mockScopedClient = { ...mockClient }
      ;(mockClient.withBasePath as any).mockReturnValue(mockScopedClient)
      
      const scopedTools = tools.withBasePath('projects/website')
      
      expect(mockClient.withBasePath).toHaveBeenCalledWith('projects/website')
      expect(scopedTools).toBeInstanceOf(OpenFilesTools)
      expect(scopedTools).not.toBe(tools) // Should be new instance
    })

    it('should handle basePath in tool parameters for write_file', async () => {
      ;(mockClient.writeFile as any).mockResolvedValue({
        path: 'projects/website/config.json',
        version: 1,
        contentType: 'application/json'
      })

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'write_file',
                arguments: JSON.stringify({
                  path: 'config.json',
                  content: '{"theme": "dark"}',
                  contentType: 'application/json',
                  basePath: 'projects/website'
                })
              }
            }]
          }
        }]
      }

      const result = await tools.openai.processToolCalls(response)

      expect(mockClient.writeFile).toHaveBeenCalledWith({
        path: 'config.json',
        content: '{"theme": "dark"}',
        contentType: 'application/json'
      })

      expect(result.handled).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].status).toBe('success')
    })

    it('should handle basePath in tool parameters for read_file', async () => {
      ;(mockClient.readFile as any).mockResolvedValue('{"theme": "dark"}')

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'read_file',
                arguments: JSON.stringify({
                  path: 'config.json',
                  version: 0,
                  basePath: 'projects/website'
                })
              }
            }]
          }
        }]
      }

      await tools.openai.processToolCalls(response)

      expect(mockClient.readFile).toHaveBeenCalledWith({
        path: 'config.json',
        version: undefined
      })
    })

    it('should handle basePath in tool parameters for edit_file', async () => {
      ;(mockClient.editFile as any).mockResolvedValue({
        path: 'projects/website/config.json',
        version: 2
      })

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'edit_file',
                arguments: JSON.stringify({
                  path: 'config.json',
                  oldString: 'dark',
                  newString: 'light',
                  basePath: 'projects/website'
                })
              }
            }]
          }
        }]
      }

      await tools.openai.processToolCalls(response)

      expect(mockClient.editFile).toHaveBeenCalledWith({
        path: 'config.json',
        oldString: 'dark',
        newString: 'light'
      })
    })

    it('should handle basePath in tool parameters for list_files', async () => {
      ;(mockClient.listFiles as any).mockResolvedValue({
        files: [],
        total: 0
      })

      const response = {
        choices: [{
          message: {
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'list_files',
                arguments: JSON.stringify({
                  directory: 'configs',
                  limit: 10,
                  basePath: 'projects/website'
                })
              }
            }]
          }
        }]
      }

      await tools.openai.processToolCalls(response)

      expect(mockClient.listFiles).toHaveBeenCalledWith({
        directory: 'configs',
        limit: 10
      })
    })

    it('should handle all file operations with basePath', async () => {
      // Mock all operations
      ;(mockClient.appendToFile as any).mockResolvedValue({ path: 'log.txt', version: 2 })
      ;(mockClient.overwriteFile as any).mockResolvedValue({ path: 'data.json', version: 3 })
      ;(mockClient.getFileMetadata as any).mockResolvedValue({ path: 'meta.txt', version: 1 })
      ;(mockClient.getFileVersions as any).mockResolvedValue({ versions: [], total: 0 })

      const operations = [
        {
          name: 'append_to_file',
          args: { path: 'log.txt', content: 'New entry' }
        },
        {
          name: 'overwrite_file',
          args: { path: 'data.json', content: '{}', isBase64: false }
        },
        {
          name: 'get_file_metadata',
          args: { path: 'meta.txt', version: 0 }
        },
        {
          name: 'get_file_versions',
          args: { path: 'versions.txt', limit: 10, offset: 0 }
        }
      ]

      for (const op of operations) {
        const response = {
          choices: [{
            message: {
              tool_calls: [{
                id: 'call-123',
                function: {
                  name: op.name,
                  arguments: JSON.stringify(op.args)
                }
              }]
            }
          }]
        }

        await tools.openai.processToolCalls(response)

        // Verify each operation was called with basePath
        const expectedArgs = { ...op.args }
        if (op.name === 'get_file_metadata' || op.name === 'read_file') {
          expectedArgs.version = undefined // version 0 becomes undefined
        }

        expect((mockClient as any)[op.name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()).replace('_', '')]).toHaveBeenCalledWith(expectedArgs)
      }
    })

    it('should verify basePath parameter does NOT exist in tool definitions', () => {
      const definitions = tools.openai.definitions

      // BasePath should not be exposed to AI - it's handled internally by the SDK
      definitions.forEach(def => {
        expect(def.function.parameters.properties).not.toHaveProperty('basePath')
      })
    })
  })
})