/**
 * Audit Agent Tools — Real tools that Claude calls autonomously
 * during trade document compliance audits.
 *
 * Tools:
 *  1. lookup_hts_code     — Search USITC HTS database
 *  2. check_trade_remedies — Determine Section 301/232 applicability
 *  3. calculate_expected_duties — Compute expected duties & fees
 *  4. report_finding      — Record an audit finding
 *  5. calculate_risk_score — Compute overall compliance risk
 */

import { tool } from "ai";
import { z } from "zod";
import { searchLocalHTS } from "@/lib/services/hts-fallback";

/* ------------------------------------------------------------------ */
/* Tool 1: USITC HTS Lookup                                          */
/* ------------------------------------------------------------------ */

export const lookupHtsCode = tool({
  description:
    "Search the USITC Harmonized Tariff Schedule database for HTS code " +
    "details including duty rates, descriptions, and special provisions. " +
    "Use this to validate HTS codes found in trade documents.",
  inputSchema: z.object({
    keyword: z
      .string()
      .describe("HTS code or product keyword to search for in the USITC database"),
  }),
  execute: async ({ keyword }) => {
    // Try live USITC API first
    try {
      const url = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(keyword)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`USITC API returned ${response.status}`);
      }

      const raw: Record<string, unknown>[] = await response.json();

      // Build rate inheritance (child entries inherit parent rates)
      // Stat suffix entries (10-digit codes) often have no rate of their own
      let lastGeneral = "";
      let lastSpecial = "";
      let lastOther = "";
      const results = raw.slice(0, 20).map((r: Record<string, unknown>) => {
        const general = r.general as string;
        const special = r.special as string;
        const other = r.other as string;
        if (general) { lastGeneral = general; lastSpecial = special || ""; lastOther = other || ""; }
        return {
          htsCode: r.htsno as string,
          statisticalSuffix: (r.statisticalSuffix as string) || "",
          description: r.description as string,
          generalRate: general || lastGeneral || "See parent heading",
          specialRate: special || lastSpecial || "",
          otherRate: other || lastOther || "",
          indent: r.indent as string,
          units: r.units || [],
        };
      });

      return { source: "live_usitc_api", resultCount: raw.length, results };
    } catch {
      // Fallback to local HTS data
      console.warn("[lookup_hts_code] Live API failed, using local fallback for:", keyword);
      return searchLocalHTS(keyword);
    }
  },
});

/* ------------------------------------------------------------------ */
/* Tool 2: Trade Remedies Check                                       */
/* ------------------------------------------------------------------ */

