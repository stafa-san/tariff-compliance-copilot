"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo, useCallback } from "react";
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

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  seller: { name: string; address: string; country: string };
  buyer: { name: string; address: string };
  items: {
    description: string;
    htsCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    countryOfOrigin: string;
    material: string;
  }[];
  totalValue: number;
  currency: string;
  shippingMethod: string;
  portOfExport: string;
  portOfImport: string;
  incoterms: string;
}

interface Form7501Data {
  entryNumber: string;
  entryType: string;
  summaryDate: string;
  portCode: string;
  importingCarrier: string;
  modeOfTransport: string;
  countryOfOrigin: string;
  manufacturerId: string;
  exportingCountry: string;
  importDate: string;
  htsCode: string;
  descriptionOfMerchandise: string;
  grossWeight: string;
  netQuantity: string;
  enteredValue: number;
  dutyRate: string;
  section301Code: string;
  section301Rate: string;
  totalDuty: number;
  mpf: number;
  hmf: number;
  totalFees: number;
}

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
/* Sample data (UC Bearcats Sweatshirt — from reference invoices)     */
/* ------------------------------------------------------------------ */

const SAMPLE_INVOICE: InvoiceData = {
  invoiceNumber: "GEA-2025-0847",
  date: "2025-01-15",
  seller: {
    name: "Guangzhou Elite Apparel Manufacturing Co., Ltd.",
    address: "No. 88 Huacheng Avenue, Tianhe District, Guangzhou, 510623",
    country: "CN",
  },
  buyer: {
    name: "UC Campus Bookstore / University of Cincinnati",
    address: "2600 Clifton Ave, Cincinnati, OH 45221",
  },
  items: [
    {
      description:
        "Men's University of Cincinnati Bearcats Hooded Sweatshirt — 80% Cotton / 20% Polyester, screen-printed red and black UC Bearcats logo, adult sizes S-XL",
      htsCode: "6110.20.2079",
      quantity: 500,
      unitPrice: 18.0,
      totalPrice: 9000.0,
      countryOfOrigin: "CN",
      material: "80% Cotton / 20% Polyester",
    },
  ],
  totalValue: 9000.0,
  currency: "USD",
  shippingMethod: "ocean",
  portOfExport: "Guangzhou, China",
  portOfImport: "Los Angeles, CA",
  incoterms: "FOB Guangzhou",
};

