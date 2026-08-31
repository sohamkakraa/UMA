/**
 * Mobile AI calls are proxied through UMA's authenticated server.
 * Provider keys must never be bundled into a React Native application.
 */
import * as SecureStore from "expo-secure-store";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "https://uma.sohamkakra.com/api").replace(/\/$/, "");

export interface CloudAIConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CloudAIRequest {
  systemPrompt: string;
  userMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  config?: CloudAIConfig;
}

async function authenticatedChat(request: CloudAIRequest): Promise<string> {
  const token = await SecureStore.getItemAsync("auth_token");
  if (!token) throw new Error("Sign in to use UMA chat.");

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-UMA-Client": "mobile",
    },
    body: JSON.stringify({
      question: request.userMessage,
      messages: request.conversationHistory ?? [],
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(error?.error ?? "UMA chat is unavailable.");
  }

  const streamText = await response.text();
  for (const line of streamText.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const event = JSON.parse(line.slice(6)) as {
        type?: string;
        answer?: string;
        message?: string;
      };
      if (event.type === "done" && event.answer) return event.answer;
      if (event.type === "error") throw new Error(event.message ?? "UMA chat failed.");
    } catch (cause) {
      if (cause instanceof Error) throw cause;
    }
  }
  throw new Error("UMA chat returned an incomplete response.");
}

export async function callCloudAI(request: CloudAIRequest): Promise<string> {
  return authenticatedChat(request);
}

export async function* callCloudAIStreaming(
  request: CloudAIRequest,
): AsyncGenerator<string> {
  yield await authenticatedChat(request);
}

export async function callCloudAIWithTools(
  request: CloudAIRequest,
  _tools: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>,
): Promise<{
  text: string;
  toolCalls: Array<{ name: string; id: string; input: Record<string, unknown> }>;
}> {
  return { text: await authenticatedChat(request), toolCalls: [] };
}

export async function callCloudAIBatch(
  requests: CloudAIRequest[],
): Promise<string[]> {
  const results: string[] = [];
  for (const request of requests) results.push(await authenticatedChat(request));
  return results;
}
