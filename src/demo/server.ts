import 'dotenv/config';
import express from 'express';
import { openai as openaiProvider } from '@ai-sdk/openai';
import OpenAI from 'openai';
import { createAgnostAdapter } from '../adapter';

const app = express();
const PORT = process.env.PORT ?? 3000;
app.use(express.json());

const agnost = createAgnostAdapter({
  orgId: process.env.AGNOST_ORG_ID ?? '',
  apiKey: process.env.AGNOST_API_KEY ?? '',
  userData: {
    userId: 'demo-user',
    email: 'demo@example.com',
    userPlan: 'free',
    content: '',
  },
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const wrappedOpenAI = agnost.wrapOpenAI(openaiClient);

const mockMastraAgent = {
  name: 'demo-assistant',
  generate: async (input: string) => ({
    text: `[Mastra Agent] You said: "${input}". This is a mock response — real agents connect to any LLM.`,
    toolCalls: [],
    finishReason: 'stop',
  }),
  stream: async (input: string) => ({
    text: `[Mastra Stream] Streaming response for: "${input}"`,
    toolCalls: [],
    finishReason: 'stop',
  }),
};
const wrappedMastra = agnost.wrapMastraAgent(mockMastraAgent);

app.post('/chat/vercel', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const result = await agnost.vercel.generateText({
      model: openaiProvider('gpt-4o-mini'),
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: message }],
    });

    res.json({ reply: result.text, sdk: 'vercel-ai', tracked: true });
  } catch (error) {
    console.error('Vercel route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/chat/openai', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const response = await wrappedOpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? 'No response';

    res.json({ reply, sdk: 'openai-sdk', tracked: true });
  } catch (error) {
    console.error('OpenAI route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/chat/mastra', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const result = await wrappedMastra.generate(message);

    const reply = result.text ?? 'No response';

    res.json({ reply, sdk: 'mastra', tracked: true });
  } catch (error) {
    console.error('Mastra route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    adapters: ['vercel-ai', 'openai-sdk', 'mastra'],
    telemetry: 'https://api.agnost.ai',
  });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Agnost AI Adapter Demo running at http://localhost:${PORT}

  POST /chat/vercel  — Vercel AI SDK  (telemetry auto-captured)
  POST /chat/openai  — OpenAI SDK     (telemetry auto-captured)
  POST /chat/mastra  — Mastra SDK     (telemetry auto-captured)
  GET  /health       — Status check

  All telemetry → https://api.agnost.ai
`);
});
