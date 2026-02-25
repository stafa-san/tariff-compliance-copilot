/**
 * HTS Service — Searches the USITC Harmonized Tariff Schedule database
 * Uses the official USITC REST API at hts.usitc.gov/reststop/
 */

export interface HtsSearchResult {
  htsno: string;
  statisticalSuffix: string;
  description: string;
  indent: string;
  units: string[];
  general: string;
  other: string;
  special: string;
  footnotes: { columns: string[]; marker: string; value: string; type: string }[];
  additionalDuties: string | null;
}

export interface ParsedHtsResult {
  htsCode: string;
  description: string;
  generalRate: string;
  specialRate: string;
  otherRate: string;
  units: string[];
  section301Note: string | null;
  indent: number;
}

const USITC_API_BASE = "https://hts.usitc.gov/reststop";

/**
 * Search the USITC HTS database by keyword
 */
export async function searchHts(keyword: string): Promise<HtsSearchResult[]> {
  const url = `${USITC_API_BASE}/search?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`USITC API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search and parse HTS results into a cleaner format
 */
export async function searchAndParseHts(keyword: string): Promise<ParsedHtsResult[]> {
  const raw = await searchHts(keyword);
  return raw
    .filter((r) => r.htsno && r.general) // Only entries with codes and rates
    .map((r) => ({
      htsCode: r.htsno,
      description: r.description,
      generalRate: r.general,
      specialRate: r.special || "",
      otherRate: r.other || "",
      units: r.units || [],
      section301Note: extractSection301(r.footnotes),
      indent: parseInt(r.indent) || 0,
    }));
}

/**
 * Extract Section 301/232/201 references from footnotes
 */
function extractSection301(
  footnotes: HtsSearchResult["footnotes"]
): string | null {
  if (!footnotes) return null;
  for (const fn of footnotes) {
    if (fn.value && /9903\.88/.test(fn.value)) {
      return fn.value.trim();
    }
  }
  return null;
}

/**
 * Parse a duty rate string like "16.5%" or "Free" or "0.47¢/kg" into a numeric percentage
 */
export function parseDutyRate(rateStr: string): number {
  if (!rateStr || rateStr === "Free") return 0;

  // Match percentage like "16.5%"
  const pctMatch = rateStr.match(/([\d.]+)%/);
  if (pctMatch) return parseFloat(pctMatch[1]);

  // Match cents per unit like "0.47¢/kg" — return as-is (non-percentage)
  const centMatch = rateStr.match(/([\d.]+)¢/);
  if (centMatch) return parseFloat(centMatch[1]) / 100; // approximate

  return 0;
}

/**
 * Build smart search keywords from a product description
 * Strips filler words and focuses on material + product type
 */
export function buildSearchKeywords(description: string): string[] {
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Remove common filler words
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "are", "was",
    "used", "made", "sizes", "adult", "men", "women", "boy", "girl",
    "not", "component", "another", "product", "printed", "screen",
  ]);

  const keywords = words.filter((w) => !stopWords.has(w));

  // Build multi-word search strategies
  const strategies: string[] = [];

  // Strategy 1: Material + product type (e.g., "cotton sweatshirt")
  const materials = keywords.filter((w) =>
    ["cotton", "polyester", "silk", "wool", "nylon", "leather", "rubber",
     "plastic", "steel", "aluminum", "glass", "ceramic", "wood"].includes(w)
  );
  const productTypes = keywords.filter((w) =>
    ["sweatshirt", "shirt", "pants", "dress", "jacket", "shoe", "bag",
     "earbuds", "headphones", "cable", "phone", "laptop", "toy",
     "furniture", "hooded", "knitted", "woven", "blouse", "sweater",
     "pullover", "trouser", "skirt", "coat", "hat", "glove", "sock"].includes(w)
  );

  if (materials.length > 0 && productTypes.length > 0) {
    strategies.push(`${materials[0]} ${productTypes[0]}`);
  }

  // Strategy 2: First few meaningful keywords
  strategies.push(keywords.slice(0, 3).join(" "));

  // Strategy 3: Product type alone
  if (productTypes.length > 0) {
    strategies.push(productTypes[0]);
  }

  return [...new Set(strategies)];
}
