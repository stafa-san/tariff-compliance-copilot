#!/usr/bin/env npx tsx
/**
 * sync-hts-data.ts — Download and process the USITC Harmonized Tariff Schedule
 *
 * Data Source: USITC REST API (hts.usitc.gov/reststop/exportList)
 * Output:      src/lib/data/hts-lookup.json (optimized for fast code lookup)
 *
 * Usage:
 *   pnpm run sync-hts      # Download latest HTS data and rebuild lookup
 *
 * Schedule:
 *   Run monthly or when USITC publishes a new revision.
 *   Check https://hts.usitc.gov/download for current revision info.
 *
 * Data Provenance:
 *   - Source: U.S. International Trade Commission (USITC)
 *   - API: https://hts.usitc.gov/reststop/exportList?from=0100&to=9999&format=JSON&styles=false
 *   - Update Frequency: Basic edition yearly (Dec), revisions every 1-3 weeks
 *   - Current: 2026 HTS Revision 4 (February 25, 2026)
 *   - License: Public domain (U.S. Government work)
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const API_URL =
  "https://hts.usitc.gov/reststop/exportList?from=0100&to=9999&format=JSON&styles=false";

const OUTPUT_PATH = join(__dirname, "..", "src", "lib", "data", "hts-lookup.json");

interface RawHTSRecord {
  htsno: string;
  indent: string;
  description: string;
  superior: string | null;
  general: string;
  special: string;
  other: string;
  units: string[];
  footnotes: { columns: string[]; value: string; type: string }[] | null;
}

interface HTSEntry {
  code: string;         // e.g. "6110.20.20"
  description: string;  // Full description
  general: string;      // General duty rate
  special: string;      // Special (FTA) rates
  other: string;        // Column 2 rate
  units: string[];      // Units of quantity
  indent: number;       // Hierarchy level
  chapter: string;      // 2-digit chapter
  heading: string;      // 4-digit heading
  footnotes: string[];  // Relevant footnotes (e.g., "See 9903.88.15")
}

interface HTSLookupData {
  metadata: {
    source: string;
    apiUrl: string;
    downloadedAt: string;
    totalRecords: number;
    entriesWithRates: number;
    version: string;
    note: string;
  };
  entries: HTSEntry[];
}

async function main() {
  console.log("📥 Downloading full HTS schedule from USITC...");
  console.log(`   URL: ${API_URL}`);

  const response = await fetch(API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`USITC API returned ${response.status}: ${response.statusText}`);
  }

  const raw: RawHTSRecord[] = await response.json();
  console.log(`   ✅ Downloaded ${raw.length} total records`);

  // Build parent description chain for context
  const parentDescriptions: string[] = [];

  // Process into optimized entries — only keep records with HTS codes
  const entries: HTSEntry[] = [];
  for (const r of raw) {
    const indent = parseInt(r.indent) || 0;

    // Track parent descriptions for building full context
    parentDescriptions[indent] = r.description;
    // Clear deeper levels
    for (let i = indent + 1; i < parentDescriptions.length; i++) {
      parentDescriptions[i] = "";
    }

    // Skip records without HTS codes (these are just category headers)
    if (!r.htsno) continue;

    // Build full description with parent context
    const parts = parentDescriptions.slice(0, indent).filter(Boolean);
    const fullDescription =
      parts.length > 0 ? `${parts.join(" > ")} > ${r.description}` : r.description;

    const code = r.htsno.replace(/\./g, "").replace(/\s/g, "");
    const chapter = code.slice(0, 2);
    const heading = code.slice(0, 4);

    // Extract footnote text
    const footnotes = (r.footnotes || []).map((f) => f.value.trim()).filter(Boolean);

    entries.push({
      code: r.htsno,
      description: fullDescription,
      general: r.general || "",
      special: r.special || "",
      other: r.other || "",
      units: r.units || [],
      indent,
      chapter,
      heading,
      footnotes,
    });
  }

  const entriesWithRates = entries.filter((e) => e.general).length;

  const output: HTSLookupData = {
    metadata: {
      source: "U.S. International Trade Commission (USITC)",
      apiUrl: API_URL,
      downloadedAt: new Date().toISOString(),
      totalRecords: entries.length,
      entriesWithRates,
      version: "2026 HTS (auto-detected from USITC current release)",
      note:
        "Run 'pnpm run sync-hts' to update. " +
        "USITC publishes revisions every 1-3 weeks. " +
        "Check https://hts.usitc.gov/download for latest revision.",
    },
    entries,
  };

  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 0));
  const sizeMB = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1);

  console.log(`\n📊 Processing results:`);
  console.log(`   Total entries with HTS codes: ${entries.length}`);
  console.log(`   Entries with duty rates: ${entriesWithRates}`);
  console.log(`   Output size: ${sizeMB} MB`);
  console.log(`   Output path: ${OUTPUT_PATH}`);
  console.log(`\n✅ HTS lookup data saved successfully!`);
}

main().catch((err) => {
  console.error("❌ Failed to sync HTS data:", err);
  process.exit(1);
});
