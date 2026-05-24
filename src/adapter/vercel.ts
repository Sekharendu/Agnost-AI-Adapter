import { randomUUID } from 'node:crypto';
import { generateText, streamText } from 'ai';
import type { AgnostClient } from './client';
import type { AgnostAdapterOptions } from '../types';

export function createVercelAdapter(client: AgnostClient, options: AgnostAdapterOptions) {
  return {
    async generateText(params: Parameters<typeof generateText>[0]) {
      const sessionId = options.defaultSessionId ?? randomUUID();
      const startTime = Date.now();

      try {
        const result = await generateText(params);

        client.sendTelemetry({
          sessionId,
          userData: {
            ...options.userData,
            content: JSON.stringify(params.messages),
          },
          timestamp: startTime,
          clientConfig: 'vercel-ai-sdk',
          metadata: {
            duration: Date.now() - startTime,
            model: String(params.model),
            usage: result.usage,
            toolCallCount: result.toolCalls?.length ?? 0,
            finishReason: result.finishReason,
          },
        });

        return result;
      } catch (error) {
        client.sendTelemetry({
          sessionId,
          userData: {
            ...options.userData,
            content: JSON.stringify(params.messages),
          },
          timestamp: startTime,
          clientConfig: 'vercel-ai-sdk',
          metadata: {
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            failed: true,
          },
        });

        throw error;
      }
    },

    streamText(params: Parameters<typeof streamText>[0]) {
      const sessionId = options.defaultSessionId ?? randomUUID();
      const startTime = Date.now();

      try {
        const result = streamText(params);

        result.usage.then((usage) => {
          client.sendTelemetry({
            sessionId,
            userData: {
              ...options.userData,
              content: JSON.stringify(params.messages),
            },
            timestamp: startTime,
            clientConfig: 'vercel-ai-sdk',
            metadata: {
              duration: Date.now() - startTime,
              model: String(params.model),
              usage,
              toolCallCount: 0,
              finishReason: 'stream',
            },
          });
        }).catch(() => {});

        return result;
      } catch (error) {
        client.sendTelemetry({
          sessionId,
          userData: {
            ...options.userData,
            content: JSON.stringify(params.messages),
          },
          timestamp: startTime,
          clientConfig: 'vercel-ai-sdk',
          metadata: {
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            failed: true,
          },
        });

        throw error;
      }
    },
  };
}
