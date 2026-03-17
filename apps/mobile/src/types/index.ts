// ─── Navigation ───
export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ClassifyResult: { result: ClassificationResult };
  CalculatorResult: { result: DutyCalculation };
  ScenarioDetail: { scenario: ScenarioComparison };
  ShipmentDetail: { shipmentId: string };
  ShipmentCreate: undefined;
  AuditResult: { findings: AuditFinding[]; riskScore: number };
  ReportDetail: { reportId: string };
  Form7501Detail: { sectionIndex: number };
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Classify: undefined;
  Calculator: undefined;
  Tools: undefined;
  Profile: undefined;
};

// ─── HTS Classification ───
export interface HtsCode {
  code: string;
  description: string;
  generalRate: string;
  specialRate?: string;
  units: string;
  chapter: number;
  section?: number;
  indent: number;
}

export interface ClassificationResult {
  primary: {
    code: string;
    description: string;
    generalRate: string;
    confidence: number;
  };
  alternatives: AlternativeCode[];
  specialTariffs: SpecialTariff[];
  reasoning: string[];
  riskFactors: RiskFactor[];
}

export interface AlternativeCode {
  code: string;
  description: string;
  generalRate: string;
  confidence: number;
  reason: string;
}

export interface SpecialTariff {
  name: string;
  rate: string;
  authority: string;
  htsProvision: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

// ─── Duty Calculator ───
export interface DutyCalculation {
  htsCode: string;
  htsDescription: string;
  enteredValue: number;
  generalDutyRate: number;
  generalDuty: number;
  section301Rate: number;
  section301Duty: number;
  section232Rate: number;
  section232Duty: number;
  section122Rate: number;
  section122Duty: number;
  mpf: number;
  hmf: number;
  totalDuties: number;
  effectiveRate: number;
  landedCost: number;
  freight: number;
  insurance: number;
}

// ─── Scenario Simulator ───
export interface ScenarioComparison {
  product: string;
  htsCode: string;
  quantity: number;
  unitValue: number;
  countries: ScenarioCountry[];
}

export interface ScenarioCountry {
  country: string;
  countryCode: string;
  generalDutyRate: number;
  section301Rate: number;
  section232Rate: number;
  section122Rate: number;
  totalDutyRate: number;
  totalDuty: number;
  mpf: number;
  hmf: number;
  landedCost: number;
  savings: number;
}

// ─── Shipment ───
export interface Shipment {
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'classified' | 'reviewed' | 'filed';
  product: string;
  htsCode: string;
  supplier: string;
  supplierCountry: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  shippingMethod: 'ocean' | 'air' | 'truck' | 'rail';
  portOfEntry?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ─── Audit ───
export interface AuditFinding {
  field: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  declaredValue?: string;
  expectedValue?: string;
  recommendation: string;
}

// ─── Report ───
export interface Report {
  id: string;
  userId: string;
  title: string;
  type: 'classification' | 'duty_analysis' | 'compliance_audit' | 'scenario_comparison';
  status: 'draft' | 'completed';
  summary: string;
  findings?: AuditFinding[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dateRange?: { start: Date; end: Date };
  createdAt: Date;
}

// ─── Form 7501 ───
export interface Form7501Field {
  number: string;
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

export interface Form7501Section {
  title: string;
  fields: Form7501Field[];
}

// ─── Dashboard ───
export interface DashboardStats {
  totalShipments: number;
  pendingClassifications: number;
  totalDuties: number;
  complianceScore: number;
}

// ─── User ───
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  company?: string;
  role?: string;
}
