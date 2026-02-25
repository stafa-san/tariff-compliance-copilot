"use client";

import { useState, useEffect } from "react";
import { Ship, Plus, Package, MapPin, Calendar, DollarSign, Trash2, Eye, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format";
import { onAuthChange } from "@/lib/firebase/auth";
import { addDocument, getDocuments, deleteDocument, where, orderBy } from "@/lib/firebase/firestore";
import type { User } from "firebase/auth";

interface ShipmentDoc {
  id: string;
  userId: string;
  name: string;
  status: "draft" | "classified" | "reviewed" | "filed";
  supplierName: string;
  supplierCountry: string;
  productDescription: string;
  htsCode: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  shippingMethod: "ocean" | "air" | "ground";
  countryOfOrigin: string;
  portCode: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  classified: "bg-blue-500",
  reviewed: "bg-yellow-500",
  filed: "bg-green-500",
};

const COUNTRIES = [
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

export default function ShipmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<ShipmentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDoc | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    supplierName: "",
    supplierCountry: "CN",
    productDescription: "",
    htsCode: "",
    quantity: 0,
    unitValue: 0,
    shippingMethod: "ocean" as "ocean" | "air" | "ground",
    countryOfOrigin: "CN",
    portCode: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      if (u) loadShipments(u.uid);
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadShipments = async (uid: string) => {
    try {
      const docs = await getDocuments<ShipmentDoc>(
        "shipments",
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      setShipments(docs);
    } catch (err) {
      console.error("Failed to load shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    try {
      const totalValue = form.quantity * form.unitValue;
      await addDocument("shipments", {
        userId: user.uid,
        name: form.name,
        status: form.htsCode ? "classified" : "draft",
        supplierName: form.supplierName,
        supplierCountry: form.supplierCountry,
        productDescription: form.productDescription,
        htsCode: form.htsCode,
        quantity: form.quantity,
        unitValue: form.unitValue,
        totalValue,
        shippingMethod: form.shippingMethod,
        countryOfOrigin: form.countryOfOrigin,
        portCode: form.portCode,
      });

      // Reload and reset
      await loadShipments(user.uid);
      setForm({
        name: "",
        supplierName: "",
        supplierCountry: "CN",
        productDescription: "",
        htsCode: "",
        quantity: 0,
        unitValue: 0,
        shippingMethod: "ocean",
        countryOfOrigin: "CN",
        portCode: "",
      });
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create shipment:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument("shipments", id);
      setShipments((prev) => prev.filter((s) => s.id !== id));
      if (selectedShipment?.id === id) setSelectedShipment(null);
    } catch (err) {
      console.error("Failed to delete shipment:", err);
    }
  };

  const loadSampleShipment = () => {
    setForm({
      name: "UC Bearcats Sweatshirts - Spring 2026",
      supplierName: "Guangzhou Elite Apparel Co., Ltd.",
      supplierCountry: "CN",
      productDescription:
        "Men's University of Cincinnati Bearcats Hooded Sweatshirt — 80% Cotton / 20% Polyester — Screen-printed",
      htsCode: "6110.20.2079",
      quantity: 500,
      unitValue: 18.0,
      shippingMethod: "ocean",
      countryOfOrigin: "CN",
      portCode: "4601",
    });
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
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-muted-foreground">
            Manage your import shipments and track compliance status
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Shipment</DialogTitle>
              <DialogDescription>
                Enter shipment details to start tracking compliance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Shipment Name</Label>
                <Input
                  placeholder="e.g., Spring 2026 Apparel Order"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <Separator />
              <p className="text-sm font-medium">Supplier Information</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Supplier Name</Label>
                  <Input
                    placeholder="Company name"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Country</Label>
                  <Select value={form.supplierCountry} onValueChange={(v) => setForm({ ...form, supplierCountry: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <p className="text-sm font-medium">Product Details</p>

              <div className="space-y-2">
                <Label>Product Description</Label>
                <Textarea
                  placeholder="Detailed product description..."
                  value={form.productDescription}
                  onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>HTS Code (if known)</Label>
                  <Input
                    placeholder="e.g., 6110.20.2079"
                    value={form.htsCode}
                    onChange={(e) => setForm({ ...form, htsCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country of Origin</Label>
                  <Select value={form.countryOfOrigin} onValueChange={(v) => setForm({ ...form, countryOfOrigin: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Quantity (units)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity || ""}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Value (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.unitValue || ""}
                    onChange={(e) => setForm({ ...form, unitValue: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <Input
                    readOnly
                    value={formatCurrency(form.quantity * form.unitValue)}
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />
              <p className="text-sm font-medium">Shipping</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shipping Method</Label>
                  <Select value={form.shippingMethod} onValueChange={(v) => setForm({ ...form, shippingMethod: v as "ocean" | "air" | "ground" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ocean">Ocean</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="ground">Ground</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Port Code</Label>
                  <Input
                    placeholder="e.g., 4601"
                    value={form.portCode}
                    onChange={(e) => setForm({ ...form, portCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "Creating..." : "Create Shipment"}
                </Button>
                <Button type="button" variant="outline" onClick={loadSampleShipment}>
                  Load Sample
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {shipments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{shipments.length}</div>
              <p className="text-xs text-muted-foreground">Total Shipments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {shipments.filter((s) => s.status === "draft").length}
              </div>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {shipments.filter((s) => s.status === "filed").length}
              </div>
              <p className="text-xs text-muted-foreground">Filed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {formatCurrency(shipments.reduce((sum, s) => sum + (s.totalValue || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shipment Detail Panel */}
      {selectedShipment && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedShipment.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedShipment(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[selectedShipment.status]}>
                  {selectedShipment.status.charAt(0).toUpperCase() + selectedShipment.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Supplier</p>
                <p className="text-sm font-medium">{selectedShipment.supplierName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Origin</p>
                <p className="text-sm font-medium">
                  {COUNTRIES.find((c) => c.value === selectedShipment.countryOfOrigin)?.label || selectedShipment.countryOfOrigin}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">HTS Code</p>
                <p className="font-mono text-sm font-medium">{selectedShipment.htsCode || "Pending"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="text-sm font-medium">{selectedShipment.quantity?.toLocaleString()} units</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-sm font-medium">{formatCurrency(selectedShipment.totalValue || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shipping</p>
                <p className="text-sm font-medium capitalize">{selectedShipment.shippingMethod}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Port</p>
                <p className="text-sm font-medium">{selectedShipment.portCode || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(selectedShipment.createdAt)}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Product Description</p>
              <p className="text-sm">{selectedShipment.productDescription}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipment List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading shipments...</p>
          </CardContent>
        </Card>
      ) : shipments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Ship className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">No Shipments Yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first shipment to start tracking imports and compliance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {shipments.map((shipment) => (
            <Card
              key={shipment.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedShipment?.id === shipment.id ? "border-primary/50 bg-muted/30" : ""
              }`}
              onClick={() => setSelectedShipment(shipment)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{shipment.name}</p>
                    <Badge className={`${STATUS_COLORS[shipment.status]} text-xs`}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {COUNTRIES.find((c) => c.value === shipment.countryOfOrigin)?.label || shipment.countryOfOrigin}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(shipment.totalValue || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(shipment.createdAt)}
                    </span>
                    {shipment.htsCode && (
                      <span className="font-mono">{shipment.htsCode}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(shipment.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
