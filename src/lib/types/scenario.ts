export interface Scenario {
  id?: string;
  userId: string;
  name: string;
  baseProduct: {
    htsCode: string;
    description: string;
    unitValue: number;
    quantity: number;
  };
  countries: ScenarioCountry[];
  tariffVariations: TariffVariation[];
  createdAt?: Date;
}

export interface ScenarioCountry {
  country: string;
  countryCode: string;
  unitCost: number;
  freight: number;
  dutyRate: number;
  specialTariffs: { name: string; rate: number }[];
  landedCostPerUnit: number;
  totalLandedCost: number;
  savings: number;
}

export interface TariffVariation {
  label: string;
  rateChange: number;
  impactAmount: number;
  impactPercent: number;
}
