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

    // Support both UI message format (from useChat) and simple {role, content} format (from mobile)
    let modelMessages;
    try {
      modelMessages = await convertToModelMessages(uiMessages);
    } catch {
      // Fallback: simple messages format from mobile app
      modelMessages = uiMessages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: AUDIT_SYSTEM_PROMPT,
      messages: modelMessages,
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
