import { HtsCode } from '../types';

const USITC_API_BASE = 'https://hts.usitc.gov/reststop';

export interface HtsSearchResult {
  htsno: string;
  description: string;
  general: string;
  special: string;
  other: string;
  units: string;
  indent: number;
}

export interface ParsedHtsResult {
  code: string;
  description: string;
  generalRate: string;
  specialRate: string;
  units: string;
  indent: number;
  chapter: number;
  numericRate: number | null;
}

export async function searchHts(keyword: string): Promise<HtsSearchResult[]> {
  try {
    // Use the web app's API proxy to avoid CORS issues
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://tariff-compliance-copilot.web.app';
    const response = await fetch(`${API_BASE}/api/hts-proxy?q=${encodeURIComponent(keyword)}`);

    if (!response.ok) {
      // Fallback to direct USITC API
      const directResponse = await fetch(`${USITC_API_BASE}/getSearch?keyword=${encodeURIComponent(keyword)}`);
      if (!directResponse.ok) throw new Error('HTS API unavailable');
      return directResponse.json();
    }

    return response.json();
  } catch (error) {
    console.error('HTS search failed:', error);
    return [];
  }
}

export function parseDutyRate(rateStr: string): number | null {
  if (!rateStr || rateStr.toLowerCase() === 'free') return 0;
  const match = rateStr.match(/([\d.]+)\s*%/);
  if (match) return parseFloat(match[1]);
  return null;
}

export async function searchAndParseHts(keyword: string): Promise<ParsedHtsResult[]> {
  const results = await searchHts(keyword);

  let lastKnownRate = '';
  return results.map((r) => {
    // Rate inheritance: child entries inherit parent rates
    const generalRate = r.general || lastKnownRate;
    if (r.general) lastKnownRate = r.general;

    const chapter = parseInt(r.htsno.replace(/\D/g, '').substring(0, 2), 10) || 0;

    return {
      code: r.htsno,
      description: r.description,
      generalRate,
      specialRate: r.special || '',
      units: r.units || '',
      indent: r.indent || 0,
      chapter,
      numericRate: parseDutyRate(generalRate),
    };
  });
}

export function buildSearchKeywords(description: string): string[] {
  const words = description.toLowerCase().split(/\s+/);
  const keywords: string[] = [];

  // Full phrase
  keywords.push(description.trim());

  // Important material/product type words
  const materialWords = ['cotton', 'polyester', 'nylon', 'silk', 'wool', 'leather', 'steel', 'aluminum', 'plastic', 'rubber', 'glass', 'wood', 'ceramic'];
  const typeWords = ['shirt', 'pants', 'dress', 'jacket', 'sweater', 'shoe', 'bag', 'toy', 'tool', 'machine', 'electronic', 'furniture', 'food', 'chemical'];

  const foundMaterials = words.filter((w) => materialWords.includes(w));
  const foundTypes = words.filter((w) => typeWords.some((t) => w.includes(t)));

  // Material + type combo
  if (foundMaterials.length > 0 && foundTypes.length > 0) {
    keywords.push(`${foundMaterials[0]} ${foundTypes[0]}`);
  }

  // Individual important words (skip common ones)
  const skipWords = new Set(['of', 'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'by', 'to', 'from', 'made']);
  words
    .filter((w) => w.length > 3 && !skipWords.has(w))
    .slice(0, 3)
    .forEach((w) => keywords.push(w));

  return [...new Set(keywords)];
}
