import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import { AgnostClient } from './client';
import type { AgnostAdapterOptions } from '../types';

/**
 * Wraps an OpenAI client instance using a transparent JavaScript Proxy.
 * Intercepts chat.completions.create() to capture observability telemetry,
 * while all other SDK methods (images, models, audio, embeddings, etc.)
 * pass through to the original client completely untouched.
 */
export function wrapOpenAI(
  openaiClient: OpenAI,
  client: AgnostClient,
  options: AgnostAdapterOptions,
): OpenAI {
  return new Proxy(openaiClient, {
    get(target, prop, receiver) {
      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp, chatReceiver) {
            if (chatProp === 'completions') {
              return new Proxy(chatTarget.completions, {
                get(completionsTarget, completionsProp, completionsReceiver) {
                  if (completionsProp === 'create') {
                    return async (
                      params: Parameters<typeof completionsTarget.create>[0],
                    ) => {
                      const startTime = Date.now();
                      const sessionId =
                        options.defaultSessionId ??
                        randomUUID();

                      try {
                        const response = await completionsTarget.create.call(
                          completionsTarget,
                          params,
                        );

                        if (params.stream) {
                          client.sendTelemetry({
                            sessionId,
                            userData: {
                              ...options.userData,
                              content: JSON.stringify(params.messages),
                            },
                            timestamp: startTime,
                            clientConfig: 'openai-sdk',
                            metadata: {
                              duration: Date.now() - startTime,
                              model: params.model,
                              streamed: true,
                            },
                          });
                        } else {
                          const completion =
                            response as OpenAI.Chat.Completions.ChatCompletion;

                          client.sendTelemetry({
                            sessionId,
                            userData: {
                              ...options.userData,
                              content: JSON.stringify(params.messages),
                            },
                            timestamp: startTime,
                            clientConfig: 'openai-sdk',
                            metadata: {
                              duration: Date.now() - startTime,
                              model: params.model,
                              usage: completion.usage ?? null,
                              finishReason:
                                completion.choices[0]?.finish_reason ??
                                'unknown',
                              toolCallCount:
                                completion.choices[0]?.message?.tool_calls
                                  ?.length ?? 0,
                            },
                          });
                        }

                        return response;
                      } catch (error) {
                        client.sendTelemetry({
                          sessionId,
                          userData: options.userData,
                          timestamp: startTime,
                          clientConfig: 'openai-sdk',
                          metadata: {
                            duration: Date.now() - startTime,
                            error:
                              error instanceof Error
                                ? error.message
                                : 'Unknown error',
                            failed: true,
                          },
                        });

                        throw error;
                      }
                    };
                  }

                  return Reflect.get(
                    completionsTarget,
                    completionsProp,
                    completionsReceiver,
                  );
                },
              });
            }

            return Reflect.get(chatTarget, chatProp, chatReceiver);
          },
        });
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}
