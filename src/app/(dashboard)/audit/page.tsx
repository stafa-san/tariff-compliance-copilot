"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ScanSearch,
  Upload,
  FileText,
  Search,
  Shield,
  Calculator,
  ClipboardList,
  BarChart3,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Download,
  RotateCcw,
  Sparkles,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditFinding {
  field: string;
  severity: "info" | "warning" | "error";
  title: string;
  description: string;
  invoiceValue?: string;
  form7501Value?: string;
  recommendation?: string;
}

/* ------------------------------------------------------------------ */
/* Tool-call UI configuration                                         */
/* ------------------------------------------------------------------ */

const TOOL_CONFIG: Record<
  string,
  { icon: typeof Search; label: string; activeLabel: string; color: string }
> = {
  lookup_hts_code: {
    icon: Search,
    label: "HTS Code Validated",
    activeLabel: "Searching USITC database...",
    color: "text-blue-600",
  },
  check_trade_remedies: {
    icon: Shield,
    label: "Trade Remedies Checked",
    activeLabel: "Checking Section 301/232 tariffs...",
    color: "text-purple-600",
  },
  calculate_expected_duties: {
    icon: Calculator,
    label: "Duties Calculated",
    activeLabel: "Computing expected duties & fees...",
    color: "text-green-600",
  },
  report_finding: {
    icon: ClipboardList,
    label: "Finding Recorded",
    activeLabel: "Recording audit finding...",
    color: "text-orange-600",
  },
  calculate_risk_score: {
    icon: BarChart3,
    label: "Risk Score Calculated",
    activeLabel: "Calculating compliance risk...",
    color: "text-red-600",
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

function severityBg(severity: string) {
  switch (severity) {
    case "error":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-yellow-200 bg-yellow-50";
    default:
      return "border-blue-200 bg-blue-50";
  }
}

async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
  if (!res.ok) throw new Error("PDF extraction failed");
  const data = await res.json();
  return data.text as string;
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export default function AuditPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [form7501File, setForm7501File] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  // Store raw extracted text for the prompt
  const invoiceTextRef = useRef<string>("");
  const form7501TextRef = useRef<string>("");
  // Store broker name extracted from 7501 for CSV
  const brokerNameRef = useRef<string>("");

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const form7501InputRef = useRef<HTMLInputElement>(null);
  const toolListEndRef = useRef<HTMLDivElement>(null);

  /* ---- Claude AI chat (agentic tool-calling) ---- */
  const [auditError, setAuditError] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/audit" }),
    onFinish: () => setStep(3),
    onError: (err) => {
      setAuditError(
        err.message?.includes("credit") || err.message?.includes("402")
          ? "Claude API credit limit reached. Please add credits at console.anthropic.com to run audits."
          : `Audit failed: ${err.message || "Unknown error. Check your API key and credits."}`,
      );
      setStep(3);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  /* ---- Derived state from Claude's response ---- */
  const assistantMessages = useMemo(
    () => messages.filter((m) => m.role === "assistant"),
    [messages],
  );

  const toolInvocations = useMemo(() => {
    if (assistantMessages.length === 0) return [];
    const toolParts: {
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
      state: string;
      result?: unknown;
    }[] = [];

    for (const msg of assistantMessages) {
      const parts = msg.parts ?? [];
      for (const p of parts) {
        const part = p as Record<string, unknown>;
        const type = part.type as string;
        if (!type?.startsWith("tool-") && type !== "dynamic-tool") continue;

        const toolName =
          type === "dynamic-tool"
            ? (part.toolName as string) || ""
            : type.replace("tool-", "");
        const args = (part.input ?? part.args ?? {}) as Record<string, unknown>;
        const output = part.output ?? part.result;
        const state = output !== undefined ? "result" : "call";

        toolParts.push({
          toolCallId: (part.toolCallId as string) || "",
          toolName,
          args,
          state,
          result: output,
        });
      }
    }
    return toolParts;
  }, [assistantMessages]);

  const findings = useMemo<AuditFinding[]>(
    () =>
      toolInvocations
        .filter((t) => t.toolName === "report_finding" && t.state === "result")
        .map((t) => t.args as unknown as AuditFinding),
    [toolInvocations],
  );

  const riskResult = useMemo(() => {
    const inv = toolInvocations.find(
      (t) => t.toolName === "calculate_risk_score" && t.state === "result",
    );
    if (inv?.result) {
      return inv.result as {
        riskScore: number;
        level: string;
        totalChecks: number;
        errorCount: number;
        warningCount: number;
        infoCount: number;
        recommendation: string;
      };
    }
    // Fallback: compute risk from findings if the tool wasn't called
    if (findings.length > 0 && !isLoading) {
      const errorCount = findings.filter((f) => f.severity === "error").length;
      const warningCount = findings.filter((f) => f.severity === "warning").length;
      const infoCount = findings.filter((f) => f.severity === "info").length;
      const rawScore = errorCount * 25 + warningCount * 10;
      const riskScore = Math.min(100, rawScore);
      const level = riskScore >= 60 ? "High" : riskScore >= 30 ? "Medium" : "Low";
      return {
        riskScore,
        level,
        totalChecks: errorCount + warningCount + infoCount,
        errorCount,
        warningCount,
        infoCount,
        recommendation:
          level === "High"
            ? "Immediate review required — significant compliance discrepancies found."
            : level === "Medium"
              ? "Review recommended — some potential issues identified."
              : "Low risk — documents appear compliant with minor notes.",
      };
    }
    return undefined;
  }, [toolInvocations, findings, isLoading]);

  const dutyResult = useMemo(() => {
    const inv = toolInvocations.find(
      (t) => t.toolName === "calculate_expected_duties" && t.state === "result",
    );
    return inv?.result as
      | {
          totalDuties: string;
          enteredValue: string;
          generalDuty: { rate: string; amount: string };
          section122: { rate: string; amount: string; applicable: boolean };
          section301: { rate: string; amount: string; applicable: boolean };
          section232: { rate: string; amount: string; applicable: boolean };
          mpf: { rate: string; amount: string };
          hmf: { rate: string; amount: string };
          effectiveDutyRate: string;
          totalLandedCost: string;
        }
      | undefined;
  }, [toolInvocations]);

  /* ---- Auto-scroll to latest tool action during analysis ---- */
  useEffect(() => {
    if (step === 2 && toolListEndRef.current) {
      toolListEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [step, toolInvocations.length]);

  const [crossDocWarning, setCrossDocWarning] = useState("");
  const [validatingFile, setValidatingFile] = useState<"invoice" | "form7501" | null>(null);

  // File mismatch dialog state
  const [mismatchDialog, setMismatchDialog] = useState<{
    open: boolean;
    message: string;
    file: File | null;
    slot: "invoice" | "form7501";
  }>({ open: false, message: "", file: null, slot: "invoice" });

  const commitFile = useCallback(
    (file: File, type: "invoice" | "form7501") => {
      if (type === "invoice") setInvoiceFile(file);
      else setForm7501File(file);
      setExtractError("");
      setCrossDocWarning("");
    },
    [],
  );

  /* ---- File handlers ---- */
  const handleFileSelect = useCallback(
    async (file: File, type: "invoice" | "form7501") => {
      // Basic validation: must be PDF
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        setExtractError("Please upload a PDF file.");
        return;
      }

      setValidatingFile(type);

      // Extract text from the PDF to check its actual content
      try {
        const text = await extractPdfText(file);
        const looks7501 = /entry summary|cbp form 7501|department of homeland|customs entry/i.test(text);
        const looksInvoice = /commercial invoice|proforma invoice|bill to|sold to|invoice number|invoice date/i.test(text) &&
          !looks7501;

        if (type === "invoice" && looks7501) {
          setValidatingFile(null);
          setMismatchDialog({
            open: true,
            message: "This PDF appears to be a CBP Form 7501 (Entry Summary), but you're uploading it to the Commercial Invoice slot. Are you sure this is correct?",
            file,
            slot: type,
          });
          return;
        }
        if (type === "form7501" && looksInvoice) {
          setValidatingFile(null);
          setMismatchDialog({
            open: true,
            message: "This PDF appears to be a Commercial Invoice, but you're uploading it to the CBP Form 7501 slot. Are you sure this is correct?",
            file,
            slot: type,
          });
          return;
        }
      } catch {
        // If extraction fails here, just accept the file — it will fail again at audit time with a proper error
      }

      setValidatingFile(null);
      commitFile(file, type);
    },
    [commitFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "invoice" | "form7501") => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file, type);
    },
    [handleFileSelect],
  );

  const preventDefault = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  /* ---- Run audit: extract PDFs then send raw text to Claude ---- */
  const runAudit = useCallback(async () => {
    if (!invoiceFile || !form7501File) return;
    setExtracting(true);
    setExtractError("");
    setCrossDocWarning("");

    try {
      // Extract text from both PDFs in parallel
      const [invoiceText, form7501Text] = await Promise.all([
        extractPdfText(invoiceFile),
        extractPdfText(form7501File),
      ]);

      invoiceTextRef.current = invoiceText;
      form7501TextRef.current = form7501Text;

      // Validate document types from content
      const invoiceLower = invoiceText.toLowerCase();
      const form7501Lower = form7501Text.toLowerCase();

      // Check if invoice slot actually contains a 7501
      const invoiceLooks7501 = /entry summary|cbp form 7501|department of homeland|entry number/i.test(invoiceText);
      const form7501LooksInvoice = /commercial invoice|proforma|bill to|ship to|invoice number/i.test(form7501Text) &&
        !/entry summary|cbp form 7501|department of homeland/i.test(form7501Text);

      if (invoiceLooks7501 && form7501LooksInvoice) {
        setExtractError("It looks like the files are swapped — the Invoice slot contains a Form 7501 and vice versa. Please swap them.");
        setExtracting(false);
        return;
      }
      if (invoiceLooks7501) {
        setExtractError("The file uploaded as Commercial Invoice appears to be a CBP Form 7501. Please upload the correct file.");
        setExtracting(false);
        return;
      }
      if (form7501LooksInvoice) {
        setExtractError("The file uploaded as CBP Form 7501 appears to be a Commercial Invoice. Please upload the correct file.");
        setExtracting(false);
        return;
      }

      // Cross-check: try to match key identifiers between documents
      // Look for common fields like invoice number, supplier name, or values
      const invoiceValueMatch = invoiceLower.match(/total[:\s]*\$?([\d,]+\.?\d*)/);
      const form7501ValueMatch = form7501Lower.match(/entered value[:\s]*\$?([\d,]+\.?\d*)/);
      const invoiceSupplier = invoiceLower.match(/(?:seller|shipper|exporter|from)[:\s]*([^\n]{5,40})/);
      const form7501Manufacturer = form7501Lower.match(/(?:manufacturer|mid|supplier)[:\s]*([^\n]{5,40})/);

      // If we can extract values from both and they're wildly different, warn
      if (invoiceValueMatch && form7501ValueMatch) {
        const invVal = parseFloat(invoiceValueMatch[1].replace(/,/g, ""));
        const f7501Val = parseFloat(form7501ValueMatch[1].replace(/,/g, ""));
        if (invVal > 0 && f7501Val > 0 && (invVal / f7501Val > 5 || f7501Val / invVal > 5)) {
          setCrossDocWarning(
            `The invoice total ($${invVal.toLocaleString()}) and 7501 entered value ($${f7501Val.toLocaleString()}) differ significantly. Are you sure these documents belong to the same shipment?`
          );
        }
      }

      // Extract broker name — look for Box 46, Broker/Filer field (NOT Importing Carrier)
      const brokerPatterns = [
        /(?:46|Box 46)[.\s:]*\n?\s*([A-Z][A-Za-z &.,'-]{2,50})/,
        /(?:Broker\/Filer|Customs Broker|Filer Name|Licensed Broker)[:\s]*\n?\s*([A-Z][A-Za-z &.,'-]{2,50})/,
        /(?:Broker\/Filer|Filer)[^\n]*?:\s*([A-Z][A-Za-z &.,'-]{2,50})/,
        /Broker[^\n]*\n\s*([A-Z][A-Za-z &.,'-]{2,50})/,
      ];
      let brokerName = "";
      for (const pattern of brokerPatterns) {
        const match = form7501Text.match(pattern);
        if (match?.[1]?.trim() && match[1].trim().length >= 3) {
          brokerName = match[1].trim();
          break;
        }
      }
      brokerNameRef.current = brokerName;

      setStep(2);

      const prompt = `Please perform a complete compliance audit by thoroughly analyzing the EXACT content of these two uploaded trade documents. Do NOT use any pre-loaded or sample data — analyze ONLY what is written in these documents.

## DOCUMENT 1 — Commercial Invoice (extracted text from uploaded PDF)
\`\`\`
${invoiceText}
\`\`\`

## DOCUMENT 2 — CBP Form 7501 Entry Summary (extracted text from uploaded PDF)
\`\`\`
${form7501Text}
\`\`\`

## INSTRUCTIONS
1. Read every field from BOTH documents carefully. Extract all HTS codes, values, quantities, units, rates, country of origin, broker info, carrier, ports, dates, and any other data present.
2. Pay attention to the ACTUAL units on the invoice (e.g., "Units", "pieces", "kg", "doz") — do not assume units.
3. The 7501 may list MULTIPLE HTS lines (including Section 301/232 provisions like 9903.88.15, 9903.03.01, 9903.81.90). Analyze ALL of them.
4. Use your tools to validate each HTS code against the USITC database.
5. Check for trade remedies (Section 301, 232, AD/CVD) based on the actual country of origin and product.
6. Calculate expected duties using the ACTUAL entered value and rates from the documents.
7. Cross-check EVERY field between the two documents — flag anything missing, inconsistent, or incorrect.
8. Note anything unusual or that doesn't make sense (wrong units, missing fields, math errors, etc.).
9. Report each finding individually, then calculate the risk score.

Follow your complete audit workflow. Be thorough and precise — this is a real compliance audit.`;

      sendMessage({ text: prompt });
    } catch {
      setExtractError(
        "Failed to extract text from one or both PDFs. Please ensure they are valid PDF files.",
      );
    } finally {
      setExtracting(false);
    }
  }, [invoiceFile, form7501File, sendMessage]);

  const resetAudit = useCallback(() => {
    setStep(1);
    setInvoiceFile(null);
    setForm7501File(null);
    setExtractError("");
    invoiceTextRef.current = "";
    form7501TextRef.current = "";
    brokerNameRef.current = "";
    window.location.reload();
  }, []);

  /* ---- CSV Export — first column = Broker from 7501 ---- */
  const exportCSV = useCallback(() => {
    const headers = [
      "Broker Name",
      "Entry Number",
      "Entry Type",
      "HTS Code(s)",
      "Country of Origin",
      "Entered Value",
      "General Duty Rate",
      "Total Duties (Calculated)",
      "Discrepancy",
      "Risk Level",
      "Risk Score",
      "Notes",
      "Recommendation",
    ];

    // Extract key data from findings and tool results
    const errors = findings.filter((f) => f.severity === "error");
    const warnings = findings.filter((f) => f.severity === "warning");
    const infos = findings.filter((f) => f.severity === "info");
    const discrepancy =
      errors.length > 0 ? errors.map((e) => e.title).join("; ") : "None";

    // Try to parse entry number and other fields from 7501 text
    const text7501 = form7501TextRef.current;
    const entryMatch = text7501.match(/(?:Entry Number|Filer Code|Entry No)[.\s:]*\n?\s*([A-Z]{2,3}[\s-]?\d{3,10}[\s-]?\d{0,2})/i) ||
      text7501.match(/(?:Entry Number|Filer Code)[^\n]*?([A-Z0-9-]{5,})/i);
    const originMatch = text7501.match(/(?:Country of Origin|Country of Export|origin|Box 10)[.\s:]*\n?\s*([A-Z]{2})/i);

    // Extract broker name from AI findings first, then fallback to regex
    let brokerName = brokerNameRef.current || "";
    const brokerFinding = findings.find(
      (f) => /parties|broker|logistics/i.test(f.field) || /broker/i.test(f.title),
    );
    if (brokerFinding) {
      const brokerMatch = brokerFinding.description.match(
        /(?:broker|filer)[:\s]*["']?([A-Za-z][A-Za-z &.,'-]{2,40})/i,
      );
      if (brokerMatch?.[1]) brokerName = brokerMatch[1].trim();
    }
    // Validate broker name — if it contains too many non-alpha chars, it's garbage
    if (!brokerName || /[^A-Za-z\s&.,'-]/.test(brokerName) && brokerName.replace(/[^A-Za-z]/g, "").length < 3) {
      brokerName = "See audit report";
    }

    // Build completeness notes
    const totalChecks = findings.length;
    const notes = `${totalChecks} checks completed: ${infos.length} verified, ${warnings.length} warnings, ${errors.length} errors`;

    // Extract HTS codes from findings — check multiple possible field names
    const htsCodes = findings
      .filter((f) => /hts|classification|tariff/i.test(f.field))
      .map((f) => f.form7501Value || "")
      .filter(Boolean)
      .join("; ");

    const row = [
      brokerName,
      entryMatch?.[1]?.trim() || "",
      "01",
      htsCodes,
      originMatch?.[1] || "",
      dutyResult?.enteredValue ? `$${dutyResult.enteredValue}` : "",
      dutyResult?.generalDuty?.rate || "",
      dutyResult ? `$${dutyResult.totalDuties}` : "",
      discrepancy,
      riskResult?.level || "N/A",
      riskResult?.riskScore?.toString() || "",
      notes,
      riskResult?.recommendation || "",
    ];

    const csv = [headers, row]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [findings, dutyResult, riskResult]);

  /* ================================================================ */
  /* RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ScanSearch className="h-7 w-7 text-primary" />
            AI Audit Agent
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload trade documents, let AI cross-check and validate compliance
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1 border-primary/30 bg-primary/5 text-primary"
        >
          <Sparkles className="h-3 w-3" />
          Powered by Claude AI
        </Badge>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(
          [
            { num: 1, label: "Upload Documents", icon: Upload },
            { num: 2, label: "AI Analysis", icon: Sparkles },
            { num: 3, label: "Review & Export", icon: Download },
          ] as const
        ).map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${step >= s.num ? "bg-primary" : "bg-muted"}`}
              />
            )}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                step === s.num
                  ? "bg-primary text-primary-foreground"
                  : step > s.num
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.num ? (
                <Check className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.num}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* STEP 1: Upload Documents                                      */}
      {/* ============================================================ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Invoice drop zone */}
            <Card
              className={`cursor-pointer transition-colors ${
                invoiceFile
                  ? "border-green-300 bg-green-50"
                  : "border-dashed hover:border-primary/50"
              }`}
              onDragOver={preventDefault}
              onDrop={(e) => handleDrop(e, "invoice")}
              onClick={() => invoiceInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f, "invoice");
                  }}
                />
                {validatingFile === "invoice" ? (
                  <>
                    <Loader2 className="mb-2 h-10 w-10 animate-spin text-primary" />
                    <p className="font-medium">Checking document...</p>
                  </>
                ) : invoiceFile ? (
                  <>
                    <FileText className="mb-2 h-10 w-10 text-green-600" />
                    <p className="font-medium">{invoiceFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Commercial Invoice ready
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">Commercial Invoice</p>
                    <p className="text-xs text-muted-foreground">
                      Drag & drop PDF or click to upload
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 7501 drop zone */}
            <Card
              className={`cursor-pointer transition-colors ${
                form7501File
                  ? "border-green-300 bg-green-50"
                  : "border-dashed hover:border-primary/50"
              }`}
              onDragOver={preventDefault}
              onDrop={(e) => handleDrop(e, "form7501")}
              onClick={() => form7501InputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <input
                  ref={form7501InputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f, "form7501");
                  }}
                />
                {validatingFile === "form7501" ? (
                  <>
                    <Loader2 className="mb-2 h-10 w-10 animate-spin text-primary" />
                    <p className="font-medium">Checking document...</p>
                  </>
                ) : form7501File ? (
                  <>
                    <FileText className="mb-2 h-10 w-10 text-green-600" />
                    <p className="font-medium">{form7501File.name}</p>
                    <p className="text-xs text-muted-foreground">
                      CBP Form 7501 ready
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">CBP Form 7501</p>
                    <p className="text-xs text-muted-foreground">
                      Drag & drop PDF or click to upload
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {extractError && (
            <p className="text-sm text-red-600">{extractError}</p>
          )}

          {crossDocWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
              <p className="text-sm text-yellow-800">{crossDocWarning}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={runAudit}
              disabled={!invoiceFile || !form7501File || extracting}
              className="gap-2"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting PDF text...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run AI Audit
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Upload your actual Commercial Invoice and CBP Form 7501 PDFs. The AI agent will extract and analyze every field from both documents, then cross-check them for compliance.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: AI Analysis (streaming tool calls)                    */}
      {/* ============================================================ */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="sticky top-0 z-10 bg-background/95 pb-3 backdrop-blur supports-backdrop-filter:bg-background/80">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                Agent Actions
                {isLoading && (
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs font-normal text-muted-foreground">
                      {toolInvocations.filter(t => t.state === "result").length} steps
                    </span>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </span>
                )}
                {!isLoading && toolInvocations.length > 0 && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-green-600">
                    <Check className="h-4 w-4" />
                    Complete
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {toolInvocations.length === 0 && isLoading && (
                <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Claude is reading and analyzing your documents...
                  </span>
                </div>
              )}

              {toolInvocations.map((inv, i) => {
                const config = TOOL_CONFIG[inv.toolName];
                if (!config) return null;
                const Icon = config.icon;
                const isDone = inv.state === "result";

                if (inv.toolName === "report_finding") {
                  const finding = inv.args as unknown as AuditFinding;
                  return (
                    <div
                      key={inv.toolCallId || i}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${severityBg(finding.severity)}`}
                    >
                      <SeverityIcon severity={finding.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{finding.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {finding.field}
                        </p>
                      </div>
                      {isDone && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                  );
                }

                return (
                  <div
                    key={inv.toolCallId || i}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {isDone ? (
                      <Check className={`h-5 w-5 ${config.color}`} />
                    ) : (
                      <Loader2
                        className={`h-5 w-5 animate-spin ${config.color}`}
                      />
                    )}
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-sm">
                      {isDone ? config.label : config.activeLabel}
                    </span>
                    {inv.toolName === "lookup_hts_code" &&
                    typeof inv.args.keyword === "string" ? (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {inv.args.keyword}
                      </Badge>
                    ) : null}
                  </div>
                );
              })}
              {/* Scroll anchor */}
              <div ref={toolListEndRef} />
            </CardContent>
          </Card>

          {/* Sticky bottom progress indicator during analysis */}
          {isLoading && (
            <div className="sticky bottom-4 z-10">
              <div className="mx-auto flex items-center justify-center gap-3 rounded-full border bg-background/95 px-5 py-2.5 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Analyzing{toolInvocations.length > 0 ? ` — ${toolInvocations.filter(t => t.state === "result").length} steps completed` : "..."}
                </span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          )}

          {/* Completion indicator when analysis is done */}
          {!isLoading && step === 2 && toolInvocations.length > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Analysis complete — {toolInvocations.filter(t => t.state === "result").length} steps performed
              </span>
            </div>
          )}

          {/* Claude's streaming narrative */}
          {assistantMessages.length > 0 &&
            assistantMessages.some((m) =>
              m.parts
                .filter(
                  (p): p is { type: "text"; text: string } => p.type === "text",
                )
                .some((p) => p.text.trim()),
            ) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Agent Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {assistantMessages
                      .flatMap((m) =>
                        m.parts
                          .filter(
                            (p): p is { type: "text"; text: string } =>
                              p.type === "text",
                          )
                          .map((p) => p.text),
                      )
                      .join("")}
                  </div>
                </CardContent>
              </Card>
            )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-4">
                <p className="text-sm text-red-800">
                  <AlertCircle className="mr-2 inline h-4 w-4" />
                  Error: {error.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={resetAudit}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: Results                                               */}
      {/* ============================================================ */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">
                  {riskResult?.totalChecks ?? findings.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Checks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {riskResult?.errorCount ??
                    findings.filter((f) => f.severity === "error").length}
                </p>
                <p className="text-xs text-muted-foreground">Errors Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {riskResult?.warningCount ??
                    findings.filter((f) => f.severity === "warning").length}
                </p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p
                  className={`text-2xl font-bold ${
                    (riskResult?.riskScore ?? 0) >= 60
                      ? "text-red-600"
                      : (riskResult?.riskScore ?? 0) >= 30
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {riskResult?.level ?? "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Risk: {riskResult?.riskScore ?? "–"}/100
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Duty verification */}
          {dutyResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Duty Calculation Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      General Duty ({dutyResult.generalDuty.rate})
                    </span>
                    <span>${dutyResult.generalDuty.amount}</span>
                  </div>
                  {dutyResult.section122?.applicable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Section 122 ({dutyResult.section122.rate})
                      </span>
                      <span>${dutyResult.section122.amount}</span>
                    </div>
                  )}
                  {dutyResult.section301?.applicable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Section 301 ({dutyResult.section301.rate})
                      </span>
                      <span>${dutyResult.section301.amount}</span>
                    </div>
                  )}
                  {dutyResult.section232?.applicable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Section 232 ({dutyResult.section232.rate})
                      </span>
                      <span>${dutyResult.section232.amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      MPF ({dutyResult.mpf.rate})
                    </span>
                    <span>${dutyResult.mpf.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      HMF ({dutyResult.hmf.rate})
                    </span>
                    <span>${dutyResult.hmf.amount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-medium">
                    <span>AI Calculated Total</span>
                    <span>${dutyResult.totalDuties}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Effective duty rate</span>
                    <span>{dutyResult.effectiveDutyRate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit findings — expanded per-field view */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Audit Findings</CardTitle>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const totalFields = findings.reduce((count, f) => {
                    const bullets = f.description.split(/\n/).filter(l => l.trim().startsWith("•"));
                    return count + (bullets.length || 1);
                  }, 0);
                  return `${totalFields} field checks across ${findings.length} categories — Commercial Invoice vs Form 7501`;
                })()}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {findings.length === 0 && (
                <div className="py-4 text-center">
                  {auditError ? (
                    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-4">
                      <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
                      <p className="text-sm font-medium text-red-800">{auditError}</p>
                    </div>
                  ) : step === 3 && !isLoading ? (
                    <div className="mx-auto max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                      <p className="text-sm font-medium text-yellow-800">
                        No findings were returned. This usually means the Claude API credit limit has been reached.
                        Check your balance at console.anthropic.com.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No structured findings recorded.</p>
                  )}
                </div>
              )}
              {findings.map((finding, i) => {
                const statusLabel =
                  finding.severity === "info"
                    ? "Verified Correct"
                    : finding.severity === "warning"
                      ? "Needs Review"
                      : "Discrepancy Found";
                const statusColor =
                  finding.severity === "info"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : finding.severity === "warning"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-red-100 text-red-700 border-red-300";

                // Parse bullet-formatted field checks from description
                const lines = finding.description.split(/\n/);
                const bulletLines = lines.filter(l => l.trim().startsWith("•"));
                const nonBulletText = lines.filter(l => !l.trim().startsWith("•") && l.trim()).join(" ");

                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 ${severityBg(finding.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <SeverityIcon severity={finding.severity} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {finding.field}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {finding.severity === "info" && <Check className="mr-1 h-3 w-3" />}
                            {finding.severity === "warning" && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {finding.severity === "error" && <AlertCircle className="mr-1 h-3 w-3" />}
                            {statusLabel}
                          </span>
                          {bulletLines.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {bulletLines.length} checks
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium">
                          {finding.title}
                        </p>

                        {/* Per-field check rows */}
                        {bulletLines.length > 0 ? (
                          <div className="mt-2 space-y-1.5">
                            {bulletLines.map((line, j) => {
                              const text = line.replace(/^[•\s]+/, "").trim();
                              // Detect status from emoji or keywords
                              const isPass = /✅|matches?|correct|verified|present|consistent/i.test(text);
                              const isFail = /❌|mismatch|discrepancy|missing|incorrect|differ/i.test(text);
                              const isWarn = /⚠️|warning|review|potential|unclear|unable/i.test(text);

                              // Extract field name (text before first colon)
                              const colonIdx = text.indexOf(":");
                              const fieldName = colonIdx > 0 ? text.slice(0, colonIdx).replace(/[✅❌⚠️]/g, "").trim() : "";
                              const detail = colonIdx > 0 ? text.slice(colonIdx + 1).replace(/[✅❌⚠️]/g, "").trim() : text.replace(/[✅❌⚠️]/g, "").trim();

                              const rowColor = isFail
                                ? "text-red-700"
                                : isWarn
                                  ? "text-yellow-700"
                                  : "text-green-700";
                              const rowIcon = isFail
                                ? <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                                : isWarn
                                  ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                                  : <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />;

                              return (
                                <div key={j} className={`flex items-start gap-2 rounded px-2 py-1 text-xs ${
                                  isFail ? "bg-red-100/50" : isWarn ? "bg-yellow-100/50" : isPass ? "bg-green-100/50" : ""
                                }`}>
                                  {rowIcon}
                                  <span className={rowColor}>
                                    {fieldName && <span className="font-semibold">{fieldName}: </span>}
                                    {detail}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {finding.description}
                          </p>
                        )}

                        {nonBulletText && bulletLines.length > 0 && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {nonBulletText}
                          </p>
                        )}

                        {(finding.invoiceValue || finding.form7501Value) && (
                          <div className="mt-2 flex gap-4 text-xs">
                            {finding.invoiceValue && (
                              <span>
                                <span className="text-muted-foreground">Invoice: </span>
                                <span className="font-medium">{finding.invoiceValue}</span>
                              </span>
                            )}
                            {finding.form7501Value && (
                              <span>
                                <span className="text-muted-foreground">7501: </span>
                                <span className="font-medium">{finding.form7501Value}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {finding.recommendation && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <CircleDot className="mr-1 inline h-3 w-3" />
                            {finding.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Claude's narrative summary */}
          {assistantMessages.length > 0 &&
            assistantMessages.some((m) =>
              m.parts
                .filter(
                  (p): p is { type: "text"; text: string } => p.type === "text",
                )
                .some((p) => p.text.trim()),
            ) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Agent Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                    {assistantMessages
                      .flatMap((m) =>
                        m.parts
                          .filter(
                            (p): p is { type: "text"; text: string } =>
                              p.type === "text",
                          )
                          .map((p) => p.text),
                      )
                      .join("")}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Download Audit CSV
            </Button>
            <Button onClick={resetAudit} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              New Audit
            </Button>
          </div>
        </div>
      )}
      {/* File mismatch confirmation dialog */}
      <Dialog
        open={mismatchDialog.open}
        onOpenChange={(open) => {
          if (!open) setMismatchDialog((prev) => ({ ...prev, open: false }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Document Type Mismatch
            </DialogTitle>
            <DialogDescription>{mismatchDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setMismatchDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (mismatchDialog.file) {
                  commitFile(mismatchDialog.file, mismatchDialog.slot);
                }
                setMismatchDialog((prev) => ({ ...prev, open: false }));
              }}
            >
              Upload Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
