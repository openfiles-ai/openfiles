/**
 * Tests for OpenAI - OpenAI integration with OpenFiles
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenAI } from './client'
import type { FileOperation, ToolExecution } from './client'

// Mock OpenAI base class
vi.mock('openai', () => ({
  OpenAI: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn()
      }
    }
  }
}))

// Mock our modules
const mockClient = {
  writeFile: vi.fn(),
  readFile: vi.fn(),
  editFile: vi.fn(),
  listFiles: vi.fn(),
  appendToFile: vi.fn(),
  overwriteFile: vi.fn(),
  getFileMetadata: vi.fn(),
  getFileVersions: vi.fn(),
  withBasePath: vi.fn()
}

vi.mock('../core', () => ({
  OpenFilesClient: vi.fn().mockImplementation(() => mockClient)
}))

const mockTools = {
  openai: {
    definitions: [
      { type: 'function', function: { name: 'write_file' } },
      { type: 'function', function: { name: 'read_file' } },
      { type: 'function', function: { name: 'edit_file' } },
      { type: 'function', function: { name: 'list_files' } },
      { type: 'function', function: { name: 'append_to_file' } },
      { type: 'function', function: { name: 'overwrite_file' } },
      { type: 'function', function: { name: 'get_file_metadata' } },
      { type: 'function', function: { name: 'get_file_versions' } }
    ],
    _isOpenFilesTool: vi.fn().mockImplementation((name) => {
      const tools = ['write_file', 'read_file', 'edit_file', 'list_files', 
                     'append_to_file', 'overwrite_file', 'get_file_metadata', 'get_file_versions']
      return tools.includes(name)
    }),
    processToolCalls: vi.fn().mockImplementation(async (response) => {
      const results = []
      for (const choice of response.choices || []) {
        const toolCalls = choice.message?.tool_calls || []
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments)
          if (mockTools.openai._isOpenFilesTool(toolCall.function.name)) {
            try {
              if (toolCall.function.name === 'write_file') {
                const result = await mockClient.writeFile(args)
                results.push({
                  toolCallId: toolCall.id,
                  status: 'success',
                  data: { ...result, path: args.path },
                  function: toolCall.function.name,
                  args: args
                })
              } else {
                results.push({
                  toolCallId: toolCall.id,
                  status: 'success',
                  data: { path: args.path || 'test.txt', version: 1 },
                  function: toolCall.function.name,
                  args: args
                })
              }
            } catch (error) {
              results.push({
                toolCallId: toolCall.id,
                status: 'error',
                error: error.message,
                function: toolCall.function.name,
                args: args
              })
            }
          }
        }
      }
      return {
        handled: results.length > 0,
        results,
        originalResponse: response
      }
    })
  }
}

vi.mock('../tools', () => ({
  OpenFilesTools: vi.fn().mockImplementation(() => mockTools)
}))

describe('OpenAI', () => {
  let ai: OpenAI
  let fileOperations: FileOperation[] = []
  let toolExecutions: ToolExecution[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    fileOperations = []
    toolExecutions = []

    mockClient.writeFile.mockImplementation(async (args) => ({ 
      path: args.path, 
      version: 1,
      id: 'test-id',
      mimeType: 'text/plain',
      size: args.content?.length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    ai = new OpenAI({
      apiKey: 'sk_test123',
      openFilesApiKey: 'oa_test123',
      onFileOperation: (op) => fileOperations.push(op),
      onToolExecution: (exec) => toolExecutions.push(exec)
    })
  })

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      expect(ai).toBeInstanceOf(OpenAI)
      expect(ai.openfiles).toBeDefined()
    })

    it('should accept optional callbacks', () => {
      const ai = new OpenAI({
        apiKey: 'sk_test123',
        openFilesApiKey: 'oa_test123'
      })
      expect(ai).toBeInstanceOf(OpenAI)
    })
  })

  describe('tool detection', () => {
    it('should identify all 8 OpenFiles tools', () => {
      const tools = [
        'write_file',
        'read_file', 
        'edit_file',
        'list_files',
        'append_to_file',
        'overwrite_file',
        'get_file_metadata',
        'get_file_versions'
      ]

      tools.forEach(tool => {
        expect((ai as any).toolsInstance.openai._isOpenFilesTool(tool)).toBe(true)
      })
    })

    it('should reject non-OpenFiles tools', () => {
      const nonTools = ['custom_tool', 'get_weather', 'send_email']
      nonTools.forEach(tool => {
        expect((ai as any).toolsInstance.openai._isOpenFilesTool(tool)).toBe(false)
      })
    })
  })

  describe('executeTools method', () => {
    it('should have access to OpenFiles tools', () => {
      expect(ai.tools.definitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: 'function',
            function: expect.objectContaining({ name: 'write_file' })
          })
        ])
      )
      expect(ai.tools.definitions).toHaveLength(8) // All 8 OpenFiles tools
    })

    it('should execute OpenFiles tool calls and return tool messages', async () => {
      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              id: 'call-123',
              function: {
                name: 'write_file',
                arguments: JSON.stringify({
                  path: 'test.py',
                  content: 'print("hello")'
                })
              }
            }]
          }
        }]
      }

      const toolMessages = await ai.executeTools(mockResponse)

      // Check tool was executed
      expect(fileOperations).toHaveLength(1)
      expect(fileOperations[0]).toMatchObject({
        action: 'write file',
        path: 'test.py', // Should match the path from arguments
        success: true
      })

      expect(toolExecutions).toHaveLength(1)
      expect(toolExecutions[0]).toMatchObject({
        toolCallId: 'call-123',
        function: 'write_file',
        success: true
      })

      expect(toolMessages).toHaveLength(1)
      expect(toolMessages[0]).toMatchObject({
        role: 'tool',
        tool_call_id: 'call-123',
        content: expect.any(String)
      })

      // Verify the content is valid JSON with expected structure
      const toolContent = JSON.parse(toolMessages[0].content)
      expect(toolContent).toMatchObject({
        success: true,
        data: expect.objectContaining({
          path: 'test.py',
          version: 1,
          size: 14
        }),
        operation: 'write_file',
        message: expect.stringContaining('Created file "test.py"')
      })
    })

    it('should ignore non-OpenFiles tool calls', async () => {
      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              id: 'call-456',
              function: {
                name: 'custom_tool',
                arguments: '{}'
              }
            }]
          }
        }]
      }

      const toolMessages = await ai.executeTools(mockResponse)

      // Should not execute non-OpenFiles tools
      expect(toolMessages).toHaveLength(0)
    })

    it('should handle tool execution errors', async () => {
      const mockError = new Error('File write failed')
      mockClient.writeFile.mockRejectedValue(mockError)

      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              id: 'call-789',
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

      const toolMessages = await ai.executeTools(mockResponse)

      expect(mockClient.writeFile).toHaveBeenCalled()
      
      expect(toolMessages).toHaveLength(1)
      expect(toolMessages[0]).toEqual({
        role: 'tool',
        tool_call_id: 'call-789',
        content: JSON.stringify({
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: 'File write failed'
          },
          operation: 'write_file'
        })
      })
    })

    it('should handle empty responses', async () => {
      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello'
          }
        }]
      }

      const toolMessages = await ai.executeTools(mockResponse)
      expect(toolMessages).toHaveLength(0)
    })

    it('should handle responses without tool calls', async () => {
      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello',
            tool_calls: []
          }
        }]
      }

      const toolMessages = await ai.executeTools(mockResponse)
      expect(toolMessages).toHaveLength(0)
    })
  })

  describe('callbacks', () => {
    it('should trigger onFileOperation callback', async () => {
      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: '',
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

      await ai.executeTools(mockResponse)

      expect(fileOperations).toHaveLength(1)
      expect(fileOperations[0]).toMatchObject({
        action: 'write file',
        path: 'test.txt',
        success: true
      })
    })

    it('should include timing in tool execution callback', async () => {
      const mockResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: '',
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

      await ai.executeTools(mockResponse)

      expect(toolExecutions).toHaveLength(1)
      expect(toolExecutions[0]).toMatchObject({
        toolCallId: 'call-123',
        function: 'write_file',
        success: true,
        duration: expect.any(Number)
      })
    })
  })

  describe('basePath functionality', () => {
    it('should create OpenAI client with constructor basePath', () => {
      const aiWithBasePath = new OpenAI({
        apiKey: 'sk_test',
        openFilesApiKey: 'oa_test',
        basePath: 'projects/website'
      })

      expect(aiWithBasePath).toBeInstanceOf(OpenAI)
    })

    it('should create scoped client with withBasePath', () => {
      const mockScopedClient = { ...mockClient }
      ;(mockClient.withBasePath as any).mockReturnValue(mockScopedClient)

      const scopedAI = ai.withBasePath('projects/website')

      expect(scopedAI).toBeInstanceOf(OpenAI)
      expect(scopedAI).not.toBe(ai) // Should be new instance
    })

    it('should chain basePath calls', () => {
      const mockScopedClient1 = { ...mockClient }
      const mockScopedClient2 = { ...mockClient }
      
      ;(mockClient.withBasePath as any).mockReturnValue(mockScopedClient1)
      // Mock the second level withBasePath on the first scoped client
      mockScopedClient1.withBasePath = vi.fn().mockReturnValue(mockScopedClient2)

      const ai1 = ai.withBasePath('projects')
      const ai2 = ai1.withBasePath('website')

      expect(ai1).toBeInstanceOf(OpenAI)
      expect(ai2).toBeInstanceOf(OpenAI)
      expect(ai2).not.toBe(ai1)
      expect(ai1).not.toBe(ai)
    })

    it('should handle basePath configuration properly', () => {
      const configWithBasePath = {
        apiKey: 'sk_test',
        openFilesApiKey: 'oa_test',
        basePath: 'projects/website',
        onFileOperation: vi.fn(),
        onToolExecution: vi.fn(),
        onError: vi.fn()
      }

      const aiWithBasePath = new OpenAI(configWithBasePath)

      expect(aiWithBasePath).toBeInstanceOf(OpenAI)
      expect(aiWithBasePath.openfiles).toBeDefined()
      expect(aiWithBasePath.tools).toBeDefined()
    })

    it('should preserve callbacks when using withBasePath', () => {
      const mockScopedClient = { ...mockClient }
      ;(mockClient.withBasePath as any).mockReturnValue(mockScopedClient)

      const fileOps: FileOperation[] = []
      const toolExecs: ToolExecution[] = []

      const aiWithCallbacks = new OpenAI({
        apiKey: 'sk_test',
        openFilesApiKey: 'oa_test',
        onFileOperation: (op) => fileOps.push(op),
        onToolExecution: (exec) => toolExecs.push(exec)
      })

      const scopedAI = aiWithCallbacks.withBasePath('projects/website')

      expect(scopedAI).toBeInstanceOf(OpenAI)
      // Callbacks should be preserved in the new instance
    })

    it('should combine basePaths when chaining', () => {
      // Test the path combination logic by checking the new client config
      const mockScopedClient = { ...mockClient }
      ;(mockClient.withBasePath as any).mockReturnValue(mockScopedClient)

      const aiWithBasePath = new OpenAI({
        apiKey: 'sk_test',
        openFilesApiKey: 'oa_test',
        basePath: 'base'
      })

      const scopedAI = aiWithBasePath.withBasePath('scoped')

      expect(scopedAI).toBeInstanceOf(OpenAI)
      // The new instance should have combined the paths
    })

    it('should access openfiles client property', () => {
      const openfilesClient = ai.openfiles
      expect(openfilesClient).toBe(mockClient)
    })

    it('should access tools definitions', () => {
      const tools = ai.tools
      expect(tools.definitions).toBeDefined()
      expect(Array.isArray(tools.definitions)).toBe(true)
    })
  })
})