# Data Provenance — Tariff Compliance Copilot

This document describes the data sources, retrieval methods, update procedures, and fallback strategies used by the Tariff Compliance Copilot platform.

---

## 1. USITC Harmonized Tariff Schedule (HTS)

### Source
- **Provider:** U.S. International Trade Commission (USITC)
- **Website:** https://hts.usitc.gov
- **License:** Public domain (U.S. Government work, 17 U.S.C. § 105)
- **Authority:** The USITC is the official source for the U.S. Harmonized Tariff Schedule

### Data Retrieved
| Field | Description | Example |
|-------|-------------|---------|
| `htsno` | 4-10 digit HTS code with dots | `6110.20.2079` |
| `description` | Product classification text | `Sweaters, pullovers of cotton` |
| `general` | Column 1 (MFN) duty rate | `16.5%` |
| `special` | FTA/preferential rates with country codes | `Free (AU,BH,CL,...)` |
| `other` | Column 2 (non-MFN) duty rate | `54.5%` |
| `units` | Measurement units | `["doz.", "kg"]` |
| `indent` | Hierarchy nesting level | `4` |
| `footnotes` | Regulatory notes (e.g., Section 301 refs) | `See 9903.88.15` |

### Retrieval Methods

#### Method 1: Live API (Primary)
- **Endpoint:** `https://hts.usitc.gov/reststop/search?keyword={query}`
- **Authentication:** None required
- **Rate Limiting:** No documented limits (use responsibly)
- **Timeout:** 8 seconds (configured in audit tools)
- **Used by:** `lookup_hts_code` tool during real-time audits

#### Method 2: Local Fallback (Offline/Degraded Mode)
- **Data File:** `src/lib/data/hts-lookup.json`
- **Source API:** `https://hts.usitc.gov/reststop/exportList?from=0100&to=9999&format=JSON&styles=false`
- **Records:** ~13,900 entries with duty rates (from ~35,700 total)
- **File Size:** ~6 MB (minified JSON)
- **Used when:** Live API fails, times out, or returns errors

#### Method 3: Bulk Download (For Database Seeding)
- **URL Pattern:** `https://www.usitc.gov/sites/default/files/tata/hts/hts_{year}_{edition}_{format}.{ext}`
- **Formats:** JSON, CSV, XLSX, PDF
- **Catalog:** https://catalog.data.gov/dataset/harmonized-tariff-schedule-of-the-united-states-2024

### Update Frequency
| Edition Type | Frequency | Trigger |
|-------------|-----------|---------|
| Basic Edition | Annual (December) | New calendar year tariff schedule |
| Revisions | Every 1-3 weeks | FTA rate changes, corrections, proclamations |
| Current | 2026 HTS Rev. 4 | Published February 25, 2026 |

### Update Procedure

```bash
# Download latest HTS data and rebuild local fallback
pnpm run sync-hts
```

This script (`scripts/sync-hts-data.ts`):
1. Calls the USITC export API for all chapters (01-99)
2. Filters to entries with HTS codes and duty rates
3. Builds parent-description chains for full context
4. Writes optimized JSON to `src/lib/data/hts-lookup.json`
5. Records download timestamp and metadata

