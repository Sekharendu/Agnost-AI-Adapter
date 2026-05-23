import type { AgnostAdapterConfig, TelemetryPayload } from '../types';

/** Thin HTTP client for Agnost's observability API, providing fire-and-forget telemetry capture. */
export class AgnostClient {
  private orgId: string;

  constructor(config: AgnostAdapterConfig) {
    this.orgId = config.orgId;
  }

  sendTelemetry(payload: TelemetryPayload): void {
    const body = {
      session_id: payload.sessionId,
      user_data: {
        user_id: payload.userData.userId,
        email: payload.userData.email,
        user_plan: payload.userData.userPlan,
        content: payload.userData.content,
      },
      metadata: payload.metadata ?? {},
      timestamp: payload.timestamp,
      client_config: payload.clientConfig,
    };

    fetch('https://api.agnost.ai/api/v1/capture-session', {
      method: 'POST',
      headers: {
        'x-org-id': this.orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).catch(() => {});
  }
}
