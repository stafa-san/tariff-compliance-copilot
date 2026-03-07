import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { auditTools } from "@/lib/ai/audit-tools";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/ai/audit-prompt";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages: uiMessages } = await req.json();

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: AUDIT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(uiMessages),
      tools: auditTools,
      stopWhen: stepCountIs(12),
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isCredit = message.includes("credit") || message.includes("billing") || message.includes("quota");
    return new Response(
      JSON.stringify({
        error: isCredit
          ? "Claude API credit limit reached. Please add credits at console.anthropic.com."
          : `Audit failed: ${message}`,
      }),
      { status: isCredit ? 402 : 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
