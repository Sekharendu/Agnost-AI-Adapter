/** Configuration options for connecting to an Agnost cluster. */
export interface AgnostAdapterConfig {
  orgId: string;
  apiKey: string;
}

/** Data identifying the end user within a telemetry session. */
export interface TelemetryUserData {
  userId: string;
  email: string;
  userPlan: string;
  content: string;
}

/** Payload sent to Agnost for session telemetry capture. */
export interface TelemetryPayload {
  sessionId: string;
  userData: TelemetryUserData;
  metadata?: Record<string, unknown>;
  timestamp: number;
  clientConfig: string;
}

/** Generic wrapper returned by Agnost API calls, containing either data or errors. */
export interface AgnostResponse<T> {
  data: T | null;
  errors: { message: string }[] | null;
}
