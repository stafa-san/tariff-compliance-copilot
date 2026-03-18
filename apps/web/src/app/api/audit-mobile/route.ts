import { createOpenAI } from "@ai-sdk/openai";
import { streamText, stepCountIs } from "ai";
import { auditTools } from "@/lib/ai/audit-tools";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/ai/audit-prompt";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { messages: uiMessages } = await req.json();

    const modelMessages = uiMessages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }),
    );

    // Use streamText (same as web app) but collect results instead of streaming
    const result = streamText({
      model: openai("gpt-4o"),
      system: AUDIT_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: auditTools,
      temperature: 0,
      stopWhen: stepCountIs(12),
    });

    // Collect all tool calls and text from the stream
    const findings: unknown[] = [];
    let dutyResult = null;
    let riskResult = null;
    let summary = "";

    for await (const part of result.fullStream) {
      if (part.type === "tool-call" && part.toolName === "report_finding") {
        findings.push(part.args);
      }

      if (part.type === "tool-result") {
        const res = part.result as Record<string, unknown>;
        const toolName = part.toolName;

        if (toolName === "calculate_expected_duties" || res?.totalDuties !== undefined) {
          dutyResult = res;
        }
        if (toolName === "calculate_risk_score" || (res?.score !== undefined && res?.level !== undefined)) {
          riskResult = res;
        }
      }

      if (part.type === "text-delta") {
        summary += part.textDelta;
      }
    }

    return Response.json({
      findings,
      dutyResult,
      riskResult,
      summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isCredit =
      message.includes("credit") ||
      message.includes("billing") ||
      message.includes("quota") ||
      message.includes("limit");
    return Response.json(
      {
        error: isCredit
          ? "API credit limit reached. Please check your API billing."
          : `Audit failed: ${message}`,
      },
      { status: isCredit ? 402 : 500 },
    );
  }
}
