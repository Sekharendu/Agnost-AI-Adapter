# agnost-ai-adapter

Zero-friction observability wrapper for Vercel AI, OpenAI, and Mastra 
agents. Automatic telemetry on every AI call — timing, token usage, 
tool invocations, and errors — with one line of code change.

---

## How It Works

Your agent code stays exactly the same. The adapter wraps your existing 
SDK calls, captures what happened, and sends telemetry to Agnost in the 
background. The response returns to you untouched.

```
Your code → agnost-ai-adapter → Real SDK → LLM Provider
                    ↓
              Agnost Dashboard
         (latency · tokens · errors)
```

---

## Quickstart

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/agnost-ai-adapter.git
cd agnost-ai-adapter
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
AGNOST_ORG_ID=your-org-id-here
AGNOST_API_KEY=your-api-key-here
OPENAI_API_KEY=sk-your-openai-key-here
PORT=3000
```

Get your Agnost credentials at [agnost.ai](https://agnost.ai).

### 3. Start the demo server

```bash
npm run dev
```

```
🚀 Agnost AI Adapter Demo running at http://localhost:3000

POST /chat/vercel  — Vercel AI SDK  (telemetry auto-captured)
POST /chat/openai  — OpenAI SDK     (telemetry auto-captured)
POST /chat/mastra  — Mastra SDK     (telemetry auto-captured)
GET  /health       — Status check

All telemetry → https://api.agnost.ai
```

### 4. Send a request

```bash
curl -X POST http://localhost:3000/chat/vercel \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the fastest animal on earth?"}'
```

```json
{
  "reply": "The peregrine falcon...",
  "sdk": "vercel-ai",
  "tracked": true
}
```

Check your Agnost dashboard — the session telemetry appears immediately.

---

## Demo Server Routes

| Method | Route | SDK | Description |
|---|---|---|---|
| POST | `/chat/vercel` | Vercel AI SDK | `generateText` with telemetry |
| POST | `/chat/openai` | OpenAI SDK | `chat.completions.create` with telemetry |
| POST | `/chat/mastra` | Mastra | `agent.generate` with telemetry |
| GET | `/health` | — | Status and adapter list |

All routes accept `{ "message": "your message here" }`.

---

## Integrating Into Your Own Project

### Initialize once at startup

```typescript
import { createAgnostAdapter } from 'agnost-ai-adapter'

const agnost = createAgnostAdapter({
  orgId: process.env.AGNOST_ORG_ID,
  apiKey: process.env.AGNOST_API_KEY,
  userData: {
    userId: 'user-123',
    email: 'user@example.com',
    userPlan: 'pro',
    content: ''
  }
})
```

### Vercel AI SDK

```typescript
// Before
import { generateText } from 'ai'
const { text } = await generateText({ model, messages })

// After — one word change
const { text } = await agnost.vercel.generateText({ model, messages })
```

Both `generateText` and `streamText` are supported. The response is 
identical to the original SDK.

### OpenAI SDK

```typescript
import OpenAI from 'openai'

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const wrappedClient = agnost.wrapOpenAI(openaiClient)

// Use exactly like the original OpenAI client
const response = await wrappedClient.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello' }]
})
```

All other OpenAI SDK methods (`images.generate`, `models.list`, 
`audio.transcriptions.create`, etc.) pass through completely untouched. 
Only `chat.completions.create` is intercepted.

### Mastra

```typescript
// Assuming you have a Mastra agent set up
// const agent = mastra.getAgent('myAgent')

const wrappedAgent = agnost.wrapMastraAgent(agent)

const result = await wrappedAgent.generate('Help me write an email')
const stream = await wrappedAgent.stream('Tell me a story')
```

### Unsupported SDKs (Escape Hatch)

For frameworks not natively wrapped (Anthropic, Google Gemini, etc.), 
use the raw client to send telemetry manually:

```typescript
agnost.client.sendTelemetry({
  sessionId: 'session-123',
  userData: { userId: '...', email: '...', userPlan: '...', content: '...' },
  timestamp: Date.now(),
  clientConfig: 'anthropic-sdk',
  metadata: {
    duration: 1200,
    model: 'claude-opus-4-6',
    usage: { promptTokens: 50, completionTokens: 120 }
  }
})
```

---

## What Gets Captured

Every tracked call sends the following to Agnost:

| Field | Description |
|---|---|
| `session_id` | Unique identifier per conversation |
| `timestamp` | Unix timestamp of the call start |
| `client_config` | Which SDK was used |
| `metadata.duration` | End-to-end latency in milliseconds |
| `metadata.usage` | Token counts (prompt + completion) |
| `metadata.model` | Model name |
| `metadata.toolCallCount` | Number of tool invocations |
| `metadata.finishReason` | Why the model stopped |
| `metadata.error` | Error message if the call failed |
| `metadata.failed` | `true` if an exception was thrown |
| `user_data` | User context passed at initialization |

Telemetry is fire-and-forget — it never blocks the agent response or 
adds latency to the user-facing call.

---

## Switching Between Mock and Real Providers

The demo server runs real SDK calls by default. If you don't have API 
credits, mock routes are included as commented code in `src/demo/server.ts`.

To switch any route to mock:

```typescript
// Comment out the real route:
// app.post('/chat/vercel', async (req, res) => {
//   const result = await agnost.vercel.generateText({
//     model: openaiProvider('gpt-4o-mini'), ...
//   })
// })

// Uncomment the mock route directly below it
app.post('/chat/vercel', async (req, res) => {
  // mock implementation
})
```

The adapter code is identical in both cases. The interception, timing, 
and telemetry dispatch happen at the wrapper layer, not the provider layer.

---

## Running Tests

```bash
npm test
```

Three tests covering:
- Config validation (throws clearly if `orgId` is missing)
- Telemetry capture on successful calls
- Error telemetry and re-throw behavior on failed calls

All tests run without real API calls. External dependencies are mocked.

---

## Running the Usage Example

```bash
npm run example
```

Demonstrates Vercel AI SDK and OpenAI SDK integrations with a live agent 
conversation. Requires valid API keys in `.env`.

---

## Project Structure

```
agnost-ai-adapter/
├── src/
│   ├── adapter/
│   │   ├── index.ts      # Public API: createAgnostAdapter()
│   │   ├── client.ts     # HTTP client: sends telemetry to Agnost
│   │   ├── vercel.ts     # Vercel AI SDK wrapper
│   │   ├── openai.ts     # OpenAI SDK Proxy wrapper
│   │   └── mastra.ts     # Mastra agent wrapper
│   ├── types/
│   │   └── index.ts      # Shared TypeScript interfaces
│   └── demo/
│       └── server.ts     # Express demo server
├── tests/
│   └── adapter.test.ts   # Unit tests
├── examples/
│   └── basic-agent.ts    # Minimal usage example
├── public/               # Static assets (future use)
├── docs/                 # Extended documentation (future use)
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example          # Required environment variables
└── REASONING.md          # Architecture decisions and tradeoffs
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AGNOST_ORG_ID` | Yes | Your Agnost organization ID |
| `AGNOST_API_KEY` | Yes | Your Agnost API key |
| `OPENAI_API_KEY` | For real routes | OpenAI API key with credits |
| `PORT` | No | Server port (default: 3000) |

---

## Tech Stack

- TypeScript
- Vercel AI SDK (`ai`)
- OpenAI SDK (`openai`)
- Express.js (demo server)
- Vitest (tests)
- Node.js 18+
