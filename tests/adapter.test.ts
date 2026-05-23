import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

import { generateText } from 'ai';
import { createAgnostAdapter } from '../src/adapter/index';
import { createVercelAdapter } from '../src/adapter/vercel';
import { AgnostClient } from '../src/adapter/client';

const mockGenerateText = vi.mocked(generateText);

const testOptions = {
  orgId: 'test-org-123',
  apiKey: 'test-api-key',
  userData: {
    userId: 'user-001',
    email: 'test@example.com',
    userPlan: 'free',
    content: '',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAgnostAdapter', () => {
  it('throws a clear error if orgId is missing', () => {
    expect(() =>
      createAgnostAdapter({
        orgId: '',
        apiKey: 'any-key',
        userData: testOptions.userData,
      }),
    ).toThrow('orgId is required');
  });
});

describe('VercelAdapter.generateText', () => {
  it('sends telemetry with correct data on a successful call', async () => {
    const mockSendTelemetry = vi.fn();
    const mockClient = {
      sendTelemetry: mockSendTelemetry,
    } as unknown as AgnostClient;

    mockGenerateText.mockResolvedValueOnce({
      text: 'Hello!',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      toolCalls: [],
      finishReason: 'stop',
    });

    const vercelAdapter = createVercelAdapter(mockClient, testOptions);

    await vercelAdapter.generateText({
      model: 'mock-model' as any,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(mockSendTelemetry).toHaveBeenCalledTimes(1);

    const calledWith = mockSendTelemetry.mock.calls[0][0];

    expect(calledWith.clientConfig).toBe('vercel-ai-sdk');

    expect(typeof calledWith.metadata.duration).toBe('number');

    expect(calledWith.metadata.usage).toBeDefined();

    expect(calledWith.metadata.failed).toBeUndefined();
  });
});

describe('VercelAdapter.generateText error handling', () => {
  it('sends error telemetry and re-throws when generateText fails', async () => {
    const mockSendTelemetry = vi.fn();
    const mockClient = {
      sendTelemetry: mockSendTelemetry,
    } as unknown as AgnostClient;

    mockGenerateText.mockRejectedValueOnce(
      new Error('API rate limit exceeded'),
    );

    const vercelAdapter = createVercelAdapter(mockClient, testOptions);

    let caughtError: Error | null = null;
    try {
      await vercelAdapter.generateText({
        model: 'mock-model' as any,
        messages: [{ role: 'user', content: 'Hello' }],
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(mockSendTelemetry).toHaveBeenCalledTimes(1);

    const calledWith = mockSendTelemetry.mock.calls[0][0];

    expect(calledWith.metadata.failed).toBe(true);

    expect(calledWith.metadata.error).toBe('API rate limit exceeded');

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toBe('API rate limit exceeded');
  });
});
