import { ClassificationResult, SpecialTariff } from '../types';
import { searchAndParseHts, buildSearchKeywords, ParsedHtsResult } from './hts-service';
import { TRADE_REMEDIES } from '../utils/constants';

export async function classifyProduct(
  description: string,
  countryOfOrigin: string
): Promise<ClassificationResult> {
  const keywords = buildSearchKeywords(description);
  const allResults: ParsedHtsResult[] = [];

  // Search with multiple keyword strategies
  for (const keyword of keywords.slice(0, 4)) {
    const results = await searchAndParseHts(keyword);
    allResults.push(...results);
  }

  // Deduplicate by HTS code
  const uniqueResults = Array.from(
    new Map(allResults.map((r) => [r.code, r])).values()
  );

  // Score and rank results
  const scored = uniqueResults
    .filter((r) => r.numericRate !== null && r.code.replace(/\D/g, '').length >= 6)
    .map((r) => ({
      ...r,
      score: scoreResult(r, description),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      primary: {
        code: '0000.00.0000',
        description: 'No matching classification found',
        generalRate: 'N/A',
        confidence: 0,
      },
      alternatives: [],
      specialTariffs: [],
      reasoning: ['No results found for the given product description.'],
      riskFactors: [],
    };
  }

  const primary = scored[0];
  const alternatives = scored.slice(1, 4).map((r) => ({
    code: r.code,
    description: r.description,
    generalRate: r.generalRate,
    confidence: Math.round((r.score / primary.score) * 100),
    reason: `Matched on: ${r.description.substring(0, 80)}`,
  }));

  // Determine special tariffs
  const specialTariffs = getSpecialTariffs(primary.code, countryOfOrigin);

  return {
    primary: {
      code: primary.code,
      description: primary.description,
      generalRate: primary.generalRate,
      confidence: Math.min(95, Math.round(primary.score)),
    },
    alternatives,
    specialTariffs,
    reasoning: [
      `Searched USITC database with ${keywords.length} keyword strategies`,
      `Found ${uniqueResults.length} potential matches`,
      `Best match: ${primary.code} (${primary.description.substring(0, 60)}...)`,
      `General duty rate: ${primary.generalRate}`,
    ],
    riskFactors: [],
  };
}

function scoreResult(result: ParsedHtsResult, description: string): number {
  let score = 0;
  const descLower = description.toLowerCase();
  const resultDescLower = result.description.toLowerCase();

  // More specific codes (more digits) get higher scores
  const digitCount = result.code.replace(/\D/g, '').length;
  score += digitCount * 2;

  // Higher indent = more specific
  score += result.indent * 3;

  // Word matches
  const words = descLower.split(/\s+/).filter((w) => w.length > 3);
  for (const word of words) {
    if (resultDescLower.includes(word)) score += 5;
  }

  // Material matches (high value)
  const materials = ['cotton', 'polyester', 'nylon', 'silk', 'wool', 'leather', 'steel', 'aluminum'];
  for (const mat of materials) {
    if (descLower.includes(mat) && resultDescLower.includes(mat)) score += 10;
  }

  // Product type matches (highest value)
  const types = ['shirt', 'sweater', 'pants', 'jacket', 'dress', 'shoe', 'bag', 'toy', 'machine'];
  for (const type of types) {
    if (descLower.includes(type) && resultDescLower.includes(type)) score += 15;
  }

  return score;
}

function getSpecialTariffs(htsCode: string, countryOfOrigin: string): SpecialTariff[] {
  const tariffs: SpecialTariff[] = [];
  const country = countryOfOrigin.toUpperCase();
  const chapter = parseInt(htsCode.replace(/\D/g, '').substring(0, 2), 10) || 0;
  const isFtaExempt = TRADE_REMEDIES.ftaExempt.includes(country);

  // Section 122 (universal)
  if (!isFtaExempt) {
    tariffs.push({
      name: 'Section 122 Tariff',
      rate: '10%',
      authority: 'IEEPA (Section 122)',
      htsProvision: TRADE_REMEDIES.section122.htsProvision,
    });
  }

  // Section 301 (China)
  if (TRADE_REMEDIES.section301.countries.includes(country)) {
    tariffs.push({
      name: 'Section 301 Tariff (China)',
      rate: '25%',
      authority: 'Trade Act of 1974',
      htsProvision: TRADE_REMEDIES.section301.htsProvision,
    });
  }

  // Section 232 (Steel)
  if (TRADE_REMEDIES.section232Steel.chapters.includes(chapter)) {
    tariffs.push({
      name: 'Section 232 Steel Tariff',
      rate: '25%',
      authority: 'Trade Expansion Act of 1962',
      htsProvision: TRADE_REMEDIES.section232Steel.htsProvision,
    });
  }

  // Section 232 (Aluminum)
  if (TRADE_REMEDIES.section232Aluminum.chapters.includes(chapter)) {
    tariffs.push({
      name: 'Section 232 Aluminum Tariff',
      rate: '10%',
      authority: 'Trade Expansion Act of 1962',
      htsProvision: TRADE_REMEDIES.section232Aluminum.htsProvision,
    });
  }

  return tariffs;
}
