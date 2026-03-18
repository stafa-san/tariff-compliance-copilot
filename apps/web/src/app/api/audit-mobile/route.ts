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

    // Extract findings, duties, and risk from all steps
    const findings: unknown[] = [];
    let dutyResult = null;
    let riskResult = null;

    // Try steps API first (AI SDK v4+)
    if (result.steps && Array.isArray(result.steps)) {
      for (const step of result.steps) {
        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            if (tc.toolName === "report_finding") {
              findings.push(tc.args);
            }
          }
        }
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            const res = tr.result as Record<string, unknown>;
            if (res?.totalDuties !== undefined) {
              dutyResult = res;
            }
            if (res?.score !== undefined && res?.level !== undefined) {
              riskResult = res;
            }
            // report_finding tool echoes the args as result
            if (
              res?.field &&
              res?.severity &&
              !findings.some(
                (f: any) =>
                  f.field === res.field && f.title === res.title,
              )
            ) {
              findings.push(res);
            }
          }
        }
      }
    }

    // Fallback: check toolCalls and toolResults at top level
    if (findings.length === 0) {
      const tc = (result as any).toolCalls;
      const tr = (result as any).toolResults;
      if (Array.isArray(tc)) {
        for (const call of tc) {
          if (call.toolName === "report_finding") {
            findings.push(call.args);
          }
        }
      }
      if (Array.isArray(tr)) {
        for (const res of tr) {
          const r = res.result as Record<string, unknown>;
          if (r?.totalDuties !== undefined) dutyResult = r;
          if (r?.score !== undefined && r?.level !== undefined) riskResult = r;
          if (r?.field && r?.severity) findings.push(r);
        }
      }
    }

    return Response.json({
      findings,
      dutyResult,
      riskResult,
      summary: result.text || "",
      debug: {
        stepCount: result.steps?.length ?? 0,
        hasToolCalls: !!(result as any).toolCalls,
        hasToolResults: !!(result as any).toolResults,
        textLength: result.text?.length ?? 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack?.slice(0, 500) : "";
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
        debug: { stack },
      },
      { status: isCredit ? 402 : 500 },
    );
  }
}
