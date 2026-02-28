import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { auditTools } from "@/lib/ai/audit-tools";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/ai/audit-prompt";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages: uiMessages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: AUDIT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(uiMessages),
    tools: auditTools,
    stopWhen: stepCountIs(15),
  });

  return result.toUIMessageStreamResponse();
}
