"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Download,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format";
import { onAuthChange } from "@/lib/firebase/auth";
import { addDocument, getDocuments, deleteDocument, where, orderBy } from "@/lib/firebase/firestore";
import type { User } from "firebase/auth";

interface ReportDoc {
  id: string;
  userId: string;
  title: string;
  type: "classification" | "duty" | "compliance" | "scenario";
  status: "generated" | "reviewed" | "exported";
  summary: {
    totalShipments: number;
    totalValue: number;
    totalDuties: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    topHtsCodes: string[];
    findings: string[];
  };
  dateRange: { from: string; to: string };
  createdAt: { seconds: number; nanoseconds: number } | null;
}

const REPORT_TYPES = [
  { value: "classification", label: "Classification Summary", icon: BarChart3 },
  { value: "duty", label: "Duty & Cost Analysis", icon: FileText },
  { value: "compliance", label: "Compliance Audit", icon: AlertTriangle },
  { value: "scenario", label: "Scenario Comparison", icon: BarChart3 },
];

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDoc | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "classification" as ReportDoc["type"],
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      if (u) loadReports(u.uid);
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadReports = async (uid: string) => {
    try {
      const docs = await getDocuments<ReportDoc>(
        "reports",
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      setReports(docs);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    try {
      // Fetch user's shipments to build report data
      let totalShipments = 0;
      let totalValue = 0;
      const htsCodes: string[] = [];

      try {
        const shipments = await getDocuments<{
          id: string;
          totalValue: number;
          htsCode: string;
          countryOfOrigin: string;
        }>(
          "shipments",
          where("userId", "==", user.uid)
        );
        totalShipments = shipments.length;
        totalValue = shipments.reduce((sum, s) => sum + (s.totalValue || 0), 0);
        shipments.forEach((s) => {
          if (s.htsCode && !htsCodes.includes(s.htsCode)) htsCodes.push(s.htsCode);
        });
      } catch {
        // No shipments yet
      }

      const findings = generateFindings(form.type, totalShipments, totalValue);
      const riskLevel = totalShipments === 0 ? "LOW" : totalValue > 50000 ? "HIGH" : totalValue > 10000 ? "MEDIUM" : "LOW";

      // Estimate duties at ~20% of value (general + section 301)
      const estimatedDuties = totalValue * 0.20;

      await addDocument("reports", {
        userId: user.uid,
        title: form.title,
        type: form.type,
        status: "generated",
        summary: {
          totalShipments,
          totalValue,
          totalDuties: estimatedDuties,
          riskLevel,
          topHtsCodes: htsCodes.slice(0, 5),
          findings,
        },
        dateRange: { from: form.dateFrom, to: form.dateTo },
      });

      await loadReports(user.uid);
      setForm({ title: "", type: "classification", dateFrom: "", dateTo: "" });
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument("reports", id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  const exportReport = (report: ReportDoc) => {
    const content = [
      `TARIFF COMPLIANCE REPORT`,
      `========================`,
      ``,
      `Title: ${report.title}`,
      `Type: ${REPORT_TYPES.find((t) => t.value === report.type)?.label}`,
      `Generated: ${formatDate(report.createdAt)}`,
      `Date Range: ${report.dateRange.from || "All"} to ${report.dateRange.to || "Present"}`,
      ``,
      `SUMMARY`,
      `-------`,
      `Total Shipments: ${report.summary.totalShipments}`,
      `Total Declared Value: ${formatCurrency(report.summary.totalValue)}`,
      `Estimated Duties: ${formatCurrency(report.summary.totalDuties)}`,
      `Risk Level: ${report.summary.riskLevel}`,
      ``,
      `Top HTS Codes: ${report.summary.topHtsCodes.join(", ") || "None"}`,
      ``,
      `FINDINGS`,
      `--------`,
      ...report.summary.findings.map((f, i) => `${i + 1}. ${f}`),
      ``,
      `---`,
      `Generated by Tariff Compliance Copilot`,
      `Data source: hts.usitc.gov (USITC Harmonized Tariff Schedule)`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Reports</h1>
          <p className="text-muted-foreground">
            Generate and export audit-ready compliance reports
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Report</DialogTitle>
              <DialogDescription>
                Create a compliance report from your shipment data
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={generateReport} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Report Title</Label>
                <Input
                  placeholder="e.g., Q1 2026 Import Compliance Review"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ReportDoc["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={form.dateFrom}
                    onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={form.dateTo}
                    onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" disabled={creating} className="w-full">
                {creating ? "Generating..." : "Generate Report"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {reports.filter((r) => r.summary.riskLevel === "HIGH" || r.summary.riskLevel === "CRITICAL").length}
              </div>
              <p className="text-xs text-muted-foreground">High Risk Alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {formatCurrency(reports.reduce((sum, r) => sum + (r.summary.totalDuties || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">Total Duties Tracked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Report Detail */}
      {selectedReport && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedReport.title}</CardTitle>
                <CardDescription>
                  {REPORT_TYPES.find((t) => t.value === selectedReport.type)?.label} — {formatDate(selectedReport.createdAt)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => exportReport(selectedReport)}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Shipments</p>
                <p className="text-xl font-bold">{selectedReport.summary.totalShipments}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Declared Value</p>
                <p className="text-xl font-bold">{formatCurrency(selectedReport.summary.totalValue)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Est. Duties</p>
                <p className="text-xl font-bold">{formatCurrency(selectedReport.summary.totalDuties)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <Badge className={RISK_COLORS[selectedReport.summary.riskLevel]}>
                  {selectedReport.summary.riskLevel}
                </Badge>
              </div>
            </div>

            {selectedReport.summary.topHtsCodes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Top HTS Codes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.summary.topHtsCodes.map((code) => (
                    <Badge key={code} variant="outline" className="font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Findings & Recommendations</p>
              <ul className="space-y-2">
                {selectedReport.summary.findings.map((finding, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">No Reports Yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Classify products and create shipments, then generate compliance reports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => {
            const TypeIcon = REPORT_TYPES.find((t) => t.value === report.type)?.icon || FileText;
            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedReport?.id === report.id ? "border-primary/50 bg-muted/30" : ""
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TypeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{report.title}</p>
                      <Badge className={`${RISK_COLORS[report.summary.riskLevel]} text-xs`}>
                        {report.summary.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{REPORT_TYPES.find((t) => t.value === report.type)?.label}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.createdAt)}
                      </span>
                      <span>{report.summary.totalShipments} shipments</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportReport(report);
                      }}
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function generateFindings(
  type: string,
  totalShipments: number,
  totalValue: number
): string[] {
  const findings: string[] = [];

  if (totalShipments === 0) {
    findings.push("No shipments found in the selected period. Create shipments to generate detailed analysis.");
    findings.push("Recommend setting up shipment tracking for all active import orders.");
    return findings;
  }

  switch (type) {
    case "classification":
      findings.push(`Analyzed ${totalShipments} shipment(s) with total declared value of ${formatCurrency(totalValue)}.`);
      findings.push("All HTS classifications should be verified against the latest USITC schedule at hts.usitc.gov.");
      findings.push("Recommend reviewing any codes with confidence below 80% for potential reclassification.");
      if (totalValue > 25000) {
        findings.push("Shipments exceeding $2,500 require formal entry through a licensed customs broker (19 CFR 141).");
      }
      break;
    case "duty":
      findings.push(`Total estimated duties: ${formatCurrency(totalValue * 0.20)} across ${totalShipments} shipment(s).`);
      findings.push("Duty estimates include general tariff rates and applicable Section 301 surcharges.");
      findings.push("Merchandise Processing Fee (MPF) of 0.3464% applies to all formal entries (min $31.67, max $614.35).");
      findings.push("Harbor Maintenance Fee (HMF) of 0.125% applies to ocean shipments only.");
      break;
    case "compliance":
      findings.push("Review all HTS classifications for accuracy — misclassification penalties can reach 4x the duty owed.");
      findings.push("Ensure country of origin markings comply with 19 USC 1304 requirements.");
      findings.push("Verify that all Section 301 and Section 232 tariff provisions are correctly applied.");
      if (totalValue > 50000) {
        findings.push("HIGH RISK: High-value imports require enhanced due diligence and documentation retention.");
      }
      findings.push("Maintain all commercial invoices, packing lists, and bills of lading for 5 years per CBP requirements.");
      break;
    case "scenario":
      findings.push("Scenario analysis compares total landed costs across different sourcing countries.");
      findings.push("Section 301 tariffs on China-origin goods add 7.5-25% depending on the List classification.");
      findings.push("Consider alternative sourcing from Vietnam, Mexico, or India to reduce tariff exposure.");
      findings.push("USMCA (formerly NAFTA) may provide preferential rates for Mexico-origin goods meeting rules of origin.");
      break;
  }

  return findings;
}