**When to run:**
- After USITC publishes a new revision (check https://hts.usitc.gov/download)
- Monthly as a routine refresh
- Before major deployments
- After the annual basic edition is published (December)

### Fallback Architecture

```
User triggers audit
       ↓
lookup_hts_code tool
       ↓
  ┌─── Try live USITC API (8s timeout) ───┐
  │                                        │
  │  Success → Return live results         │
  │              (source: "live_usitc_api") │
  │                                        │
  │  Failure → Use local fallback          │
  │              (source: "local_fallback") │
  │              + log warning              │
  │              + include data age         │
  └────────────────────────────────────────┘
```

The agent receives a `source` field in every response so it knows whether data came from the live API or local fallback, and can note this in its audit findings.

---

## 2. Trade Remedies Data

### Section 301 Tariffs
- **Source:** Office of the U.S. Trade Representative (USTR)
- **Reference:** Federal Register notices, USTR 301 tariff lists
- **Implementation:** Hardcoded in `check_trade_remedies` tool based on:
  - Country of origin (CN = China triggers 301 checks)
  - HTS chapter (Ch. 61-63 textiles → List 4A at 7.5%, others → Lists 1-3 at 25%)
  - HTS provision references (9903.88.01-03, 9903.88.15)
- **Update procedure:** Manual code update when USTR modifies tariff lists
- **Last verified:** February 2026

### Section 232 Tariffs
- **Source:** U.S. Department of Commerce, Bureau of Industry and Security
- **Reference:** Presidential Proclamations on steel (25%) and aluminum (10%)
- **Implementation:** Hardcoded prefix matching:
  - Steel: HTS headings 7206-7229 → 25%
  - Aluminum: HTS headings 7601, 7604-7609 → 10%
- **Update procedure:** Manual code update when proclamations change
- **Last verified:** February 2026

### Free Trade Agreements
- **Source:** CBP, USTR
- **Covered:** USMCA (MX, CA), KORUS FTA (KR), AUSFTA (AU)
- **Implementation:** Country code matching in `check_trade_remedies`

---

## 3. Duty Calculation Formulas

### Merchandise Processing Fee (MPF)
- **Rate:** 0.3464% of entered value
- **Minimum:** $31.67
- **Maximum:** $614.35
- **Source:** 19 U.S.C. § 58c(a)(9), CBP
- **Update frequency:** Adjusted periodically by CBP

### Harbor Maintenance Fee (HMF)
- **Rate:** 0.125% of entered value
- **Applicability:** Ocean shipments only
- **Source:** 26 U.S.C. § 4461, CBP
- **Note:** Does not apply to air or land shipments

### General Duty Rates
- **Source:** USITC HTS database (see Section 1)
- **Implementation:** Retrieved via `lookup_hts_code`, passed to `calculate_expected_duties`

---

## 4. CBP Form 7501 Reference

### Source
- **Provider:** U.S. Customs and Border Protection (CBP)
- **Form:** CBP Form 7501 — Entry Summary
- **Fields:** 47 fields across 5 sections (27 pages)
- **Reference materials:** `ZIP for Agent/` directory (local copies)
- **Official source:** https://www.cbp.gov/trade/programs-administration/entry-summary/cbp-form-7501

---

## 5. Data Quality & Limitations

### Known Limitations
1. **Section 301 lists are simplified** — The actual USTR lists contain thousands of specific HTS codes. Our implementation uses chapter-level approximations.
2. **AD/CVD rates are not auto-detected** — Antidumping and countervailing duty rates are highly product/country-specific and require case-by-case lookup from CBP.
3. **Special rates require FTA qualification** — The `special` field shows preferential rates but actual eligibility depends on rules of origin certification.
4. **Duty rates can be compound** — Some rates combine ad valorem + specific duties (e.g., "10% + 1.7¢/kg"). Our calculator handles percentage-based rates only.

### Data Freshness
- The local HTS fallback includes a `downloadedAt` timestamp
- The live API always returns current data
- The `source` field in tool results distinguishes between live and fallback data
- Stale data is flagged with a `dataAge` field in fallback responses

---

## 6. System Self-Update Profile

### Automated Updates
The system is designed for easy data refresh:

| Component | Update Method | Command/Action |
|-----------|--------------|----------------|
| HTS codes & rates | Script | `pnpm run sync-hts` |
| Section 301 lists | Code change | Edit `check_trade_remedies` in `audit-tools.ts` |
| Section 232 prefixes | Code change | Edit steel/aluminum prefix arrays |
| MPF/HMF rates | Code change | Edit `calculate_expected_duties` |
| FTA country lists | Code change | Edit FTA arrays in `check_trade_remedies` |

### Future Automation Opportunities
1. **GitHub Action for monthly HTS sync** — Schedule `pnpm run sync-hts` as a cron job
2. **USITC revision detection** — Monitor https://hts.usitc.gov/download for new revisions
3. **Section 301 auto-update** — Parse USTR Federal Register notices for list changes
4. **MPF/HMF rate monitoring** — Track CBP announcements for fee adjustments
