"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles, ExternalLink, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SAMPLE_COUNTRIES = [
  { value: "CN", label: "China" },
  { value: "VN", label: "Vietnam" },
  { value: "MX", label: "Mexico" },
  { value: "IN", label: "India" },
  { value: "BD", label: "Bangladesh" },
  { value: "DE", label: "Germany" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "TW", label: "Taiwan" },
  { value: "TH", label: "Thailand" },
];

interface ClassificationResult {
  htsCode: string;
  description: string;
  confidence: number;
  generalRate: string;
  generalDutyRate: number;
  specialRate: string;
  otherRate: string;
  units: string[];
  specialTariffs: {
    name: string;
    rate: number;
    authority: string;
    htsProvision: string;
  }[];
  reasoning: string[];
  alternatives: {
    htsCode: string;
    description: string;
    confidence: number;
    generalRate: string;
  }[];
  countryOfOrigin: string;
  countryName: string;
}

interface ApiResponse {
  classification: ClassificationResult | null;
  message?: string;
  keywords: string[];
  totalResults?: number;
}

export default function ClassifyPage() {
  const [productDescription, setProductDescription] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [meta, setMeta] = useState<{ keywords: string[]; totalResults: number } | null>(null);
  const [error, setError] = useState("");

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setMeta(null);
    setError("");

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDescription, countryOfOrigin }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.message || "Classification failed. Please try again.");
        return;
      }

      if (!data.classification) {
        setError(data.message || "No matching HTS codes found. Try a more specific description.");
        setMeta({ keywords: data.keywords, totalResults: 0 });
        return;
      }

      setResult(data.classification);
      setMeta({ keywords: data.keywords, totalResults: data.totalResults || 0 });
    } catch {
      setError("Failed to connect to classification service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    setProductDescription(
      "Men's University of Cincinnati \"Bearcats\" Hooded Sweatshirt — 80% Cotton / 20% Polyester — Screen-printed red and black UC Bearcats logo — Adult sizes S-XL — Used as collegiate athletic fan apparel"
    );
    setCountryOfOrigin("CN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HTS Classification</h1>
          <p className="text-muted-foreground">
            AI-powered product classification using real USITC data
          </p>
        </div>
        <a
          href="https://hts.usitc.gov"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Badge variant="outline" className="gap-1.5 py-1">
            <Database className="h-3 w-3" />
            Live USITC Data
            <ExternalLink className="h-3 w-3" />
          </Badge>
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Classify Product
            </CardTitle>
            <CardDescription>
              Describe your product and select the country of origin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClassify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the product in detail: what it is, what it's made of, what it's used for..."
                  rows={5}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country of Origin</Label>
                <Select
                  value={countryOfOrigin}
                  onValueChange={setCountryOfOrigin}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading || !productDescription || !countryOfOrigin}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching USITC...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Classify
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={loadSampleData}>
                  Load Sample
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Searching USITC Harmonized Tariff Schedule...
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Querying hts.usitc.gov for matching codes
                </p>
              </CardContent>
            </Card>
          )}

          {error && !loading && (
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="py-6">
                <p className="text-sm text-destructive">{error}</p>
                {meta && meta.keywords.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Keywords searched: {meta.keywords.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Primary Classification */}
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Classification Result</CardTitle>
                    <Badge
                      variant={result.confidence >= 80 ? "default" : "secondary"}
                      className={
                        result.confidence >= 80
                          ? "bg-green-600"
                          : result.confidence >= 60
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }
                    >
                      {result.confidence}% confidence
                    </Badge>
                  </div>
                  {meta && (
                    <CardDescription>
                      Found {meta.totalResults} results from USITC database
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-mono text-2xl font-bold text-primary">
                      {result.htsCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{result.confidence}%</span>
                    </div>
                    <Progress value={result.confidence} />
                  </div>

                  <div className="rounded-lg bg-muted p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>General Duty Rate</span>
                      <span className="font-medium">{result.generalRate}</span>
                    </div>
                    {result.specialRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Special Programs</span>
                        <span className="text-xs text-blue-600 max-w-50 truncate">
                          {result.specialRate}
                        </span>
                      </div>
                    )}
                    {result.otherRate && (
                      <div className="flex justify-between text-sm">
                        <span>Column 2 Rate</span>
                        <span className="font-medium">{result.otherRate}</span>
                      </div>
                    )}
                    {result.specialTariffs.map((t) => (
                      <div key={t.name} className="flex justify-between text-sm">
                        <span className="text-orange-600">{t.name}</span>
                        <span className="font-medium text-orange-600">
                          +{t.rate}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {result.units && result.units.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Units: {result.units.join(", ")}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Origin: {result.countryName} ({result.countryOfOrigin})
                  </div>
                </CardContent>
              </Card>

              {/* Reasoning */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Classification Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {result.reasoning.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Alternatives */}
              {result.alternatives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alternative Codes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.alternatives.map((alt) => (
                      <div
                        key={alt.htsCode}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-medium">{alt.htsCode}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {alt.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rate: {alt.generalRate}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {alt.confidence}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Search Meta */}
              {meta && (
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Keywords: {meta.keywords.join(", ")}</span>
                  <a
                    href="https://hts.usitc.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    Source: hts.usitc.gov
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </>
          )}

          {!loading && !result && !error && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium">No Classification Yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter a product description and country of origin, then click
                  Classify to search the USITC database.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
