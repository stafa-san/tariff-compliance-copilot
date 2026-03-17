import { DutyCalculation } from '../types';
import { MPF_RATE, MPF_MIN, MPF_MAX, HMF_RATE, TRADE_REMEDIES } from '../utils/constants';

interface DutyCalcInput {
  htsCode: string;
  htsDescription: string;
  enteredValue: number;
  generalDutyRate: number; // as decimal (e.g., 0.165 for 16.5%)
  countryOfOrigin: string;
  shippingMethod: 'ocean' | 'air' | 'truck' | 'rail';
  freight?: number;
  insurance?: number;
}

export function calculateDuties(input: DutyCalcInput): DutyCalculation {
  const {
    htsCode,
    htsDescription,
    enteredValue,
    generalDutyRate,
    countryOfOrigin,
    shippingMethod,
    freight = 0,
    insurance = 0,
  } = input;

  const country = countryOfOrigin.toUpperCase();
  const chapter = parseInt(htsCode.replace(/\D/g, '').substring(0, 2), 10) || 0;
  const isFtaExempt = TRADE_REMEDIES.ftaExempt.includes(country);

  // General duty
  const generalDuty = enteredValue * generalDutyRate;

  // Section 122 (universal baseline, 10% on all imports)
  const section122Rate = isFtaExempt ? 0 : TRADE_REMEDIES.section122.rate;
  const section122Duty = enteredValue * section122Rate;

  // Section 301 (China-specific)
  const isSection301 = TRADE_REMEDIES.section301.countries.includes(country);
  const section301Rate = isSection301 ? TRADE_REMEDIES.section301.rate : 0;
  const section301Duty = enteredValue * section301Rate;

  // Section 232 (steel/aluminum)
  let section232Rate = 0;
  if (TRADE_REMEDIES.section232Steel.chapters.includes(chapter)) {
    section232Rate = TRADE_REMEDIES.section232Steel.rate;
  } else if (TRADE_REMEDIES.section232Aluminum.chapters.includes(chapter)) {
    section232Rate = TRADE_REMEDIES.section232Aluminum.rate;
  }
  const section232Duty = enteredValue * section232Rate;

  // MPF (Merchandise Processing Fee)
  const rawMpf = enteredValue * MPF_RATE;
  const mpf = Math.min(Math.max(rawMpf, MPF_MIN), MPF_MAX);

  // HMF (Harbor Maintenance Fee - ocean only)
  const hmf = shippingMethod === 'ocean' ? enteredValue * HMF_RATE : 0;

  // Totals
  const totalDuties = generalDuty + section122Duty + section301Duty + section232Duty + mpf + hmf;
  const effectiveRate = enteredValue > 0 ? totalDuties / enteredValue : 0;
  const landedCost = enteredValue + freight + insurance + totalDuties;

  return {
    htsCode,
    htsDescription,
    enteredValue,
    generalDutyRate: generalDutyRate * 100,
    generalDuty,
    section301Rate: section301Rate * 100,
    section301Duty,
    section232Rate: section232Rate * 100,
    section232Duty,
    section122Rate: section122Rate * 100,
    section122Duty,
    mpf,
    hmf,
    totalDuties,
    effectiveRate: effectiveRate * 100,
    landedCost,
    freight,
    insurance,
  };
}
