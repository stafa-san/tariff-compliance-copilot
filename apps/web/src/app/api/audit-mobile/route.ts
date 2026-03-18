import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
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

    const result = await generateText({
      model: openai("gpt-4o"),
      system: AUDIT_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: auditTools,
      temperature: 0,
      maxSteps: 12,
    });

    // Extract from all steps
    const findings: unknown[] = [];
    let dutyResult = null;
    let riskResult = null;

    for (const step of result.steps || []) {
      // Check toolCalls for report_finding args
      for (const tc of step.toolCalls || []) {
        if (tc.toolName === "report_finding") {
          findings.push(tc.args);
        }
      }

      // Check toolResults for calculated values
      // toolResults can have .result or .output depending on SDK version
      for (const tr of step.toolResults || []) {
        const res =
          (tr as any).result ?? (tr as any).output ?? {};
        const toolName = (tr as any).toolName ?? "";

        if (toolName === "report_finding" || (res?.field && res?.severity)) {
          // Avoid duplicates (already added from toolCalls)
          if (
            !findings.some(
              (f: any) => f.field === res.field && f.title === res.title,
            )
          ) {
            findings.push(res);
          }
        }

        if (
          toolName === "calculate_expected_duties" ||
          res?.totalDuties !== undefined
        ) {
          dutyResult = res;
        }

        if (
          toolName === "calculate_risk_score" ||
          (res?.score !== undefined && res?.level !== undefined)
        ) {
          riskResult = res;
        }
      }
    }

    return Response.json({
      findings,
      dutyResult,
      riskResult,
      summary: result.text || "",
      stepCount: result.steps?.length ?? 0,
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
