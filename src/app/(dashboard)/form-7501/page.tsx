"use client";

import { ClipboardList, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSections = [
  {
    id: "header",
    label: "Header (1-7)",
    fields: [
      { num: "1", name: "Filer Code/Entry Number", desc: "Your customs broker filer code + entry number", required: true },
      { num: "2", name: "Entry Type", desc: "01=Consumption, 03=AD/CVD, 11=Informal, etc.", required: true },
      { num: "3", name: "Summary Date", desc: "Date entry summary is filed with CBP", required: true },
      { num: "4", name: "Surety Number", desc: "3-digit code for customs bond surety company", required: true },
      { num: "5", name: "Bond Type", desc: "9=Single Transaction Bond, 8=Continuous Bond", required: true },
      { num: "6", name: "Port Code", desc: "4-digit port of entry code (e.g., 1701=Cincinnati)", required: true },
      { num: "7", name: "Entry Date", desc: "Date goods arrive or are released by CBP", required: true },
    ],
  },
  {
    id: "transport",
    label: "Transport (8-20)",
    fields: [
      { num: "8", name: "Importing Carrier", desc: "Name of carrier (e.g., FedEx Express, Maersk)", required: true },
      { num: "9", name: "Mode of Transport", desc: "10=Vessel, 40=Air, 30=Truck", required: true },
      { num: "10", name: "Country of Origin", desc: "ISO country code (CN=China, VN=Vietnam)", required: true },
      { num: "11", name: "Import Date", desc: "Date goods arrive at U.S. port", required: true },
      { num: "12", name: "B/L or AWB Number", desc: "Bill of Lading or Air Waybill number", required: true },
      { num: "13", name: "Manufacturer ID", desc: "MID code identifying the manufacturer", required: true },
      { num: "14", name: "Exporting Country", desc: "Country from which goods were shipped", required: true },
      { num: "15", name: "Export Date", desc: "Date goods departed foreign country", required: true },
      { num: "19", name: "Foreign Port of Lading", desc: "Port where goods were loaded (e.g., Guangzhou, China)", required: true },
      { num: "20", name: "U.S. Port of Unlading", desc: "U.S. port where goods first arrive", required: true },
    ],
  },
  {
    id: "parties",
    label: "Parties (25-30)",
    fields: [
      { num: "25", name: "Location of Goods / G.O. Number", desc: "Where goods are held / General Order number", required: false },
      { num: "26", name: "Consignee Number", desc: "IRS EIN or SSN of consignee", required: true },
      { num: "27", name: "Importer Number", desc: "IRS EIN of importer of record", required: true },
      { num: "28", name: "Reference Number", desc: "Internal tracking reference", required: false },
      { num: "29", name: "Ultimate Consignee", desc: "Full name and address of final recipient", required: true },
      { num: "30", name: "Importer of Record", desc: "Full name and address of importer", required: true },
    ],
  },
  {
    id: "lineItems",
    label: "Line Items (31-38)",
    fields: [
      { num: "31", name: "Line Number", desc: "Sequential line number for each product", required: true },
      { num: "32", name: "Description of Merchandise", desc: "Detailed product description", required: true },
      { num: "33A", name: "HTSUS Number", desc: "10-digit Harmonized Tariff Schedule code", required: true },
      { num: "33B", name: "AD/CVD Number", desc: "Anti-dumping/countervailing duty case number", required: false },
      { num: "34A", name: "Gross Weight", desc: "Total weight in kilograms", required: true },
      { num: "34B", name: "Manifest Quantity", desc: "Quantity as shown on manifest", required: false },
      { num: "35", name: "Net Quantity in HTSUS Units", desc: "Quantity in the unit of measure specified by HTS code", required: true },
      { num: "36A", name: "Entered Value", desc: "Transaction value of the goods in USD", required: true },
      { num: "37A", name: "HTSUS Rate", desc: "Duty rate from the HTS schedule", required: true },
      { num: "37B", name: "AD/CVD Rate", desc: "Anti-dumping/countervailing duty rate if applicable", required: false },
      { num: "38", name: "Duty and IR Tax", desc: "Calculated duty amount in dollars and cents", required: true },
    ],
  },
  {
    id: "totals",
    label: "Totals (39-47)",
    fields: [
      { num: "39", name: "Total Entered Value", desc: "Sum of all line item entered values", required: true },
      { num: "41", name: "Total Duty", desc: "Sum of all duties", required: true },
      { num: "42", name: "Total Tax", desc: "Sum of all taxes (usually $0)", required: true },
      { num: "43", name: "Total Other", desc: "MPF + HMF + other fees", required: true },
      { num: "44", name: "Total", desc: "Grand total: Duty + Tax + Other", required: true },
      { num: "45", name: "Declarant", desc: "Name, title, signature, and date of person filing", required: true },
      { num: "46", name: "Broker/Filer Information", desc: "Broker name and phone number", required: true },
      { num: "47", name: "Broker/Importer File Number", desc: "Broker's internal file tracking number", required: false },
    ],
  },
];

export default function Form7501Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CBP Form 7501 Assistant</h1>
        <p className="text-muted-foreground">
          Interactive guide for the Entry Summary form — understand every field
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              CBP Form 7501 — Entry Summary
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The primary customs filing document for U.S. imports. Required for all formal entries
              (value over $2,500). 27 pages covering 47+ fields. OMB Control Number 1651-0022,
              expires 02/28/2026.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="header">
        <TabsList className="w-full justify-start overflow-auto">
          {formSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="text-xs">
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {formSections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => (
                  <div
                    key={field.num}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <Badge
                      variant="outline"
                      className="mt-0.5 shrink-0 font-mono"
                    >
                      {field.num}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{field.name}</p>
                        {field.required && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {field.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
