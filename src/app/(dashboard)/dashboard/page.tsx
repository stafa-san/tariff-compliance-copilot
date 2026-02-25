import {
  Ship,
  AlertTriangle,
  DollarSign,
  FileCheck,
  ArrowRight,
  Search,
  Calculator,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Active Shipments",
    value: "0",
    description: "In progress",
    icon: Ship,
  },
  {
    title: "Pending Reviews",
    value: "0",
    description: "Need attention",
    icon: AlertTriangle,
  },
  {
    title: "Total Duties",
    value: "$0.00",
    description: "This month",
    icon: DollarSign,
  },
  {
    title: "Reports Generated",
    value: "0",
    description: "All time",
    icon: FileCheck,
  },
];

const quickActions = [
  {
    title: "Classify a Product",
    description: "Get AI-powered HTS code classification",
    href: "/classify",
    icon: Search,
  },
  {
    title: "Calculate Duties",
    description: "Compute landed cost and duty breakdown",
    href: "/calculator",
    icon: Calculator,
  },
  {
    title: "Run a Scenario",
    description: "Compare sourcing countries and tariff impacts",
    href: "/scenarios",
    icon: BarChart3,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your import compliance activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={action.href}>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    Get Started <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest classifications, shipments, and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Ship className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Start by classifying a product or creating a shipment.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/classify">
                <Button size="sm" variant="outline">
                  Classify Product
                </Button>
              </Link>
              <Link href="/shipments">
                <Button size="sm">
                  New Shipment
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Data Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="flex items-center gap-4 pt-6">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Test Data
          </Badge>
          <div className="flex-1">
            <p className="text-sm font-medium">Sample: UC Bearcats Hooded Sweatshirts</p>
            <p className="text-xs text-muted-foreground">
              HTS 6110.20.2079 | Origin: China | 500 pcs @ $18/unit | General 16.5% + Section 301 7.5%
            </p>
          </div>
          <Link href="/classify">
            <Button size="sm" variant="outline">
              Try It
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
