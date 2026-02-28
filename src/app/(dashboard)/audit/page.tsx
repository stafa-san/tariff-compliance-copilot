"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils/format";
import { searchAndParseHts, parseDutyRate } from "@/lib/services/hts-service";

// ── Types ─────────────────────────────────────────────
interface ParsedInvoice {
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  importerName: string;
  importerAddress: string;
  countryOfOrigin: string;
  countryOfExport: string;
  description: string;
  hsCode: string;
  quantity: number;
  unitOfMeasure: string;
  weight: string;
  unitValue: number;
  totalValue: number;
  currency: string;
  packages: number;
  awbNumber: string;
  exportDate: string;
  paymentMethod: string;
  incoterm: string;
}

interface Parsed7501 {
  entryNumber: string;
  entryType: string;
  summaryDate: string;
  portCode: string;
  entryDate: string;
  importDate: string;
  countryOfOrigin: string;
  importingCarrier: string;
  modeOfTransport: string;
  blNumber: string;
  manufacturerId: string;
  foreignPort: string;
  usPort: string;
  consigneeName: string;
  consigneeAddress: string;
  importerName: string;
  importerAddress: string;
  htsCode: string;
  adCvdCode: string;
  grossWeight: string;
  manifestQty: string;
  netQuantity: string;
  description: string;
  enteredValue: number;
  htsRate: string;
  adCvdRate: string;
  dutyAmount: number;
  totalEnteredValue: number;
  totalDuty: number;
  totalTax: number;
  totalOther: number;
  totalTotal: number;
  brokerName: string;
}

interface AuditFinding {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
  invoiceValue?: string;
  form7501Value?: string;
  suggestedFix?: string;
}

interface AuditResult {
  findings: AuditFinding[];
  riskScore: number;
  htsValidation: {
    codeValid: boolean;
    expectedRate: string;
    actualRate: string;
    rateMatch: boolean;
  } | null;
  dutyCheck: {
    expectedDuty: number;
    actualDuty: number;
    difference: number;
    correct: boolean;
  } | null;
  excelData: Record<string, string>[];
}

// ── Steps ─────────────────────────────────────────────
const STEPS = [
  { id: 1, title: "Upload Documents", description: "Upload Commercial Invoice and CBP Form 7501" },
  { id: 2, title: "AI Analysis", description: "Agent extracts, cross-checks, and validates" },
  { id: 3, title: "Review & Export", description: "Review findings and download audit report" },
];

