/**
 * agnost-ai-adapter — Usage Examples
 *
 * Demonstrates automatic telemetry capture for:
 *   - Vercel AI SDK  (live example — runs automatically)
 *   - OpenAI SDK     (live example — runs automatically)
 *   - Mastra SDK     (commented example — requires @mastra/core setup)
 *
 * Run with: npm run example
 */

import 'dotenv/config';
import { createAgnostAdapter } from '../src/adapter';
import { openai } from '@ai-sdk/openai';
import OpenAI from 'openai';

async function main() {
  const agnost = createAgnostAdapter({
    orgId: process.env.AGNOST_ORG_ID ?? '',
    apiKey: process.env.AGNOST_API_KEY ?? '',
    userData: {
      userId: 'example-user-001',
      email: 'user@example.com',
      userPlan: 'pro',
      content: '',
    },
  });

  // ─── Vercel AI SDK ─────────────────────────────────────────────
  console.log('\n── Vercel AI SDK ──');
  const { text: vercelReply } = await agnost.vercel.generateText({
    model: openai('gpt-4o-mini'),
    messages: [{ role: 'user', content: 'What is 2 + 2?' }],
  });
  console.log('Reply:', vercelReply);

  // ─── OpenAI SDK ────────────────────────────────────────────────
  console.log('\n── OpenAI SDK ──');
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const wrappedOpenAI = agnost.wrapOpenAI(openaiClient);
  const response = await wrappedOpenAI.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'What is the capital of Japan?' }],
  });
  const openaiReply = response.choices[0]?.message?.content ?? 'No response';
  console.log('Reply:', openaiReply);

  // ─── Mastra SDK ────────────────────────────────────────────────
  // NOTE: This section requires @mastra/core to be installed and
  // configured. It is NOT included as a dependency of this package
  // because Mastra is an optional peer dependency — install it only
  // if you are already using it in your project.
  //
  // Installation: npm install @mastra/core
  //
  // Once set up, usage looks like this:
  //
  // import { Mastra } from '@mastra/core'
  //
  // const mastra = new Mastra({ agents: { assistant: yourAgent } })
  // const agent = mastra.getAgent('assistant')
  //
  // const wrappedAgent = agnost.wrapMastraAgent(agent)
  // const result = await wrappedAgent.generate('What is the weather today?')
  // console.log('Mastra reply:', result.text)
  //
  // For a working Mastra demo without real setup, run:
  //   POST http://localhost:3000/chat/mastra
  // after starting the demo server with: npm run dev
}

main().catch(console.error);
