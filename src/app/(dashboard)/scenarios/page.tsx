"use client";

import { useState } from "react";
import { BarChart3, Plus, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

interface ScenarioResult {
  product: string;
  htsCode: string;
  quantity: number;
  countries: {
    name: string;
    unitCost: number;
    freight: number;
    dutyRate: number;
    specialRate: number;
    landedPerUnit: number;
    totalLanded: number;
    savings: number;
  }[];
}

export default function ScenariosPage() {
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const loadSampleScenario = () => {
    const qty = 500;
    const calc = (unitCost: number, freight: number, duty: number, special: number) => {
      const dutyAmt = unitCost * duty;
      const specialAmt = unitCost * special;
      const landed = unitCost + freight + dutyAmt + specialAmt;
      return { landedPerUnit: landed, totalLanded: landed * qty };
    };

    const china = calc(18, 0.8, 0.165, 0.075);
    const vietnam = calc(20, 0.9, 0.165, 0);
    const mexico = calc(22, 0.4, 0, 0);

    const baseline = china.totalLanded;

    setResult({
      product: 'Men\'s Hooded Sweatshirt (80% Cotton / 20% Polyester)',
      htsCode: "6110.20.2079",
      quantity: qty,
      countries: [
        {
          name: "China",
          unitCost: 18,
          freight: 0.8,
          dutyRate: 16.5,
          specialRate: 7.5,
          landedPerUnit: china.landedPerUnit,
          totalLanded: china.totalLanded,
          savings: 0,
        },
        {
          name: "Vietnam",
          unitCost: 20,
          freight: 0.9,
          dutyRate: 16.5,
          specialRate: 0,
          landedPerUnit: vietnam.landedPerUnit,
          totalLanded: vietnam.totalLanded,
          savings: baseline - vietnam.totalLanded,
        },
        {
          name: "Mexico (USMCA)",
          unitCost: 22,
          freight: 0.4,
          dutyRate: 0,
          specialRate: 0,
          landedPerUnit: mexico.landedPerUnit,
          totalLanded: mexico.totalLanded,
          savings: baseline - mexico.totalLanded,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scenario Simulator</h1>
          <p className="text-muted-foreground">
            Compare sourcing countries and simulate tariff impacts
          </p>
        </div>
        <Button onClick={loadSampleScenario} className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Load Sample Scenario
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Country Sourcing Comparison</CardTitle>
              <CardDescription>
                {result.product} | HTS {result.htsCode} | Qty: {result.quantity.toLocaleString()} units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    {result.countries.map((c) => (
                      <TableHead key={c.name} className="text-right">
                        {c.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Unit Cost</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right">
                        {formatCurrency(c.unitCost)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Freight/Unit</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right">
                        {formatCurrency(c.freight)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">General Duty</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right">
                        {formatPercent(c.dutyRate)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Section 301</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right">
                        {c.specialRate > 0 ? (
                          <span className="text-orange-600">
                            {formatPercent(c.specialRate)}
                          </span>
                        ) : (
                          <span className="text-green-600">0%</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Landed/Unit</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right font-bold">
                        {formatCurrency(c.landedPerUnit)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">Total Cost</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right font-bold">
                        {formatCurrency(c.totalLanded)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Savings</TableCell>
                    {result.countries.map((c) => (
                      <TableCell key={c.name} className="text-right">
                        {c.savings === 0 ? (
                          <Badge variant="outline">Baseline</Badge>
                        ) : c.savings > 0 ? (
                          <Badge className="bg-green-600">
                            {formatCurrency(c.savings)}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {formatCurrency(c.savings)}
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Recommendation
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Mexico (USMCA) sourcing eliminates all duties, resulting in a landed cost of{" "}
                    {formatCurrency(result.countries[2].landedPerUnit)}/unit despite higher unit cost.
                    Total savings: {formatCurrency(result.countries[2].savings)} vs China baseline.
                    No Section 301 tariff exposure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">No Scenarios Yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a scenario to compare sourcing options and tariff impacts.
            </p>
            <Button onClick={loadSampleScenario} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Load Sample Scenario
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
