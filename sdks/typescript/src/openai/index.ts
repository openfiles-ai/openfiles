/**
 * @openfiles/sdk/openai
 * 
 * Drop-in replacement for OpenAI client with automatic file operations
 */

// Export as OpenAI for drop-in replacement
export { default as OpenAI } from './client'
export { default } from './client'

// Export all types
export type {
  ClientOptions,
  ChatCompletionCreateParams,
  ChatCompletion,
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  FileOperation,
  ToolExecution
} from './client'