export const checkTradeRemedies = tool({
  description:
    "Check if a product from a specific country of origin is subject to " +
    "additional trade remedies such as Section 301 tariffs (China), " +
    "Section 232 tariffs (steel/aluminum), or AD/CVD duties. " +
    "Returns all applicable additional duties.",
  inputSchema: z.object({
    countryOfOrigin: z
      .string()
      .describe("Two-letter country code, e.g. CN for China, VN for Vietnam"),
    htsCode: z
      .string()
      .describe("The 8-10 digit HTS code to check"),
    productDescription: z
      .string()
      .describe("Brief product description for context"),
  }),
  execute: async ({ countryOfOrigin, htsCode, productDescription }) => {
    const countryNames: Record<string, string> = {
      CN: "China",
      VN: "Vietnam",
      MX: "Mexico",
      IN: "India",
      BD: "Bangladesh",
      TH: "Thailand",
      KR: "South Korea",
      TW: "Taiwan",
      CA: "Canada",
      DE: "Germany",
      JP: "Japan",
    };

    const remedies: {
      type: string;
      rate: number;
      list?: string;
      htsProvision?: string;
      authority: string;
      note?: string;
    }[] = [];

    const chapter = htsCode.slice(0, 2);

    // Section 122 — 10% tariff on ALL imports regardless of country or product
    remedies.push({
      type: "Section 122",
      rate: 10,
      htsProvision: "19 USC §1322",
      authority: "CBP",
      note: "10% ad valorem tariff on all imports under Section 122",
    });

    // Section 301 tariffs (China-origin goods) — 25% on all Chinese imports
    if (countryOfOrigin === "CN") {
      remedies.push({
        type: "Section 301",
        rate: 25,
        list: "Lists 1-4",
        htsProvision: "9903.88.01-03",
        authority: "USTR",
        note: "Additional 25% ad valorem duty on Chinese imports",
      });
    }

    // Section 232 tariffs — comprehensive HTS code coverage
    // Steel core (Ch. 72): semi-finished, flat-rolled, bars, wire, tubes
    const steelCorePrefixes = [
      "7206", "7207", "7208", "7209", "7210", "7211", "7212",
      "7213", "7214", "7215", "7216", "7217", "7218", "7219",
      "7220", "7221", "7222", "7223", "7224", "7225", "7226",
      "7227", "7228", "7229",
    ];
    // Steel articles (Ch. 73): sheet piling, rail, tubes, pipes, fittings
    const steelArticlePrefixes = [
      "7301", "7302", "7303", "7304", "7305", "7306",
      "7307", "7308", "7309", "7310", "7311", "7312",
      "7313", "7314", "7315", "7316",
    ];
    // Steel derivatives (Ch. 73 continued): nails, screws, wire products, springs, kitchenware
    const steelDerivativePrefixes = [
      "7317", "7318", "7319", "7320", "7321", "7322",
      "7323", "7324", "7325", "7326",
    ];
    // Aluminum (Ch. 76): unwrought, plates, foil, tubes, structures
    const aluminumPrefixes = [
      "7601", "7602", "7603", "7604", "7605", "7606",
      "7607", "7608", "7609", "7610", "7611", "7612",
      "7613", "7614", "7615", "7616",
    ];

    const isSteel25 = steelCorePrefixes.some((p) => htsCode.startsWith(p)) ||
      steelArticlePrefixes.some((p) => htsCode.startsWith(p));
    const isSteelDerivative = steelDerivativePrefixes.some((p) => htsCode.startsWith(p));
    const isAluminum = aluminumPrefixes.some((p) => htsCode.startsWith(p));

    if (isSteel25) {
      remedies.push({
        type: "Section 232",
        rate: 25,
        htsProvision: "9903.80.01",
        authority: "DOC/BIS",
        note: "25% tariff on steel imports (Ch. 72-73 core) for national security",
      });
    }
    if (isSteelDerivative) {
      // Steel derivatives can have both the base 232 rate AND derivative surcharge
      remedies.push({
        type: "Section 232 (Derivative)",
        rate: 25,
        htsProvision: "9903.80.01",
        authority: "DOC/BIS",
        note: "25% base Section 232 tariff on steel derivative articles",
      });
      remedies.push({
        type: "Section 232 Derivative Surcharge",
        rate: 25,
        htsProvision: "9903.81.90",
        authority: "DOC/BIS",
        note: "Additional 25% derivative tariff (total 50%) on steel derivative articles (HTS 7317-7326)",
      });
    }
    if (isAluminum) {
      remedies.push({
        type: "Section 232",
        rate: 10,
        htsProvision: "9903.85.01",
        authority: "DOC/BIS",
        note: "10% tariff on aluminum imports for national security",
      });
    }

    // Free trade agreements
    const ftas: string[] = [];
    if (["MX", "CA"].includes(countryOfOrigin)) ftas.push("USMCA");
    if (["KR"].includes(countryOfOrigin)) ftas.push("KORUS FTA");
    if (["AU"].includes(countryOfOrigin)) ftas.push("AUSFTA");

    return {
      countryOfOrigin,
      countryName: countryNames[countryOfOrigin] || countryOfOrigin,
      htsCode,
      productDescription,
      remediesApply: remedies.length > 0,
      remedies,
      freeTradeAgreements: ftas,
      ftaEligible: ftas.length > 0,
    };
  },
});

/* ------------------------------------------------------------------ */
/* Tool 3: Duty Calculation                                           */
/* ------------------------------------------------------------------ */

