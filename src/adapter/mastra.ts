import { randomUUID } from 'node:crypto';
import { AgnostClient } from './client';
import type { AgnostAdapterOptions } from '../types';

/**
 * Wraps a Mastra Agent instance to automatically capture observability
 * data on every generate() and stream() call.
 * Designed for @mastra/core >= 0.1.0. Uses structural typing.
 */
export function wrapMastraAgent(
  agent: any,
  client: AgnostClient,
  options: AgnostAdapterOptions,
): { generate: Function; stream: Function } {
  return {
    async generate(input: string, generateOptions?: Record<string, unknown>) {
      const startTime = Date.now();
      const sessionId = options.defaultSessionId ?? randomUUID();

      try {
        const result = await agent.generate(input, generateOptions);

        client.sendTelemetry({
          sessionId,
          userData: {
            ...options.userData,
            content: input,
          },
          timestamp: startTime,
          clientConfig: 'mastra-sdk',
          metadata: {
            duration: Date.now() - startTime,
            agentName:
              typeof agent.name === 'string' ? agent.name : 'unknown',
            inputLength: input.length,
            toolCallCount: Array.isArray(result?.toolCalls)
              ? result.toolCalls.length
              : 0,
            finishReason: result?.finishReason ?? 'unknown',
          },
        });

        return result;
      } catch (error) {
        client.sendTelemetry({
          sessionId,
          userData: options.userData,
          timestamp: startTime,
          clientConfig: 'mastra-sdk',
          metadata: {
            duration: Date.now() - startTime,
            agentName:
              typeof agent.name === 'string' ? agent.name : 'unknown',
            error:
              error instanceof Error ? error.message : 'Unknown error',
            failed: true,
          },
        });

        throw error;
      }
    },

    async stream(input: string, streamOptions?: Record<string, unknown>) {
      const startTime = Date.now();
      const sessionId = options.defaultSessionId ?? randomUUID();

      try {
        const result = await agent.stream(input, streamOptions);

        client.sendTelemetry({
          sessionId,
          userData: {
            ...options.userData,
            content: input,
          },
          timestamp: startTime,
          clientConfig: 'mastra-sdk',
          metadata: {
            duration: Date.now() - startTime,
            agentName:
              typeof agent.name === 'string' ? agent.name : 'unknown',
            streamed: true,
          },
        });

        return result;
      } catch (error) {
        client.sendTelemetry({
          sessionId,
          userData: options.userData,
          timestamp: startTime,
          clientConfig: 'mastra-sdk',
          metadata: {
            duration: Date.now() - startTime,
            agentName:
              typeof agent.name === 'string' ? agent.name : 'unknown',
            error:
              error instanceof Error ? error.message : 'Unknown error',
            failed: true,
            streamed: true,
          },
        });

        throw error;
      }
    },
  };
}
