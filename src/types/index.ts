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

/** Data identifying the end user within a telemetry session, with content being optional. */
export interface WrapperUserData {
  userId: string;
  email: string;
  userPlan: string;
  content?: string;
}

/** Options for configuring the Agnost adapter wrapper. */
export interface AgnostAdapterOptions {
  orgId: string;
  apiKey: string;
  userData: TelemetryUserData;
  defaultSessionId?: string;
}
