import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Calculator,
  BarChart3,
  FileText,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "HTS Classification",
    description:
      "AI-powered product classification into 10-digit HTS codes with confidence scoring and chain-of-thought reasoning.",
  },
  {
    icon: Calculator,
    title: "Duty Calculator",
    description:
      "Calculate total landed costs including general duties, Section 301/232 tariffs, AD/CVD, MPF, and HMF.",
  },
  {
    icon: AlertTriangle,
    title: "Risk Scoring",
    description:
      "Compliance risk assessment (0-100) with categorized alerts for FDA, USDA, EPA, and FCC requirements.",
  },
  {
    icon: BarChart3,
    title: "Scenario Simulator",
    description:
      'Interactive "what-if" analysis. Compare sourcing countries, simulate tariff changes, and optimize supply chain costs.',
  },
  {
    icon: FileText,
    title: "7501 Assistant",
    description:
      "Guided CBP Form 7501 (Entry Summary) field mapping with validation and documentation checklists.",
  },
  {
    icon: Shield,
    title: "Compliance Reports",
    description:
      "Generate audit-ready compliance reports with HTS reasoning, duty breakdowns, and regulatory requirements.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Tariff Compliance Copilot</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
            AI-Powered Import Compliance
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Navigate U.S. Tariffs
            <br />
            <span className="text-primary">with Confidence</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Classify goods into HTS codes, calculate duties, score compliance
            risks, and simulate tariff scenarios — all powered by AI. Built for
            small-to-mid-size importers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">
              Everything You Need for Import Compliance
            </h2>
            <p className="mt-2 text-muted-foreground">
              From HTS classification to landed cost analysis — one intelligent
              platform.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border bg-background transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <feature.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold">
            Ready to Simplify Your Imports?
          </h2>
          <p className="text-muted-foreground">
            Stop overpaying duties. Stop worrying about misclassification. Let AI
            handle the complexity.
          </p>
          <Link href="/register">
            <Button size="lg" className="mt-4 gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Tariff Compliance Copilot</span>
          </div>
          <p>Built with Next.js, Firebase, Claude AI, and shadcn/ui</p>
        </div>
      </footer>
    </div>
  );
}
