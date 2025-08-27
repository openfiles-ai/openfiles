/**
 * Tests for OpenFilesClient
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenFilesClient } from './client'
import { 
  writeFile as mockWriteFile,
  readFile as mockReadFile,
  editFile as mockEditFile,
  appendFile as mockAppendFile,
  overwriteFile as mockOverwriteFile,
  listFiles as mockListFiles
} from './generated'

// Mock the generated functions
vi.mock('./generated', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  editFile: vi.fn(),
  appendFile: vi.fn(),
  overwriteFile: vi.fn(),
  listFiles: vi.fn()
}))

vi.mock('./generated/client', () => ({
  createClient: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  })),
  createConfig: vi.fn(() => ({}))
}))

describe('OpenFilesClient', () => {
  let client: OpenFilesClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new OpenFilesClient({
      apiKey: 'oa_test123456789012345678901234567890'
    })
  })

  describe('constructor', () => {
    it('should create client with valid API key', () => {
      expect(client).toBeInstanceOf(OpenFilesClient)
    })

    it('should reject invalid API key format', () => {
      expect(() => {
        new OpenFilesClient({
          apiKey: 'invalid_key'
        })
      }).toThrow('Invalid API key format. API key must start with "oa_" and be at least 35 characters long')
    })

    it('should use default base URL', () => {
      const client = new OpenFilesClient({
        apiKey: 'oa_test123456789012345678901234567890'
      })
      expect((client as any).config.baseUrl).toBe('https://api.openfiles.ai/functions/v1/api')
    })

    it('should use custom base URL', () => {
      const client = new OpenFilesClient({
        apiKey: 'oa_test123456789012345678901234567890',
        baseUrl: 'http://localhost:3000'
      })
      expect((client as any).config.baseUrl).toBe('http://localhost:3000')
    })
  })

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'test.txt',
          version: 1,
          contentType: 'text/plain',
          sizeBytes: 11,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockWriteFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.writeFile({
        path: 'test.txt',
        content: 'Hello World',
        contentType: 'text/plain'
      })

      expect(mockWriteFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        body: {
          path: 'test.txt',
          content: 'Hello World',
          contentType: 'text/plain',
          isBase64: undefined
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle write failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid path'
      };
      (mockWriteFile as any).mockResolvedValue({
        data: mockResponse
      })

      await expect(client.writeFile({
        path: 'test.txt',
        content: 'Hello World'
      })).rejects.toThrow('Failed to write file')
    })
  })

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          path: 'test.txt',
          content: 'Hello World',
          version: 1,
          contentType: 'text/plain',
          sizeBytes: 11
        }
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.readFile({
        path: 'test.txt'
      })

      expect(mockReadFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        query: {
          version: undefined
        }
      })
      expect(result).toBe('Hello World')
    })

    it('should read specific version', async () => {
      const mockResponse = {
        success: true,
        data: {
          path: 'test.txt',
          content: 'Hello World v2',
          version: 2,
          contentType: 'text/plain',
          sizeBytes: 14
        }
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.readFile({
        path: 'test.txt',
        version: 2
      })

      expect(mockReadFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        query: {
          version: 2
        }
      })
      expect(result).toBe('Hello World v2')
    })
  })

  describe('editFile', () => {
    it('should edit file successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'test.txt',
          version: 2,
          contentType: 'text/plain',
          sizeBytes: 11,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockEditFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.editFile({
        path: 'test.txt',
        oldString: 'Hello',
        newString: 'Hi'
      })

      expect(mockEditFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        body: {
          oldString: 'Hello',
          newString: 'Hi'
        }
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('appendToFile', () => {
    it('should append to file successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'test.txt',
          version: 2,
          contentType: 'text/plain',
          sizeBytes: 25,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockAppendFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.appendToFile({
        path: 'test.txt',
        content: '\nAppended content'
      })

      expect(mockAppendFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        body: {
          content: '\nAppended content'
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle append failure', async () => {
      const mockResponse = {
        success: false,
        error: 'File not found'
      };
      (mockAppendFile as any).mockResolvedValue({
        data: mockResponse
      })

      await expect(client.appendToFile({
        path: 'nonexistent.txt',
        content: 'Some content'
      })).rejects.toThrow('Failed to append to file')
    })
  })

  describe('overwriteFile', () => {
    it('should overwrite file successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'test.txt',
          version: 2,
          contentType: 'text/plain',
          sizeBytes: 15,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockOverwriteFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.overwriteFile({
        path: 'test.txt',
        content: 'New content',
        isBase64: false
      })

      expect(mockOverwriteFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        body: {
          content: 'New content',
          isBase64: false
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should overwrite with base64 content', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'image.png',
          version: 1,
          contentType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockOverwriteFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.overwriteFile({
        path: 'image.png',
        content: 'base64encodedcontent==',
        isBase64: true
      })

      expect(mockOverwriteFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'image.png'
        },
        body: {
          content: 'base64encodedcontent==',
          isBase64: true
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle overwrite failure', async () => {
      const mockResponse = {
        success: false,
        error: 'File not found'
      };
      (mockOverwriteFile as any).mockResolvedValue({
        data: mockResponse
      })

      await expect(client.overwriteFile({
        path: 'nonexistent.txt',
        content: 'New content'
      })).rejects.toThrow('Failed to overwrite file')
    })
  })

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          files: [
            {
              id: 'file-123',
              path: 'test.txt',
              version: 1,
              contentType: 'text/plain',
              sizeBytes: 11,
              createdAt: '2025-01-01T00:00:00Z'
            }
          ],
          total: 1
        }
      };
      (mockListFiles as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.listFiles({
        directory: 'test/',
        limit: 10
      })

      expect(mockListFiles).toHaveBeenCalledWith({
        client: expect.any(Object),
        query: {
          directory: 'test',
          limit: 10,
          offset: 0
        }
      })
      expect(result).toEqual({
        files: mockResponse.data.files,
        total: 1
      })
    })
  })

  describe('getFileMetadata', () => {
    it('should get file metadata successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'test.txt',
          version: 1,
          contentType: 'text/plain',
          sizeBytes: 11,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.getFileMetadata({
        path: 'test.txt'
      })

      expect(mockReadFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        query: {
          metadata: '',
          version: undefined
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should get metadata for specific version', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          path: 'test.txt',
          version: 2,
          contentType: 'text/plain',
          sizeBytes: 14,
          createdAt: '2025-01-01T00:00:00Z'
        }
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.getFileMetadata({
        path: 'test.txt',
        version: 2
      })

      expect(mockReadFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        query: {
          metadata: '',
          version: 2
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get metadata failure', async () => {
      const mockResponse = {
        success: false,
        error: 'File not found'
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      await expect(client.getFileMetadata({
        path: 'nonexistent.txt'
      })).rejects.toThrow('Failed to get file metadata')
    })
  })

  describe('getFileVersions', () => {
    it('should get file versions successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          versions: [
            {
              id: 'version-1',
              versionNumber: 1,
              contentType: 'text/plain',
              sizeBytes: 11,
              createdAt: '2025-01-01T00:00:00Z'
            },
            {
              id: 'version-2',
              versionNumber: 2,
              contentType: 'text/plain',
              sizeBytes: 14,
              createdAt: '2025-01-01T01:00:00Z'
            }
          ],
          total: 2
        }
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.getFileVersions({
        path: 'test.txt'
      })

      expect(mockReadFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        query: {
          versions: '',
          limit: 10,
          offset: 0
        }
      })
      expect(result).toEqual({
        versions: mockResponse.data.versions,
        total: 2
      })
    })

    it('should get file versions with pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          versions: [
            {
              id: 'version-3',
              versionNumber: 3,
              contentType: 'text/plain',
              sizeBytes: 17,
              createdAt: '2025-01-01T02:00:00Z'
            }
          ],
          total: 5
        }
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      const result = await client.getFileVersions({
        path: 'test.txt',
        limit: 1,
        offset: 2
      })

      expect(mockReadFile).toHaveBeenCalledWith({
        client: expect.any(Object),
        path: {
          path: 'test.txt'
        },
        query: {
          versions: '',
          limit: 1,
          offset: 2
        }
      })
      expect(result).toEqual({
        versions: mockResponse.data.versions,
        total: 5
      })
    })

    it('should handle get versions failure', async () => {
      const mockResponse = {
        success: false,
        error: 'File not found'
      };
      (mockReadFile as any).mockResolvedValue({
        data: mockResponse
      })

      await expect(client.getFileVersions({
        path: 'nonexistent.txt'
      })).rejects.toThrow('Failed to get file versions')
    })
  })

  describe('basePath functionality', () => {
    describe('constructor basePath', () => {
      it('should create client with constructor basePath', () => {
        const clientWithBasePath = new OpenFilesClient({
          apiKey: 'oa_test123456789012345678901234567890',
          basePath: 'projects/website'
        })
        expect(clientWithBasePath).toBeInstanceOf(OpenFilesClient)
      })

      it('should apply constructor basePath to writeFile', async () => {
        const clientWithBasePath = new OpenFilesClient({
          apiKey: 'oa_test123456789012345678901234567890',
          basePath: 'projects/website'
        })

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'projects/website/config.json',
            version: 1,
            contentType: 'application/json',
            sizeBytes: 20,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await clientWithBasePath.writeFile({
          path: 'config.json',
          content: '{"theme": "dark"}'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'projects/website/config.json',
            content: '{"theme": "dark"}',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })
    })

    describe('withBasePath method', () => {
      it('should create scoped client with basePath', () => {
        const projectClient = client.withBasePath('projects/website')
        expect(projectClient).toBeInstanceOf(OpenFilesClient)
        expect(projectClient).not.toBe(client) // Should be new instance
      })

      it('should apply scoped basePath to all operations', async () => {
        const projectClient = client.withBasePath('projects/website')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'projects/website/settings.json',
            version: 1,
            contentType: 'application/json',
            sizeBytes: 25,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await projectClient.writeFile({
          path: 'settings.json',
          content: '{"language": "en"}'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'projects/website/settings.json',
            content: '{"language": "en"}',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should support chaining withBasePath', async () => {
        const configClient = client.withBasePath('projects').withBasePath('website').withBasePath('config')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'projects/website/config/database.json',
            version: 1,
            contentType: 'application/json',
            sizeBytes: 30,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await configClient.writeFile({
          path: 'database.json',
          content: '{"host": "localhost"}'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'projects/website/config/database.json',
            content: '{"host": "localhost"}',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should work with constructor basePath and withBasePath', async () => {
        const clientWithConstructorBasePath = new OpenFilesClient({
          apiKey: 'oa_test123456789012345678901234567890',
          basePath: 'base'
        })
        const scopedClient = clientWithConstructorBasePath.withBasePath('scoped')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'base/scoped/file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await scopedClient.writeFile({
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'base/scoped/file.txt',
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })
    })

    describe('per-operation basePath', () => {
      it('should apply per-operation basePath to writeFile', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'temp/uploads/data.json',
            version: 1,
            contentType: 'application/json',
            sizeBytes: 15,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.writeFile({
          basePath: 'temp/uploads',
          path: 'data.json',
          content: '{"test": true}'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'temp/uploads/data.json',
            content: '{"test": true}',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should apply per-operation basePath to readFile', async () => {
        const mockResponse = {
          success: true,
          data: {
            path: 'temp/uploads/data.json',
            content: '{"test": true}',
            version: 1,
            contentType: 'application/json',
            sizeBytes: 15
          }
        };
        (mockReadFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.readFile({
          basePath: 'temp/uploads',
          path: 'data.json'
        })

        expect(mockReadFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          path: {
            path: 'temp/uploads/data.json'
          },
          query: {
            version: undefined
          }
        })
      })

      it('should apply per-operation basePath to editFile', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'temp/uploads/data.json',
            version: 2,
            contentType: 'application/json',
            sizeBytes: 16,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockEditFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.editFile({
          basePath: 'temp/uploads',
          path: 'data.json',
          oldString: 'true',
          newString: 'false'
        })

        expect(mockEditFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          path: {
            path: 'temp/uploads/data.json'
          },
          body: {
            oldString: 'true',
            newString: 'false'
          }
        })
      })

      it('should apply per-operation basePath to appendToFile', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'temp/uploads/log.txt',
            version: 2,
            contentType: 'text/plain',
            sizeBytes: 25,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockAppendFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.appendToFile({
          basePath: 'temp/uploads',
          path: 'log.txt',
          content: '\nNew log entry'
        })

        expect(mockAppendFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          path: {
            path: 'temp/uploads/log.txt'
          },
          body: {
            content: '\nNew log entry'
          }
        })
      })

      it('should apply per-operation basePath to overwriteFile', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'temp/uploads/data.json',
            version: 2,
            contentType: 'application/json',
            sizeBytes: 20,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockOverwriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.overwriteFile({
          basePath: 'temp/uploads',
          path: 'data.json',
          content: '{"overwritten": true}'
        })

        expect(mockOverwriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          path: {
            path: 'temp/uploads/data.json'
          },
          body: {
            content: '{"overwritten": true}',
            isBase64: undefined
          }
        })
      })

      it('should apply per-operation basePath to listFiles', async () => {
        const mockResponse = {
          success: true,
          data: {
            files: [],
            total: 0
          }
        };
        (mockListFiles as any).mockResolvedValue({
          data: mockResponse
        })

        await client.listFiles({
          basePath: 'temp/uploads',
          directory: 'subfolder',
          limit: 5
        })

        expect(mockListFiles).toHaveBeenCalledWith({
          client: expect.any(Object),
          query: {
            directory: 'temp/uploads/subfolder',
            limit: 5,
            offset: 0
          }
        })
      })

      it('should apply per-operation basePath to getFileMetadata', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'temp/uploads/data.json',
            version: 1,
            contentType: 'application/json',
            sizeBytes: 15,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockReadFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.getFileMetadata({
          basePath: 'temp/uploads',
          path: 'data.json'
        })

        expect(mockReadFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          path: {
            path: 'temp/uploads/data.json'
          },
          query: {
            metadata: '',
            version: undefined
          }
        })
      })

      it('should apply per-operation basePath to getFileVersions', async () => {
        const mockResponse = {
          success: true,
          data: {
            versions: [],
            total: 0
          }
        };
        (mockReadFile as any).mockResolvedValue({
          data: mockResponse
        })

        await client.getFileVersions({
          basePath: 'temp/uploads',
          path: 'data.json',
          limit: 5
        })

        expect(mockReadFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          path: {
            path: 'temp/uploads/data.json'
          },
          query: {
            versions: '',
            limit: 5,
            offset: 0
          }
        })
      })
    })

    describe('basePath priority', () => {
      it('should prioritize per-operation basePath over scoped basePath', async () => {
        const scopedClient = client.withBasePath('scoped')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'operation/file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await scopedClient.writeFile({
          basePath: 'operation', // This should override 'scoped'
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'operation/file.txt', // Should be 'operation/file.txt', not 'scoped/file.txt'
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should prioritize per-operation basePath over constructor basePath', async () => {
        const clientWithConstructorBasePath = new OpenFilesClient({
          apiKey: 'oa_test123456789012345678901234567890',
          basePath: 'constructor'
        })

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'operation/file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await clientWithConstructorBasePath.writeFile({
          basePath: 'operation', // This should override 'constructor'
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'operation/file.txt', // Should be 'operation/file.txt', not 'constructor/file.txt'
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should use all basePath levels with correct priority', async () => {
        const clientWithAll = new OpenFilesClient({
          apiKey: 'oa_test123456789012345678901234567890',
          basePath: 'constructor'
        })
        const scopedClient = clientWithAll.withBasePath('scoped')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'operation/file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        // per-operation should win over scoped and constructor
        await scopedClient.writeFile({
          basePath: 'operation',
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'operation/file.txt', // Should be per-operation path
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })
    })

    describe('edge cases', () => {
      it('should handle empty basePath strings', async () => {
        const clientWithEmptyBasePath = client.withBasePath('')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await clientWithEmptyBasePath.writeFile({
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'file.txt', // Should be unchanged
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should handle basePath with trailing slashes', async () => {
        const clientWithTrailingSlash = client.withBasePath('projects/')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'projects/file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await clientWithTrailingSlash.writeFile({
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'projects/file.txt', // Trailing slash should be normalized
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })

      it('should handle basePath with leading slashes', async () => {
        const clientWithLeadingSlash = client.withBasePath('/projects')

        const mockResponse = {
          success: true,
          data: {
            id: 'file-123',
            path: 'projects/file.txt',
            version: 1,
            contentType: 'text/plain',
            sizeBytes: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        };
        (mockWriteFile as any).mockResolvedValue({
          data: mockResponse
        })

        await clientWithLeadingSlash.writeFile({
          path: 'file.txt',
          content: 'test'
        })

        expect(mockWriteFile).toHaveBeenCalledWith({
          client: expect.any(Object),
          body: {
            path: 'projects/file.txt', // Leading slash should be removed (S3-style)
            content: 'test',
            contentType: undefined,
            isBase64: undefined
          }
        })
      })
    })
  })
})