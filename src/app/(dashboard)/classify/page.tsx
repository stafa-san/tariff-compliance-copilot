"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ClassificationOutput {
  htsCode: string;
  description: string;
  confidence: number;
  generalDuty: string;
  specialTariffs: { name: string; rate: string }[];
  reasoning: string[];
  alternatives: { code: string; description: string; confidence: number }[];
}

export default function ClassifyPage() {
  const [productDescription, setProductDescription] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationOutput | null>(null);

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Simulated AI classification response for demo
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setResult({
      htsCode: "6110.20.2079",
      description: "Sweaters, pullovers, sweatshirts — of cotton, knitted or crocheted",
      confidence: 92,
      generalDuty: "16.5%",
      specialTariffs:
        countryOfOrigin === "CN"
          ? [{ name: "Section 301 (List 4A)", rate: "7.5%" }]
          : [],
      reasoning: [
        "Product is a knitted/crocheted garment (Chapter 61)",
        "Material composition is cotton-dominant (80% cotton) → Heading 6110",
        "Subheading 6110.20 covers cotton sweaters/pullovers/sweatshirts",
        "Statistical suffix .2079 for other knitted cotton sweaters",
        countryOfOrigin === "CN"
          ? "China origin triggers Section 301 tariff (9903.88.15) at 7.5%"
          : "No additional special tariffs for selected origin country",
      ],
      alternatives: [
        {
          code: "6110.20.2073",
          description: "Sweaters of cotton, knitted, for men/boys",
          confidence: 78,
        },
        {
          code: "6110.30.3059",
          description: "Sweaters of man-made fibers",
          confidence: 15,
        },
      ],
    });

    setLoading(false);
  };

  const loadSampleData = () => {
    setProductDescription(
      "Men's University of Cincinnati \"Bearcats\" Hooded Sweatshirt — 80% Cotton / 20% Polyester — Screen-printed red and black UC Bearcats logo — Adult sizes S-XL — Used as collegiate athletic fan apparel"
    );
    setCountryOfOrigin("CN");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HTS Classification</h1>
        <p className="text-muted-foreground">
          AI-powered product classification into Harmonized Tariff Schedule codes
        </p>
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
                <Button type="submit" disabled={loading || !productDescription || !countryOfOrigin} className="flex-1 gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Classifying...
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

        {/* Result */}
        <div className="space-y-4">
          {loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing product and searching HTS database...
                </p>
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
                      <span className="font-medium">{result.generalDuty}</span>
                    </div>
                    {result.specialTariffs.map((t) => (
                      <div key={t.name} className="flex justify-between text-sm">
                        <span className="text-orange-600">{t.name}</span>
                        <span className="font-medium text-orange-600">+{t.rate}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Reasoning */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Reasoning</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alternative Codes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.alternatives.map((alt) => (
                    <div
                      key={alt.code}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-mono text-sm font-medium">{alt.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {alt.description}
                        </p>
                      </div>
                      <Badge variant="outline">{alt.confidence}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {!loading && !result && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium">No Classification Yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter a product description and country of origin, then click Classify.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
