import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { auditTools } from "@/lib/ai/audit-tools";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/ai/audit-prompt";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages: uiMessages } = await req.json();

    const result = streamText({
      model: openai("gpt-4o"),
      system: AUDIT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(uiMessages),
      tools: auditTools,
      temperature: 0,
      stopWhen: stepCountIs(12),
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isCredit = message.includes("credit") || message.includes("billing") || message.includes("quota") || message.includes("limit");
    return new Response(
      JSON.stringify({
        error: isCredit
          ? "API credit limit reached. Please check your API billing."
          : `Audit failed: ${message}`,
      }),
      { status: isCredit ? 402 : 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
