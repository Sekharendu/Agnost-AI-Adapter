/** Configuration options for connecting to an Agnost cluster. */
export interface AgnostAdapterConfig {
  apiUrl: string;
  apiKey: string;
  dbName: string;
}

/** A single conversation message stored in Agnost-backed memory. */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sessionId: string;
}

/** Parameters required to persist a user message and its assistant reply. */
export interface SaveMemoryParams {
  sessionId: string;
  userMessage: string;
  assistantReply: string;
}

/** Parameters for retrieving conversation history from a session. */
export interface GetHistoryParams {
  sessionId: string;
  limit?: number;
}

/** Generic wrapper returned by Agnost API calls, containing either data or errors. */
export interface AgnostResponse<T> {
  data: T | null;
  errors: { message: string }[] | null;
}