const SAMPLE_7501: Form7501Data = {
  entryNumber: "ABC-1234567-8",
  entryType: "01",
  summaryDate: "2025-02-01",
  portCode: "2704",
  importingCarrier: "COSCO Shipping",
  modeOfTransport: "11",
  countryOfOrigin: "CN",
  manufacturerId: "CNGUAELITAPP",
  exportingCountry: "CN",
  importDate: "2025-01-28",
  htsCode: "6110.20.2079",
  descriptionOfMerchandise:
    "Men's cotton hooded sweatshirts, knitted, with screen-printed logos",
  grossWeight: "350 KG",
  netQuantity: "500 DOZ",
  enteredValue: 9000.0,
  dutyRate: "16.5%",
  section301Code: "9903.88.15",
  section301Rate: "7.5%",
  totalDuty: 2191.18,
  mpf: 31.18,
  hmf: 0,
  totalFees: 2191.18,
};

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
/* Helper components                                                   */
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

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function AuditPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [form7501Data, setForm7501Data] = useState<Form7501Data | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [form7501File, setForm7501File] = useState<File | null>(null);

  /* ---- Claude AI chat (agentic tool-calling) ---- */
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/audit" }),
    onFinish: () => setStep(3),
  });

  const isLoading = status === "streaming" || status === "submitted";

  /* ---- Derived state from Claude's response ---- */
  const assistantMessages = useMemo(
    () => messages.filter((m) => m.role === "assistant"),
    [messages],
  );

  // Extract tool invocations from ALL assistant messages (multi-step tool calls span multiple messages)
  const toolInvocations = useMemo(() => {
    if (assistantMessages.length === 0) return [];
    const toolParts: { toolCallId: string; toolName: string; args: Record<string, unknown>; state: string; result?: unknown }[] = [];

    for (const msg of assistantMessages) {
      const parts = msg.parts ?? [];
      for (const p of parts) {
        const part = p as Record<string, unknown>;
        const type = part.type as string;
        if (!type?.startsWith("tool-") && type !== "dynamic-tool") continue;

        const toolName = type === "dynamic-tool"
          ? (part.toolName as string) || ""
          : type.replace("tool-", "");
        const args = ((part.input ?? part.args ?? {}) as Record<string, unknown>);
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
    return inv?.result as
      | {
          riskScore: number;
          level: string;
          totalChecks: number;
          errorCount: number;
          warningCount: number;
          infoCount: number;
          recommendation: string;
        }
      | undefined;
  }, [toolInvocations]);

  const dutyResult = useMemo(() => {
    const inv = toolInvocations.find(
      (t) => t.toolName === "calculate_expected_duties" && t.state === "result",
    );
    return inv?.result as
      | {
          totalDuties: string;
          generalDuty: { rate: string; amount: string };
          section301: { rate: string; amount: string; applicable: boolean };
          mpf: { rate: string; amount: string };
          hmf: { rate: string; amount: string };
          effectiveDutyRate: string;
          totalLandedCost: string;
        }
      | undefined;
  }, [toolInvocations]);

  /* ---- Handlers ---- */
  const loadSample = useCallback(() => {
    setInvoiceData(SAMPLE_INVOICE);
    setForm7501Data(SAMPLE_7501);
    setInvoiceFile(
      new File(["sample"], "Commercial-Invoice-UC-Bearcats.pdf", {
        type: "application/pdf",
      }),
    );
    setForm7501File(
      new File(["sample"], "CBP-Form-7501-Entry-Summary.pdf", {
        type: "application/pdf",
      }),
    );
  }, []);

  const runAudit = useCallback(async () => {
    if (!invoiceData || !form7501Data) return;
    setStep(2);

    const prompt = `Please perform a complete compliance audit of the following trade documents.

## Commercial Invoice
${JSON.stringify(invoiceData, null, 2)}

## CBP Form 7501 (Entry Summary)
${JSON.stringify(form7501Data, null, 2)}

Follow your complete audit workflow: validate the HTS code against the USITC database, check for applicable trade remedies (Section 301/232), calculate expected duties and fees, cross-check all fields between the invoice and 7501, report each finding, and finally calculate the overall compliance risk score.`;

    sendMessage({ text: prompt });
  }, [invoiceData, form7501Data, sendMessage]);

  const resetAudit = useCallback(() => {
    setStep(1);
    setInvoiceData(null);
    setForm7501Data(null);
    setInvoiceFile(null);
    setForm7501File(null);
    window.location.reload();
  }, []);

  const exportCSV = useCallback(() => {
    const headers = [
      "Broker Name",
      "Entry Number",
      "Entry Type",
      "HTS Code",
      "Country of Origin",
      "Entered Value",
      "General Duty Rate",
      "Section 301 Rate",
      "Total Duties (Calculated)",
      "Total Duties (7501)",
      "Discrepancy",
      "Risk Level",
      "Findings Summary",
      "Notes/Insights",
    ];

    const errors = findings.filter((f) => f.severity === "error");
    const discrepancy =
      errors.length > 0 ? errors.map((e) => e.title).join("; ") : "None";

    const row = [
      "AI Audit Agent",
      form7501Data?.entryNumber || "",
      form7501Data?.entryType || "01",
      form7501Data?.htsCode || "",
      form7501Data?.countryOfOrigin || "",
      `$${form7501Data?.enteredValue?.toFixed(2) || "0.00"}`,
      form7501Data?.dutyRate || "",
      form7501Data?.section301Rate || "",
      dutyResult ? `$${dutyResult.totalDuties}` : "",
      `$${form7501Data?.totalFees?.toFixed(2) || "0.00"}`,
      discrepancy,
      riskResult?.level || "N/A",
      findings.map((f) => `[${f.severity}] ${f.title}`).join("; "),
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
    a.download = `audit-report-${form7501Data?.entryNumber || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [findings, form7501Data, dutyResult, riskResult]);

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      setFile: (f: File | null) => void,
      setData: (d: InvoiceData | Form7501Data) => void,
      data: InvoiceData | Form7501Data,
    ) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        setFile(file);
        setData(data);
      }
    },
    [],
  );

  const preventDefault = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

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
              onDrop={(e) =>
                handleDrop(
                  e,
                  setInvoiceFile as (f: File | null) => void,
                  setInvoiceData as (d: InvoiceData | Form7501Data) => void,
                  SAMPLE_INVOICE,
                )
              }
            >
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                {invoiceFile ? (
                  <>
                    <FileText className="mb-2 h-10 w-10 text-green-600" />
                    <p className="font-medium">{invoiceFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Commercial Invoice loaded
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
              onDrop={(e) =>
                handleDrop(
                  e,
                  setForm7501File as (f: File | null) => void,
                  setForm7501Data as (d: InvoiceData | Form7501Data) => void,
                  SAMPLE_7501,
                )
              }
            >
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                {form7501File ? (
                  <>
                    <FileText className="mb-2 h-10 w-10 text-green-600" />
                    <p className="font-medium">{form7501File.name}</p>
                    <p className="text-xs text-muted-foreground">
                      CBP Form 7501 loaded
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

          <div className="flex gap-3">
            <Button onClick={loadSample} variant="outline">
              Load Sample Files
            </Button>
            <Button
              onClick={runAudit}
              disabled={!invoiceData || !form7501Data}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Run AI Audit
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: AI Analysis (streaming tool calls)                    */}
      {/* ============================================================ */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                Agent Actions
                {isLoading && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {toolInvocations.length === 0 && isLoading && (
                <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Claude is analyzing your documents...
                  </span>
                </div>
              )}

              {toolInvocations.map((inv, i) => {
                const config = TOOL_CONFIG[inv.toolName];
                if (!config) return null;
                const Icon = config.icon;
                const isDone = inv.state === "result";

                // Findings rendered inline with severity colors
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
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs"
                        >
                          {inv.args.keyword}
                        </Badge>
                      ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Claude's streaming narrative */}
          {assistantMessages.length > 0 &&
            assistantMessages.some((m) =>
              m.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
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
                          .filter((p): p is { type: "text"; text: string } => p.type === "text")
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
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      AI Calculated
                    </p>
                    <p className="text-xl font-bold text-primary">
                      ${dutyResult.totalDuties}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Effective rate: {dutyResult.effectiveDutyRate}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      7501 Declared (Box 44)
                    </p>
                    <p className="text-xl font-bold">
                      ${form7501Data?.totalFees?.toFixed(2) ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Difference</p>
                    <p
                      className={`text-xl font-bold ${
                        Math.abs(
                          parseFloat(dutyResult.totalDuties) -
                            (form7501Data?.totalFees ?? 0),
                        ) < 1
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.abs(
                        parseFloat(dutyResult.totalDuties) -
                          (form7501Data?.totalFees ?? 0),
                      ) < 1
                        ? "Correct"
                        : `$${Math.abs(parseFloat(dutyResult.totalDuties) - (form7501Data?.totalFees ?? 0)).toFixed(2)}`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      General Duty ({dutyResult.generalDuty.rate})
                    </span>
                    <span>${dutyResult.generalDuty.amount}</span>
                  </div>
                  {dutyResult.section301.applicable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Section 301 ({dutyResult.section301.rate})
                      </span>
                      <span>${dutyResult.section301.amount}</span>
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
                    <span>Total</span>
                    <span>${dutyResult.totalDuties}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit findings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Audit Findings</CardTitle>
              <p className="text-xs text-muted-foreground">
                AI-generated cross-checks between Commercial Invoice and Form
                7501
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {findings.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No structured findings recorded.
                </p>
              )}
              {findings.map((finding, i) => (
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
                        <Badge
                          variant={
                            finding.severity === "error"
                              ? "destructive"
                              : finding.severity === "warning"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {finding.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {finding.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {finding.description}
                      </p>
                      {(finding.invoiceValue || finding.form7501Value) && (
                        <div className="mt-2 flex gap-4 text-xs">
                          {finding.invoiceValue && (
                            <span>
                              <span className="text-muted-foreground">
                                Invoice:{" "}
                              </span>
                              <span className="font-medium">
                                {finding.invoiceValue}
                              </span>
                            </span>
                          )}
                          {finding.form7501Value && (
                            <span>
                              <span className="text-muted-foreground">
                                7501:{" "}
                              </span>
                              <span className="font-medium">
                                {finding.form7501Value}
                              </span>
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
              ))}
            </CardContent>
          </Card>

          {/* Claude's narrative summary */}
          {assistantMessages.length > 0 &&
            assistantMessages.some((m) =>
              m.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
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
                          .filter((p): p is { type: "text"; text: string } => p.type === "text")
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
              Download Audit Excel (CSV)
            </Button>
            <Button onClick={resetAudit} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              New Audit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