export default function AuditPage() {
  const [step, setStep] = useState(1);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [form7501File, setForm7501File] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Sample parsed data (simulates PDF extraction — in production, use Claude API for extraction)
  const sampleInvoice: ParsedInvoice = {
    shipperName: "Guangzhou Elite Apparel Manufacturing Co., Ltd.",
    shipperAddress: "No. 88 Textile Industrial Road, Baiyun District, Guangzhou, Guangdong 510440 China",
    consigneeName: "University of Cincinnati Bookstore",
    consigneeAddress: "2600 Clifton Ave Cincinnati, OH 45221",
    importerName: "University of Cincinnati Office of Procurement Services",
    importerAddress: "2650 McMicken Circle, Cincinnati, OH 45221",
    countryOfOrigin: "China",
    countryOfExport: "China",
    description: "Men's University of Cincinnati \"Bearcats\" Hooded Sweatshirt — 80% Cotton / 20% Polyester — Screen-printed red and black UC Bearcats logo — Adult sizes S-XL",
    hsCode: "6110.20.2079",
    quantity: 500,
    unitOfMeasure: "Pieces",
    weight: "350 kg",
    unitValue: 18.00,
    totalValue: 9000.00,
    currency: "USD",
    packages: 5,
    awbNumber: "CN-UC-2025-01",
    exportDate: "May 4, 2025",
    paymentMethod: "T/T",
    incoterm: "F.O.B.",
  };

  const sample7501: Parsed7501 = {
    entryNumber: "ABC123",
    entryType: "01",
    summaryDate: "05/08/2025",
    portCode: "1701",
    entryDate: "05/07/2025",
    importDate: "05/07/2025",
    countryOfOrigin: "CN",
    importingCarrier: "FedEx Express",
    modeOfTransport: "Air",
    blNumber: "CN-UC-2025-01",
    manufacturerId: "CNELITEAPPARELS10440",
    foreignPort: "Guangzhou, China",
    usPort: "Cincinnati, OH",
    consigneeName: "University of Cincinnati Bookstore",
    consigneeAddress: "2600 Clifton Ave, Cincinnati, OH 45221",
    importerName: "University of Cincinnati Office of Procurement Services",
    importerAddress: "2650 McMicken Circle, Cincinnati, OH 45221",
    htsCode: "6110.20.2079",
    adCvdCode: "9903.88.15",
    grossWeight: "375 kg",
    manifestQty: "0",
    netQuantity: "500 PCS",
    description: "Men's UC Bearcats Hooded Sweatshirt",
    enteredValue: 9000,
    htsRate: "16.5%",
    adCvdRate: "7.5%",
    dutyAmount: 1485.00,
    totalEnteredValue: 11191.18,
    totalDuty: 2160,
    totalTax: 0,
    totalOther: 31.18,
    totalTotal: 2191.18,
    brokerName: "FedEx Express",
  };

  const runAudit = async () => {
    setProcessing(true);
    setStep(2);
    setProgress(0);

    const findings: AuditFinding[] = [];
    const invoice = sampleInvoice;
    const form = sample7501;

    // Step 1: Cross-check invoice vs 7501
    setProgressText("Extracting data from Commercial Invoice...");
    setProgress(10);
    await delay(800);

    setProgressText("Extracting data from CBP Form 7501...");
    setProgress(25);
    await delay(800);

    // Step 2: Cross-check fields
    setProgressText("Cross-checking invoice against Form 7501...");
    setProgress(40);
    await delay(600);

    // Compare HTS codes
    const invoiceHts = invoice.hsCode.replace(/[\s.]/g, "");
    const formHts = form.htsCode.replace(/[\s.]/g, "");
    if (invoiceHts !== formHts) {
      findings.push({
        field: "HTS Code",
        severity: "error",
        message: "HTS code mismatch between Commercial Invoice and Form 7501",
        invoiceValue: invoice.hsCode,
        form7501Value: form.htsCode,
        suggestedFix: "Verify correct HTS classification at hts.usitc.gov",
      });
    } else {
      findings.push({
        field: "HTS Code",
        severity: "info",
        message: "HTS codes match between Invoice and 7501",
        invoiceValue: invoice.hsCode,
        form7501Value: form.htsCode,
      });
    }

    // Compare values
    if (invoice.totalValue !== form.enteredValue) {
      findings.push({
        field: "Entered Value",
        severity: "error",
        message: "Total value mismatch between invoice and 7501",
        invoiceValue: formatCurrency(invoice.totalValue),
        form7501Value: formatCurrency(form.enteredValue),
        suggestedFix: "Reconcile declared value with invoice total",
      });
    } else {
      findings.push({
        field: "Entered Value",
        severity: "info",
        message: "Entered value matches invoice total",
        invoiceValue: formatCurrency(invoice.totalValue),
        form7501Value: formatCurrency(form.enteredValue),
      });
    }

    // Compare quantities
    const formQty = parseInt(form.netQuantity) || 0;
    if (invoice.quantity !== formQty) {
      findings.push({
        field: "Quantity",
        severity: "warning",
        message: "Quantity format differs — verify units match",
        invoiceValue: `${invoice.quantity} ${invoice.unitOfMeasure}`,
        form7501Value: form.netQuantity,
      });
    }

    // Step 3: Validate HTS code against USITC
    setProgressText("Validating HTS code against USITC database...");
    setProgress(60);
    await delay(600);

    let htsValidation = null;
    try {
      const htsResults = await searchAndParseHts(form.htsCode);
      const exactMatch = htsResults.find(
        (r) => r.htsCode.replace(/[\s.]/g, "") === formHts
      );
      const parentMatch = htsResults.find(
        (r) => formHts.startsWith(r.htsCode.replace(/[\s.]/g, "")) && r.generalRate
      );
      const match = exactMatch || parentMatch;

      if (match) {
        const expectedRate = match.generalRate;
        const rateMatch = form.htsRate.replace(/\s/g, "") === expectedRate.replace(/\s/g, "");
        htsValidation = {
          codeValid: true,
          expectedRate,
          actualRate: form.htsRate,
          rateMatch,
        };

        if (!rateMatch) {
          findings.push({
            field: "Duty Rate",
            severity: "error",
            message: `HTSUS rate on 7501 (${form.htsRate}) does not match USITC database rate (${expectedRate})`,
            invoiceValue: expectedRate,
            form7501Value: form.htsRate,
            suggestedFix: `Update 7501 Box 37A to ${expectedRate}`,
          });
        } else {
          findings.push({
            field: "Duty Rate",
            severity: "info",
            message: `General duty rate ${form.htsRate} verified against USITC database`,
          });
        }
      } else {
        htsValidation = {
          codeValid: false,
          expectedRate: "Unknown",
          actualRate: form.htsRate,
          rateMatch: false,
        };
        findings.push({
          field: "HTS Code",
          severity: "warning",
          message: "Could not verify HTS code against USITC — code may be outdated or incorrect",
          form7501Value: form.htsCode,
          suggestedFix: "Look up code at hts.usitc.gov to verify",
        });
      }
    } catch {
      findings.push({
        field: "HTS Validation",
        severity: "warning",
        message: "Unable to connect to USITC database for verification",
      });
    }

    // Step 4: Duty calculation verification
    setProgressText("Verifying duty calculations...");
    setProgress(75);
    await delay(600);

    const generalRate = parseDutyRate(form.htsRate);
    const expectedGeneralDuty = form.enteredValue * (generalRate / 100);
    const section301Rate = parseDutyRate(form.adCvdRate);
    const expectedSection301 = form.enteredValue * (section301Rate / 100);
    const mpfRate = 0.003464;
    const expectedMpf = Math.min(614.35, Math.max(31.67, form.enteredValue * mpfRate));
    const expectedTotalDuty = expectedGeneralDuty + expectedSection301 + expectedMpf;

    const dutyDiff = Math.abs(form.totalTotal - expectedTotalDuty);
    const dutyCheck = {
      expectedDuty: expectedTotalDuty,
      actualDuty: form.totalTotal,
      difference: dutyDiff,
      correct: dutyDiff < 1,
    };

    if (!dutyCheck.correct) {
      findings.push({
        field: "Total Duties",
        severity: "error",
        message: `Total duty calculation off by ${formatCurrency(dutyDiff)}`,
        invoiceValue: formatCurrency(expectedTotalDuty) + " (calculated)",
        form7501Value: formatCurrency(form.totalTotal) + " (on 7501)",
        suggestedFix: `Verify: General ${formatCurrency(expectedGeneralDuty)} + Section 301 ${formatCurrency(expectedSection301)} + MPF ${formatCurrency(expectedMpf)}`,
      });
    } else {
      findings.push({
        field: "Total Duties",
        severity: "info",
        message: `Total duties ${formatCurrency(form.totalTotal)} verified — calculation is correct`,
      });
    }

    // Check Section 301 for China
    if (form.countryOfOrigin === "CN" && !form.adCvdCode) {
      findings.push({
        field: "Section 301",
        severity: "error",
        message: "China origin but no Section 301 tariff code (9903.88.15) applied",
        suggestedFix: "Add Section 301 List 4A (9903.88.15) at 7.5% to 7501",
      });
    } else if (form.countryOfOrigin === "CN" && form.adCvdCode) {
      findings.push({
        field: "Section 301",
        severity: "info",
        message: `Section 301 code ${form.adCvdCode} correctly applied for China origin`,
      });
    }

    // Country of origin check
    if (invoice.countryOfOrigin.toLowerCase().includes("china") && form.countryOfOrigin !== "CN") {
      findings.push({
        field: "Country of Origin",
        severity: "error",
        message: "Country of origin mismatch",
        invoiceValue: invoice.countryOfOrigin,
        form7501Value: form.countryOfOrigin,
      });
    }

    // Step 5: Build Excel data
    setProgressText("Generating audit report...");
    setProgress(90);
    await delay(500);

    const notes = findings
      .filter((f) => f.severity !== "info")
      .map((f) => `[${f.severity.toUpperCase()}] ${f.field}: ${f.message}`)
      .join(" | ");

    const excelData = [
      {
        "Broker Name (Box 42)": form.brokerName,
        "Entry Number (Box 1)": form.entryNumber,
        "Entry Date (Box 7)": form.entryDate,
        "Country of Origin (Box 10)": form.countryOfOrigin,
        "Importer of Record Name and Address (Box 26)": `${form.importerName}, ${form.importerAddress}`,
        "Ultimate Consignee Name and Address (Box 25)": `${form.consigneeName}, ${form.consigneeAddress}`,
        "HTSUS Number (Box 29)": form.htsCode,
        "Net Quantity in HTSUS Units (Box 31)": form.netQuantity,
        "Entered Value (Box 32)": form.enteredValue.toString(),
        "HTSUS Rate (Box 33)": form.htsRate,
        "Duty and I.R. Tax (Box 34)": form.dutyAmount.toString(),
        "Total Entered Value (Box 35)": form.totalEnteredValue.toString(),
        "Duty (Box 37)": form.totalDuty.toString(),
        "Notes/Insights": notes || "No issues found — all fields verified.",
      },
    ];

    const riskScore = findings.filter((f) => f.severity === "error").length * 25
      + findings.filter((f) => f.severity === "warning").length * 10;

    setProgress(100);
    setProgressText("Audit complete!");
    await delay(400);

    setAuditResult({
      findings,
      riskScore: Math.min(100, riskScore),
      htsValidation,
      dutyCheck,
      excelData,
    });

    setProcessing(false);
    setStep(3);
  };

  const exportExcel = () => {
    if (!auditResult) return;

    const headers = Object.keys(auditResult.excelData[0]);
    const rows = auditResult.excelData.map((row) =>
      headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI_Audit_Report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileDrop = useCallback(
    (type: "invoice" | "7501") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (type === "invoice") setInvoiceFile(file);
        else setForm7501File(file);
      }
    },
    []
  );

  const loadSampleFiles = () => {
    setInvoiceFile(new File([""], "Commercial_Invoice_Bearcats.pdf", { type: "application/pdf" }));
    setForm7501File(new File([""], "CBP_Form_7501_Bearcats.pdf", { type: "application/pdf" }));
  };

  const resetAudit = () => {
    setStep(1);
    setInvoiceFile(null);
    setForm7501File(null);
    setAuditResult(null);
    setProgress(0);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Audit Agent</h1>
          <p className="text-muted-foreground">
            Upload trade documents, let AI cross-check and validate compliance
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1">
          <Shield className="h-3 w-3" />
          Powered by Claude AI
        </Badge>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                step > s.id
                  ? "bg-green-600 text-white"
                  : step === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className={`text-xs font-medium truncate ${step >= s.id ? "" : "text-muted-foreground"}`}>
                {s.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">{s.description}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`hidden sm:block h-px flex-1 ${step > s.id ? "bg-green-600" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Commercial Invoice Upload */}
          <Card className={invoiceFile ? "border-green-300 dark:border-green-800" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Commercial Invoice
                {invoiceFile && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
              <CardDescription>
                The supplier&apos;s invoice with product details, quantities, and values
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceFile ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{invoiceFile.name}</p>
                    <p className="text-xs text-muted-foreground">Ready for analysis</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInvoiceFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop PDF here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Commercial Invoice (PDF)</p>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileDrop("invoice")} />
                </label>
              )}
            </CardContent>
          </Card>

          {/* CBP Form 7501 Upload */}
          <Card className={form7501File ? "border-green-300 dark:border-green-800" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-5 w-5" />
                CBP Form 7501
                {form7501File && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
              <CardDescription>
                Entry Summary filed by the customs broker — duties, HTS codes, values
              </CardDescription>
            </CardHeader>
            <CardContent>
              {form7501File ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{form7501File.name}</p>
                    <p className="text-xs text-muted-foreground">Ready for analysis</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setForm7501File(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop PDF here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">CBP Form 7501 (PDF)</p>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileDrop("7501")} />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="lg:col-span-2 flex gap-3">
            <Button
              onClick={runAudit}
              disabled={!invoiceFile || !form7501File}
              className="gap-2 flex-1 sm:flex-none"
              size="lg"
            >
              <Shield className="h-4 w-4" />
              Run AI Audit
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={loadSampleFiles} size="lg">
              Load Sample Files
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && processing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="font-medium mb-2">{progressText}</p>
            <div className="w-full max-w-md">
              <Progress value={progress} className="mb-2" />
              <p className="text-xs text-center text-muted-foreground">{progress}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && auditResult && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{auditResult.findings.length}</div>
                <p className="text-xs text-muted-foreground">Total Checks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {auditResult.findings.filter((f) => f.severity === "error").length}
                </div>
                <p className="text-xs text-muted-foreground">Errors Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {auditResult.findings.filter((f) => f.severity === "warning").length}
                </div>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Badge
                  className={`text-sm ${
                    auditResult.riskScore > 50
                      ? "bg-red-600"
                      : auditResult.riskScore > 20
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                >
                  Risk: {auditResult.riskScore}/100
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Compliance Risk</p>
              </CardContent>
            </Card>
          </div>

          {/* Duty Verification */}
          {auditResult.dutyCheck && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Duty Calculation Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Calculated Duty</p>
                    <p className="text-lg font-bold">{formatCurrency(auditResult.dutyCheck.expectedDuty)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">7501 Duty (Box 44)</p>
                    <p className="text-lg font-bold">{formatCurrency(auditResult.dutyCheck.actualDuty)}</p>
                  </div>
                  <div className={`rounded-lg border p-3 ${auditResult.dutyCheck.correct ? "border-green-300" : "border-red-300"}`}>
                    <p className="text-xs text-muted-foreground">Difference</p>
                    <p className={`text-lg font-bold ${auditResult.dutyCheck.correct ? "text-green-600" : "text-red-600"}`}>
                      {auditResult.dutyCheck.correct ? "Correct" : formatCurrency(auditResult.dutyCheck.difference)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Findings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Findings</CardTitle>
              <CardDescription>
                AI-generated cross-checks between Commercial Invoice and Form 7501
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditResult.findings.map((finding, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    finding.severity === "error"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                      : finding.severity === "warning"
                      ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
                      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {finding.severity === "error" ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                    ) : finding.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{finding.field}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            finding.severity === "error"
                              ? "text-red-600 border-red-300"
                              : finding.severity === "warning"
                              ? "text-yellow-600 border-yellow-300"
                              : "text-green-600 border-green-300"
                          }`}
                        >
                          {finding.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{finding.message}</p>
                      {(finding.invoiceValue || finding.form7501Value) && (
                        <div className="flex gap-4 mt-2 text-xs">
                          {finding.invoiceValue && (
                            <span>
                              <span className="text-muted-foreground">Invoice: </span>
                              <span className="font-mono">{finding.invoiceValue}</span>
                            </span>
                          )}
                          {finding.form7501Value && (
                            <span>
                              <span className="text-muted-foreground">7501: </span>
                              <span className="font-mono">{finding.form7501Value}</span>
                            </span>
                          )}
                        </div>
                      )}
                      {finding.suggestedFix && (
                        <p className="text-xs text-primary mt-1">Fix: {finding.suggestedFix}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={exportExcel} className="gap-2" size="lg">
              <Download className="h-4 w-4" />
              Download Audit Excel (CSV)
            </Button>
            <Button variant="outline" onClick={resetAudit} className="gap-2" size="lg">
              <ArrowLeft className="h-4 w-4" />
              New Audit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
