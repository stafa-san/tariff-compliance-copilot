export const APP_NAME = "Tariff Compliance Copilot";
export const APP_DESCRIPTION =
  "AI-powered U.S. import compliance and tariff intelligence platform";

export const ENTRY_TYPES = [
  { value: "01", label: "01 — Consumption (Free and Dutiable)" },
  { value: "02", label: "02 — Consumption — Quota/Visa" },
  { value: "03", label: "03 — Consumption — AD/CVD" },
  { value: "06", label: "06 — Consumption — FTZ" },
  { value: "11", label: "11 — Informal" },
  { value: "21", label: "21 — Warehouse" },
  { value: "22", label: "22 — Re-Warehouse" },
] as const;

export const TRANSPORT_MODES = [
  { value: "10", label: "Vessel, Non-container" },
  { value: "11", label: "Vessel, Container" },
  { value: "20", label: "Rail, Non-container" },
  { value: "21", label: "Rail, Container" },
  { value: "30", label: "Truck, Non-container" },
  { value: "31", label: "Truck, Container" },
  { value: "40", label: "Air" },
  { value: "41", label: "Air, Container" },
  { value: "60", label: "Passenger, Hand-Carried" },
] as const;

export const INCOTERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const;

export const MPF_RATE = 0.003464;
export const MPF_MIN = 31.67;
export const MPF_MAX = 614.35;
export const HMF_RATE = 0.00125;

export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, label: "Low Risk", color: "text-green-600" },
  MEDIUM: { min: 31, max: 60, label: "Medium Risk", color: "text-yellow-600" },
  HIGH: { min: 61, max: 80, label: "High Risk", color: "text-orange-600" },
  CRITICAL: { min: 81, max: 100, label: "Critical Risk", color: "text-red-600" },
} as const;
