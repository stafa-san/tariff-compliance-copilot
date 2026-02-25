import { Ship, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-muted-foreground">
            Manage your import shipments and track compliance status
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Shipment
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Ship className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium">No Shipments Yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first shipment to start tracking imports and compliance.
          </p>
          <Button className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create Shipment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
