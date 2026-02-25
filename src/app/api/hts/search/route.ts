import { NextRequest, NextResponse } from "next/server";
import {
  searchAndParseHts,
  buildSearchKeywords,
  type ParsedHtsResult,
} from "@/lib/services/hts-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Missing 'query' parameter" },
      { status: 400 }
    );
  }

  try {
    // Build multiple search strategies for better coverage
    const keywords = buildSearchKeywords(query);
    const allResults: ParsedHtsResult[] = [];
    const seenCodes = new Set<string>();

    for (const keyword of keywords) {
      const results = await searchAndParseHts(keyword);
      for (const r of results) {
        if (!seenCodes.has(r.htsCode)) {
          seenCodes.add(r.htsCode);
          allResults.push(r);
        }
      }
    }

    // Sort: prefer 8+ digit codes (more specific), then by indent level
    allResults.sort((a, b) => {
      const aDigits = a.htsCode.replace(/\D/g, "").length;
      const bDigits = b.htsCode.replace(/\D/g, "").length;
      if (aDigits !== bDigits) return bDigits - aDigits;
      return b.indent - a.indent;
    });

    return NextResponse.json({
      query,
      keywords,
      results: allResults.slice(0, 20), // Top 20 results
      total: allResults.length,
    });
  } catch (error) {
    console.error("HTS search error:", error);
    return NextResponse.json(
      { error: "Failed to search HTS database" },
      { status: 500 }
    );
  }
}
