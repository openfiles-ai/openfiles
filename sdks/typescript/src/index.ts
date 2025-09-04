/**
 * @openfiles-ai/sdk
 * 
 * OpenFiles SDK - AI-native file storage platform
 * 
 * @example
 * ```typescript
 * // Import what you need from single package
 * import { OpenFilesClient } from '@openfiles-ai/sdk/core'
 * import OpenAI from '@openfiles-ai/sdk/openai'  // Drop-in OpenAI replacement
 * import { OpenFilesTools } from '@openfiles-ai/sdk/tools'
 * ```
 */

// Re-export from submodules for convenience
export { OpenFilesClient } from './core'
export { default as OpenAI } from './openai'  // Drop-in OpenAI replacement
export { OpenFilesTools } from './tools'

// Export types
export type {
  // Core types
  OpenFilesConfig,
  WriteParams,
  ReadParams,
  EditParams,
  ListParams,
  FileMetadata,
  WriteFileRequest,
  EditFileRequest,
  FileContentResponse,
  FileListResponse,
  ErrorResponse
} from './core'

export type {
  // OpenAI types
  ClientOptions,
  ChatCompletionCreateParams,
  ChatCompletion,
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  FileOperation,
  ToolExecution
} from './openai'

export type {
  // Tools types
  ToolDefinition,
  ToolResult,
  ProcessedToolCalls
} from './tools'