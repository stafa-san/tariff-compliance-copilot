import { NextRequest, NextResponse } from "next/server";
import {
  searchAndParseHts,
  buildSearchKeywords,
  parseDutyRate,
  type ParsedHtsResult,
} from "@/lib/services/hts-service";

interface ClassificationRequest {
  productDescription: string;
  countryOfOrigin: string;
}

// Section 301 tariff rates by country
const SECTION_301_COUNTRIES: Record<string, { rate: number; list: string }> = {
  CN: { rate: 7.5, list: "List 4A (9903.88.15)" },
};

// Country names for display
const COUNTRY_NAMES: Record<string, string> = {
  CN: "China",
  VN: "Vietnam",
  MX: "Mexico",
  IN: "India",
  BD: "Bangladesh",
  DE: "Germany",
  JP: "Japan",
  KR: "South Korea",
  TW: "Taiwan",
  TH: "Thailand",
};

export async function POST(request: NextRequest) {
  try {
    const body: ClassificationRequest = await request.json();
    const { productDescription, countryOfOrigin } = body;

    if (!productDescription || !countryOfOrigin) {
      return NextResponse.json(
        { error: "Missing productDescription or countryOfOrigin" },
        { status: 400 }
      );
    }

    // Search USITC with multiple keyword strategies
    const keywords = buildSearchKeywords(productDescription);
    const allResults: ParsedHtsResult[] = [];
    const seenCodes = new Set<string>();

    for (const keyword of keywords) {
      try {
        const results = await searchAndParseHts(keyword);
        for (const r of results) {
          if (!seenCodes.has(r.htsCode)) {
            seenCodes.add(r.htsCode);
            allResults.push(r);
          }
        }
      } catch {
        // Continue with other keywords if one fails
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json({
        classification: null,
        message: "No matching HTS codes found. Try a more specific product description.",
        keywords,
      });
    }

    // Score and rank results based on relevance
    const scored = allResults.map((r) => ({
      ...r,
      score: scoreResult(r, productDescription),
    }));

    scored.sort((a, b) => b.score - a.score);

    const primary = scored[0];
    const alternatives = scored.slice(1, 4);

    // Check for Section 301 tariffs
    const section301 = SECTION_301_COUNTRIES[countryOfOrigin];
    const specialTariffs = [];
    if (section301) {
      specialTariffs.push({
        name: `Section 301 ${section301.list}`,
        rate: section301.rate,
        authority: "USTR",
        htsProvision: "9903.88.15",
      });
    }

    // Check footnotes for section 301 references
    if (primary.section301Note) {
      specialTariffs.push({
        name: "Additional Duties (see footnote)",
        rate: 0,
        authority: "CBP",
        htsProvision: primary.section301Note,
      });
    }

    const generalDutyRate = parseDutyRate(primary.generalRate);

    // Build reasoning chain
    const reasoning = buildReasoning(
      productDescription,
      primary,
      countryOfOrigin,
      section301,
      keywords
    );

    // Calculate confidence based on match quality
    const confidence = Math.min(95, Math.max(40, primary.score));

    return NextResponse.json({
      classification: {
        htsCode: primary.htsCode,
        description: primary.description,
        confidence,
        generalRate: primary.generalRate,
        generalDutyRate,
        specialRate: primary.specialRate,
        otherRate: primary.otherRate,
        units: primary.units,
        specialTariffs,
        reasoning,
        alternatives: alternatives.map((alt) => ({
          htsCode: alt.htsCode,
          description: alt.description,
          confidence: Math.min(85, Math.max(10, alt.score)),
          generalRate: alt.generalRate,
        })),
        countryOfOrigin,
        countryName: COUNTRY_NAMES[countryOfOrigin] || countryOfOrigin,
      },
      keywords,
      totalResults: allResults.length,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Classification failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Score a result based on relevance to the product description
 */
function scoreResult(result: ParsedHtsResult, description: string): number {
  const desc = description.toLowerCase();
  const htsDesc = result.description.toLowerCase();
  let score = 50;

  // More specific HTS codes (longer) score higher
  const digits = result.htsCode.replace(/\D/g, "").length;
  score += digits * 2;

  // Higher indent means more specific
  score += result.indent * 3;

  // Keyword matches
  const descWords = desc.split(/\s+/);
  const htsWords = htsDesc.split(/\s+/);
  for (const word of descWords) {
    if (word.length > 3 && htsWords.some((w) => w.includes(word))) {
      score += 5;
    }
  }

  // Bonus for specific material matches
  const materials = ["cotton", "polyester", "silk", "wool", "leather", "steel", "plastic"];
  for (const mat of materials) {
    if (desc.includes(mat) && htsDesc.includes(mat)) {
      score += 10;
    }
  }

  // Bonus for product type matches
  const types = [
    "sweater", "sweatshirt", "pullover", "shirt", "trouser", "pant",
    "dress", "jacket", "coat", "shoe", "boot", "hat", "glove",
    "knitted", "crocheted", "woven", "hosiery",
  ];
  for (const t of types) {
    if (desc.includes(t) && htsDesc.includes(t)) {
      score += 15;
    }
  }

  // Penalize very generic descriptions
  if (htsDesc === "other" || htsDesc === "parts") {
    score -= 10;
  }

  return Math.min(95, score);
}

/**
 * Build an AI-like reasoning chain for the classification
 */
function buildReasoning(
  description: string,
  primary: ParsedHtsResult,
  countryCode: string,
  section301: { rate: number; list: string } | undefined,
  keywords: string[]
): string[] {
  const steps: string[] = [];
  const chapter = primary.htsCode.slice(0, 2);
  const heading = primary.htsCode.slice(0, 4);

  steps.push(
    `Analyzed product description and identified key terms: "${keywords.join('", "')}"`
  );

  steps.push(
    `Searched USITC Harmonized Tariff Schedule database (hts.usitc.gov) for matching codes`
  );

  steps.push(
    `Matched to Chapter ${chapter}, Heading ${heading}: "${primary.description}"`
  );

  steps.push(
    `Selected HTS ${primary.htsCode} with general duty rate of ${primary.generalRate}`
  );

  if (primary.specialRate) {
    steps.push(
      `Special program rates available: ${primary.specialRate}`
    );
  }

  if (section301) {
    steps.push(
      `Country of origin ${COUNTRY_NAMES[countryCode] || countryCode} triggers Section 301 tariff (${section301.list}) at ${section301.rate}% additional duty`
    );
  } else {
    steps.push(
      `No additional Section 301/232 tariffs apply for ${COUNTRY_NAMES[countryCode] || countryCode}`
    );
  }

  return steps;
}
