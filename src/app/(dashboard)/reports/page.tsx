import { FileText, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Reports</h1>
          <p className="text-muted-foreground">
            View and export audit-ready compliance reports
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium">No Reports Yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Classify products and create shipments to generate compliance reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