export const calculateExpectedDuties = tool({
  description:
    "Calculate the expected duties and fees for a U.S. import transaction. " +
    "Returns a complete breakdown of general duty, Section 122, Section 301/232, " +
    "MPF (Merchandise Processing Fee), HMF (Harbor Maintenance Fee), " +
    "and total landed cost.",
  inputSchema: z.object({
    enteredValue: z
      .number()
      .describe("Total entered value in USD (typically CIF value)"),
    generalDutyRatePercent: z
      .number()
      .describe("General duty rate as a percentage, e.g. 16.5 for 16.5%"),
    section122RatePercent: z
      .number()
      .default(10)
      .describe("Section 122 tariff rate as a percentage (default 10% — applies to ALL imports)"),
    section301RatePercent: z
      .number()
      .default(0)
      .describe("Section 301 additional duty rate as a percentage"),
    section232RatePercent: z
      .number()
      .default(0)
      .describe("Section 232 additional duty rate as a percentage"),
    adCvdRatePercent: z
      .number()
      .default(0)
      .describe("AD/CVD (antidumping/countervailing) duty rate"),
    shippingMethod: z
      .enum(["ocean", "air", "land"])
      .describe("Mode of transport — HMF only applies to ocean shipments"),
  }),
  execute: async ({
    enteredValue,
    generalDutyRatePercent,
    section122RatePercent,
    section301RatePercent,
    section232RatePercent,
    adCvdRatePercent,
    shippingMethod,
  }) => {
    const generalDuty = enteredValue * (generalDutyRatePercent / 100);
    const section122 = enteredValue * (section122RatePercent / 100);
    const section301 = enteredValue * (section301RatePercent / 100);
    const section232 = enteredValue * (section232RatePercent / 100);
    const adCvd = enteredValue * (adCvdRatePercent / 100);
    const mpfRaw = enteredValue * 0.003464;
    const mpf = Math.max(31.67, Math.min(614.35, mpfRaw));
    const hmf = shippingMethod === "ocean" ? enteredValue * 0.00125 : 0;

    const totalDuties = generalDuty + section122 + section301 + section232 + adCvd + mpf + hmf;

    return {
      enteredValue: enteredValue.toFixed(2),
      generalDuty: {
        rate: `${generalDutyRatePercent}%`,
        amount: generalDuty.toFixed(2),
      },
      section122: {
        rate: `${section122RatePercent}%`,
        amount: section122.toFixed(2),
        applicable: section122RatePercent > 0,
      },
      section301: {
        rate: `${section301RatePercent}%`,
        amount: section301.toFixed(2),
        applicable: section301RatePercent > 0,
      },
      section232: {
        rate: `${section232RatePercent}%`,
        amount: section232.toFixed(2),
        applicable: section232RatePercent > 0,
      },
      adCvd: {
        rate: `${adCvdRatePercent}%`,
        amount: adCvd.toFixed(2),
        applicable: adCvdRatePercent > 0,
      },
      mpf: {
        rate: "0.3464%",
        amount: mpf.toFixed(2),
        note: `Bounded: min $31.67, max $614.35 (raw: $${mpfRaw.toFixed(2)})`,
      },
      hmf: {
        rate: shippingMethod === "ocean" ? "0.125%" : "N/A",
        amount: hmf.toFixed(2),
        applicable: shippingMethod === "ocean",
      },
      totalDuties: totalDuties.toFixed(2),
      effectiveDutyRate: ((totalDuties / enteredValue) * 100).toFixed(2) + "%",
      totalLandedCost: (enteredValue + totalDuties).toFixed(2),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Tool 4: Report Audit Finding                                       */
/* ------------------------------------------------------------------ */

export const reportFinding = tool({
  description:
    "Record an audit finding. Call this tool for EACH compliance check you " +
    "perform. You MUST report a finding for every field you check. " +
    "Severity: 'info' = VERIFIED CORRECT (field matches between documents), " +
    "'warning' = NEEDS REVIEW (potential issue or missing data), " +
    "'error' = DISCREPANCY FOUND (definite mismatch requiring action). " +
    "Always include the actual values from both documents when available.",
  inputSchema: z.object({
    field: z
      .string()
      .describe(
        "The field being checked, e.g. 'HTS Code', 'Entered Value', 'Duty Rate', 'Country of Origin'"
      ),
    severity: z
      .enum(["info", "warning", "error"])
      .describe("info = correct, warning = potential issue, error = discrepancy"),
    title: z.string().describe("Short title summarizing the finding"),
    description: z
      .string()
      .describe("Detailed description of what was checked and the result"),
    invoiceValue: z
      .string()
      .optional()
      .describe("The value from the Commercial Invoice"),
    form7501Value: z
      .string()
      .optional()
      .describe("The value from Form 7501"),
    recommendation: z
      .string()
      .optional()
      .describe("Recommended corrective action if an issue was found"),
  }),
  execute: async (finding) => {
    // Simply echo the finding back — the client extracts these from tool calls
    return { recorded: true, ...finding };
  },
});

/* ------------------------------------------------------------------ */
/* Tool 5: Risk Score Calculation                                     */
/* ------------------------------------------------------------------ */

export const calculateRiskScore = tool({
  description:
    "Calculate the overall compliance risk score (0-100) based on the audit " +
    "findings. Call this AFTER all findings have been reported. " +
    "Higher scores indicate greater compliance risk.",
  inputSchema: z.object({
    errorCount: z.number().describe("Number of error-severity findings"),
    warningCount: z.number().describe("Number of warning-severity findings"),
    infoCount: z.number().describe("Number of info/verified findings"),
    notes: z
      .string()
      .optional()
      .describe("Additional context about the risk assessment"),
  }),
  execute: async ({ errorCount, warningCount, infoCount, notes }) => {
    // Risk formula: errors contribute 25pts each, warnings 10pts, infos 2pts baseline
    const rawScore = errorCount * 25 + warningCount * 10;
    const score = Math.min(100, rawScore);
    const level =
      score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

    return {
      riskScore: score,
      level,
      errorCount,
      warningCount,
      infoCount,
      totalChecks: errorCount + warningCount + infoCount,
      notes: notes || "",
      recommendation:
        level === "High"
          ? "Immediate review required — significant compliance discrepancies found."
          : level === "Medium"
            ? "Review recommended — some potential issues identified."
            : "Low risk — documents appear compliant with minor notes.",
    };
  },
});

/* ------------------------------------------------------------------ */
/* Export all tools as a single object                                 */
/* ------------------------------------------------------------------ */

export const auditTools = {
  lookup_hts_code: lookupHtsCode,
  check_trade_remedies: checkTradeRemedies,
  calculate_expected_duties: calculateExpectedDuties,
  report_finding: reportFinding,
  calculate_risk_score: calculateRiskScore,
};
