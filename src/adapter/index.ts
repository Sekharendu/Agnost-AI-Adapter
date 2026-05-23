import 'dotenv/config';

import { AgnostClient } from './client';
import { createVercelAdapter } from './vercel';
import { wrapOpenAI } from './openai';
import { wrapMastraAgent } from './mastra';
import type { AgnostAdapterOptions } from '../types';
import OpenAI from 'openai';

/**
 * Creates an Agnost observability adapter that wraps Vercel AI SDK,
 * OpenAI SDK, and Mastra agents to automatically capture telemetry
 * on every AI call — with zero changes to your existing response handling.
 */
export function createAgnostAdapter(options: AgnostAdapterOptions) {
  if (!options.orgId) {
    throw new Error(
      'AgnostAdapter: orgId is required. ' +
        'Get it from your Agnost dashboard at https://agnost.ai',
    );
  }

  const agnostClient = new AgnostClient({
    orgId: options.orgId,
    apiKey: options.apiKey,
  });

  const vercelAdapter = createVercelAdapter(agnostClient, options);

  return {
    vercel: vercelAdapter,

    wrapOpenAI: (openaiClient: OpenAI) =>
      wrapOpenAI(openaiClient, agnostClient, options),

    wrapMastraAgent: (agent: any) =>
      wrapMastraAgent(agent, agnostClient, options),

    client: agnostClient,
  };
}

export type { AgnostAdapterOptions, TelemetryPayload, TelemetryUserData } from '../types';
