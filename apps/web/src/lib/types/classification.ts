export interface HtsCode {
  code: string;
  description: string;
  generalRate: string;
  specialRates?: Record<string, string>;
  unit: string;
  chapter: number;
  section: number;
  notes?: string;
}

export interface ClassificationResult {
  id?: string;
  productDescription: string;
  htsCode: string;
  htsDescription: string;
  confidence: number;
  reasoning: string;
  alternativeCodes: AlternativeCode[];
  dutyRate: number;
  specialTariffs: SpecialTariff[];
  regulatoryFlags: RegulatoryFlag[];
  riskScore: number;
  riskFactors: RiskFactor[];
  createdAt?: Date;
}

export interface AlternativeCode {
  code: string;
  description: string;
  confidence: number;
  reason: string;
}

export interface SpecialTariff {
  name: string;
  rate: number;
  authority: string;
  htsProvision?: string;
}

export interface RegulatoryFlag {
  agency: "FDA" | "USDA" | "EPA" | "CPSC" | "FCC" | "USFWS";
  requirement: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface RiskFactor {
  factor: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}
