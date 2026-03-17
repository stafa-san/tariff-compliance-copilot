export const APP_NAME = 'Tariff Copilot';
export const APP_DESCRIPTION = 'AI-powered U.S. import compliance and tariff intelligence';

// Duty calculation constants
export const MPF_RATE = 0.003464; // 0.3464%
export const MPF_MIN = 31.67;
export const MPF_MAX = 614.35;
export const HMF_RATE = 0.00125; // 0.125% (ocean only)

// Entry types (CBP Form 7501)
export const ENTRY_TYPES = [
  { code: '01', label: 'Consumption - Free and Dutiable' },
  { code: '02', label: 'Consumption - Quota/Visa/Embargo' },
  { code: '03', label: 'Consumption - AD/CVD' },
  { code: '06', label: 'Consumption - FTZ' },
  { code: '11', label: 'Informal' },
  { code: '21', label: 'Warehouse' },
  { code: '22', label: 'Re-warehouse' },
] as const;

// Transport modes
export const TRANSPORT_MODES = [
  { code: '10', label: 'Vessel (containerized)', key: 'ocean' as const },
  { code: '11', label: 'Vessel (non-containerized)', key: 'ocean' as const },
  { code: '20', label: 'Rail (containerized)', key: 'rail' as const },
  { code: '30', label: 'Truck (containerized)', key: 'truck' as const },
  { code: '40', label: 'Air', key: 'air' as const },
] as const;

// Incoterms
export const INCOTERMS = [
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
] as const;

// Risk scoring bands
export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, label: 'Low Risk', color: '#22C55E' },
  MEDIUM: { min: 31, max: 60, label: 'Medium Risk', color: '#F59E0B' },
  HIGH: { min: 61, max: 80, label: 'High Risk', color: '#F97316' },
  CRITICAL: { min: 81, max: 100, label: 'Critical Risk', color: '#EF4444' },
} as const;

// Section 301/232/122 tariff rates by country
export const TRADE_REMEDIES = {
  section122: { rate: 0.10, htsProvision: '9903.03.01', description: 'Universal baseline tariff' },
  section301: {
    countries: ['CN'],
    rate: 0.25,
    htsProvision: '9903.88.01-03',
    description: 'China Section 301 tariff',
  },
  section232Steel: {
    chapters: [72, 73],
    rate: 0.25,
    htsProvision: '9903.80.01',
    description: 'Steel tariff (Section 232)',
  },
  section232Aluminum: {
    chapters: [76],
    rate: 0.10,
    htsProvision: '9903.85.01',
    description: 'Aluminum tariff (Section 232)',
  },
  ftaExempt: ['MX', 'CA', 'KR', 'AU'],
} as const;

// Countries commonly used
export const COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CA', name: 'Canada' },
  { code: 'KR', name: 'South Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'TR', name: 'Turkey' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
] as const;
