"use client";

import { useState, useRef, useCallback } from "react";
import { Calculator, DollarSign, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { MPF_RATE, MPF_MIN, MPF_MAX, HMF_RATE } from "@/lib/utils/constants";
import { searchHts } from "@/lib/services/hts-service";
import { parseDutyRate } from "@/lib/services/hts-service";

interface CostBreakdown {
  productCost: number;
  freight: number;
  insurance: number;
  enteredValue: number;
  generalDuty: number;
  generalDutyRate: number;
  section301: number;
  section301Rate: number;
  mpf: number;
  hmf: number;
  totalDuties: number;
  totalLandedCost: number;
}

export default function CalculatorPage() {
  const [htsCode, setHtsCode] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [freight, setFreight] = useState("");
  const [insurance, setInsurance] = useState("");
  const [dutyRate, setDutyRate] = useState("");
  const [section301Rate, setSection301Rate] = useState("");
  const [shippingMode, setShippingMode] = useState("air");
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [htsLookup, setHtsLookup] = useState<"idle" | "loading" | "found" | "not-found">("idle");
  const [htsDescription, setHtsDescription] = useState("");
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupHtsRate = useCallback(async (code: string) => {
    // Clean the code — strip dots/spaces to get just digits
    const clean = code.replace(/[\s.-]/g, "");
    if (clean.length < 4) {
      setHtsLookup("idle");
      setHtsDescription("");
      return;
    }

    setHtsLookup("loading");

    try {
      // Search USITC with the first 4 digits (heading) for broader match
      const searchTerm = code.replace(/[\s]/g, "");
      const results = await searchHts(searchTerm);

      // Try exact match first, then prefix match
      const exact = results.find((r) => r.htsno.replace(/[\s.-]/g, "") === clean);
      const prefix = results.find((r) => r.htsno.replace(/[\s.-]/g, "").startsWith(clean));
      const match = exact || prefix;

      if (match && match.general) {
        const rate = parseDutyRate(match.general);
        setDutyRate(rate > 0 ? rate.toString() : match.general === "Free" ? "0" : "");
        setHtsDescription(match.description);
        setHtsLookup("found");

        // Check footnotes for Section 301
        const has301 = match.footnotes?.some(
          (fn) => fn.value && /9903\.88/.test(fn.value)
        );
        if (has301 && !section301Rate) {
          setSection301Rate("7.5");
        }
      } else {
        setHtsLookup("not-found");
        setHtsDescription("");
      }
    } catch {
      setHtsLookup("not-found");
      setHtsDescription("");
    }
  }, [section301Rate]);

  const handleHtsChange = (value: string) => {
    setHtsCode(value);
    setHtsLookup("idle");

    // Debounce the lookup
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    lookupTimeout.current = setTimeout(() => {
      lookupHtsRate(value);
    }, 600);
  };

  const handleHtsPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted) {
      // Let the onChange fire first, then trigger immediate lookup
      if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
      setTimeout(() => lookupHtsRate(pasted), 100);
    }
  };

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const productCost = parseFloat(declaredValue) || 0;
    const freightCost = parseFloat(freight) || 0;
    const insuranceCost = parseFloat(insurance) || 0;
    const generalRate = parseFloat(dutyRate) / 100 || 0;
    const s301Rate = parseFloat(section301Rate) / 100 || 0;

    const enteredValue = productCost + freightCost + insuranceCost;
    const generalDuty = productCost * generalRate;
    const section301 = productCost * s301Rate;
    const rawMpf = enteredValue * MPF_RATE;
    const mpf = Math.min(MPF_MAX, Math.max(MPF_MIN, rawMpf));
    const hmf = shippingMode === "ocean" ? enteredValue * HMF_RATE : 0;
    const totalDuties = generalDuty + section301 + mpf + hmf;
    const totalLandedCost = enteredValue + totalDuties;

    setResult({
      productCost,
      freight: freightCost,
      insurance: insuranceCost,
      enteredValue,
      generalDuty,
      generalDutyRate: generalRate * 100,
      section301,
      section301Rate: s301Rate * 100,
      mpf,
      hmf,
      totalDuties,
      totalLandedCost,
    });
  };

  const loadSample = () => {
    setHtsCode("6110.20.2079");
    setDeclaredValue("9000");
    setFreight("0");
    setInsurance("0");
    setDutyRate("16.5");
    setSection301Rate("7.5");
    setShippingMode("air");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Duty & Landed Cost Calculator</h1>
        <p className="text-muted-foreground">
          Calculate total duties, fees, and landed cost for your import shipment
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Shipment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={calculate} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>HTS Code</Label>
                  {htsLookup === "loading" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Looking up rate...
                    </span>
                  )}
                  {htsLookup === "found" && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Rate auto-filled
                    </span>
                  )}
                  {htsLookup === "not-found" && htsCode.length >= 4 && (
                    <span className="text-xs text-muted-foreground">
                      No exact match — enter rate manually
                    </span>
                  )}
                </div>
                <Input
                  placeholder="e.g. 6110.20.2079 — paste to auto-fill duty rate"
                  value={htsCode}
                  onChange={(e) => handleHtsChange(e.target.value)}
                  onPaste={handleHtsPaste}
                />
                {htsDescription && htsLookup === "found" && (
                  <p className="text-xs text-muted-foreground">{htsDescription}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Declared Value (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="9000.00"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Freight (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={freight}
                    onChange={(e) => setFreight(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Insurance (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Mode</Label>
                  <Select value={shippingMode} onValueChange={setShippingMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="ocean">Ocean</SelectItem>
                      <SelectItem value="ground">Ground</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>General Duty Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="16.5"
                    value={dutyRate}
                    onChange={(e) => setDutyRate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section 301 Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="7.5"
                    value={section301Rate}
                    onChange={(e) => setSection301Rate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Calculate
                </Button>
                <Button type="button" variant="outline" onClick={loadSample}>
                  Load Sample
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Row label="Product Cost" value={formatCurrency(result.productCost)} />
                    <Row label="Freight" value={formatCurrency(result.freight)} />
                    <Row label="Insurance" value={formatCurrency(result.insurance)} />
                    <Separator />
                    <Row label="Entered Value" value={formatCurrency(result.enteredValue)} bold />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Row
                      label={`General Duty (${formatPercent(result.generalDutyRate)})`}
                      value={formatCurrency(result.generalDuty)}
                    />
                    {result.section301 > 0 && (
                      <Row
                        label={`Section 301 (${formatPercent(result.section301Rate)})`}
                        value={formatCurrency(result.section301)}
                        highlight
                      />
                    )}
                    <Row
                      label={`MPF (${formatPercent(MPF_RATE * 100)})`}
                      value={formatCurrency(result.mpf)}
                    />
                    {result.hmf > 0 && (
                      <Row
                        label={`HMF (${formatPercent(HMF_RATE * 100)})`}
                        value={formatCurrency(result.hmf)}
                      />
                    )}
                    <Separator />
                    <Row label="Total Duties & Fees" value={formatCurrency(result.totalDuties)} bold />
                  </div>

                  <Separator />

                  <div className="rounded-lg bg-primary/5 p-4">
                    <Row
                      label="Total Landed Cost"
                      value={formatCurrency(result.totalLandedCost)}
                      bold
                      large
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Calculator className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium">No Calculation Yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter shipment details and click Calculate to see the cost breakdown.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  large,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  large?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"} ${
          highlight ? "text-orange-600" : ""
        } ${large ? "text-base" : ""}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${bold ? "font-semibold" : ""} ${
          highlight ? "text-orange-600" : ""
        } ${large ? "text-lg font-bold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
