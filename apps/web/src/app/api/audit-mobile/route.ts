import { createOpenAI } from "@ai-sdk/openai";
import { generateText, convertToModelMessages } from "ai";
import { auditTools } from "@/lib/ai/audit-tools";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/ai/audit-prompt";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages: uiMessages } = await req.json();

    // Support simple {role, content} format from mobile
    let modelMessages;
    try {
      modelMessages = await convertToModelMessages(uiMessages);
    } catch {
      modelMessages = uiMessages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));
    }

    const result = await generateText({
      model: openai("gpt-4o"),
      system: AUDIT_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: auditTools,
      temperature: 0,
      maxSteps: 12,
    });

    // Extract findings, duties, and risk from tool calls
    const findings: unknown[] = [];
    let dutyResult = null;
    let riskResult = null;

    for (const step of result.steps) {
      for (const tc of step.toolCalls) {
        if (tc.toolName === "report_finding") {
          findings.push(tc.args);
        }
        if (tc.toolName === "calculate_expected_duties") {
          // Get the result from toolResults
          const tr = step.toolResults.find((r) => r.toolCallId === tc.toolCallId);
          if (tr) dutyResult = tr.result;
        }
        if (tc.toolName === "calculate_risk_score") {
          const tr = step.toolResults.find((r) => r.toolCallId === tc.toolCallId);
          if (tr) riskResult = tr.result;
        }
      }
    }

    return Response.json({
      findings,
      dutyResult,
      riskResult,
      summary: result.text,
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
