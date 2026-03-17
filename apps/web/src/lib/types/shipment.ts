export interface Shipment {
  id?: string;
  userId: string;
  status: "draft" | "classified" | "reviewed" | "filed";
  products: ShipmentProduct[];
  supplier: Supplier;
  invoiceUrl?: string;
  shippingMethod: "ocean" | "air" | "ground";
  incoterms: string;
  freight: number;
  insurance: number;
  entryNumber?: string;
  entryType?: string;
  portCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShipmentProduct {
  description: string;
  htsCode: string;
  htsDescription: string;
  confidence: number;
  alternativeCodes?: { code: string; confidence: number; reason: string }[];
  countryOfOrigin: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  currency: string;
  grossWeight?: number;
  netWeight?: number;
}

export interface Supplier {
  name: string;
  country: string;
  address: string;
  manufacturerId?: string;
}

export interface LandedCost {
  productCost: number;
  freight: number;
  insurance: number;
  generalDuty: number;
  specialTariffs: { name: string; amount: number }[];
  adCvdDuty: number;
  mpf: number;
  hmf: number;
  brokerageFees: number;
  totalDuties: number;
  totalLandedCost: number;
}
