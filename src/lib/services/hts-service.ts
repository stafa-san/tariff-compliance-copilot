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
 * Search and parse HTS results into a cleaner format.
 * Handles USITC rate inheritance — child entries with empty rates
 * inherit from their nearest parent with a rate.
 */
export async function searchAndParseHts(keyword: string): Promise<ParsedHtsResult[]> {
  const raw = await searchHts(keyword);

  if (raw.length === 0) return [];

  // Build rate inheritance: child entries inherit parent rates
  // USITC returns results in hierarchical order
  let lastGeneralRate = "";
  let lastSpecialRate = "";
  let lastOtherRate = "";

  const withRates = raw.map((r) => {
    // If this entry has a rate, it becomes the new parent rate
    if (r.general) {
      lastGeneralRate = r.general;
      lastSpecialRate = r.special || "";
      lastOtherRate = r.other || "";
    }

    return {
      ...r,
      inheritedGeneral: r.general || lastGeneralRate,
      inheritedSpecial: r.special || lastSpecialRate,
      inheritedOther: r.other || lastOtherRate,
    };
  });

  return withRates
    .filter((r) => r.htsno) // Must have a code
    .map((r) => ({
      htsCode: r.htsno,
      description: r.description,
      generalRate: r.inheritedGeneral,
      specialRate: r.inheritedSpecial,
      otherRate: r.inheritedOther,
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
 * Build smart search keywords from a product description.
 * Prioritizes garment/product nouns over modifiers, and generates
 * multiple strategies for better USITC coverage.
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

  // Primary product nouns (higher priority — these map directly to HTS headings)
  const primaryTypes = [
    "sweatshirt", "sweater", "pullover", "shirt", "blouse", "pants",
    "trouser", "dress", "jacket", "coat", "skirt", "sock", "shoe",
    "boot", "hat", "glove", "bag", "earbuds", "headphones", "cable",
    "phone", "laptop", "toy", "furniture",
  ];
  // Modifier types (lower priority — refine but don't identify the product)
  const modifierTypes = ["hooded", "knitted", "crocheted", "woven"];

  const materials = keywords.filter((w) =>
    ["cotton", "polyester", "silk", "wool", "nylon", "leather", "rubber",
     "plastic", "steel", "aluminum", "glass", "ceramic", "wood", "linen",
     "rayon", "acrylic", "spandex", "lycra", "denim", "fleece"].includes(w)
  );

  const primaryMatches = keywords.filter((w) => primaryTypes.includes(w));
  const modifierMatches = keywords.filter((w) => modifierTypes.includes(w));
  const allProductTypes = [...primaryMatches, ...modifierMatches];

  const strategies: string[] = [];

  // Strategy 1: Each primary product type alone (most reliable for USITC)
  for (const pt of primaryMatches) {
    strategies.push(pt);
  }

  // Strategy 2: Material + primary product type combos
  for (const mat of materials) {
    for (const pt of primaryMatches) {
      strategies.push(`${mat} ${pt}`);
    }
  }

  // Strategy 3: Modifier + primary product type (e.g., "hooded sweatshirt")
  for (const mod of modifierMatches) {
    for (const pt of primaryMatches) {
      strategies.push(`${mod} ${pt}`);
    }
  }

  // Strategy 4: Material alone (broad fallback)
  if (primaryMatches.length === 0 && materials.length > 0) {
    strategies.push(materials[0]);
  }

  // Strategy 5: First meaningful keywords (fallback for unrecognized products)
  if (strategies.length === 0) {
    strategies.push(keywords.slice(0, 3).join(" "));
    if (keywords.length > 0) strategies.push(keywords[0]);
  }

  // Deduplicate and cap at 5 strategies
  return [...new Set(strategies)].slice(0, 5);
}
