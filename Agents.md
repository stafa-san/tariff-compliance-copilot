# Tariff Compliance Copilot

## Agentic AI Challenge Submission
**Kautz-Uible Economics Institute, Spring 2026**

**GitHub:** https://github.com/stafa-san/tariff-compliance-copilot
**Live Application:** https://tariff-compliance-copilot.vercel.app

---

## 1. The Tariff Problem: Why This Matters Now

U.S. trade policy is in a period of unprecedented volatility. In just the past two years, tariff rates have been announced, revised, paused, and re-imposed, sometimes within the same week. Section 301 tariffs on Chinese goods have escalated from 7.5% to 25%. New Section 122 reciprocal tariffs (10% on all imports) were introduced. Section 232 steel and aluminum tariffs continue to shift with derivative surcharges reaching 50%.

**This constant change is the core problem.** Traditional compliance methods like spreadsheets, manual lookups, and hired customs brokers simply cannot keep pace. A duty rate that was correct last month may be wrong today. A single misclassification or outdated rate can trigger CBP penalties of up to 4× the unpaid duties.

For the **97% of U.S. importers that are small-to-mid-size businesses**, this compliance burden is existential. Large enterprises employ dedicated customs departments; SMBs are left guessing. **Tariff Compliance Copilot** closes that gap with an autonomous AI agent that audits import documents in real time, using live government data and current tariff schedules.

---

## 2. Agentic Architecture

### 2.1 How the AI Agent Works

The audit agent is built on **OpenAI's GPT-4o** using the **Vercel AI SDK** with streaming and multi-step tool calling. Unlike a simple chatbot that generates text, the agent autonomously decides which tools to call, in what order, and how to interpret the results, making it truly agentic.

The agent uses `temperature: 0` for deterministic, consistent audit results across runs. This is critical for compliance work where reproducibility matters.

```
User uploads documents (Commercial Invoice + CBP Form 7501)
       ↓
GPT-4o Agent (temperature: 0)
       ↓
  ┌─────────────────────────────────────┐
  │  Autonomous Tool-Calling Loop       │
  │  (up to 12 steps per audit)         │
  │                                     │
  │  1. lookup_hts_code                 │ ← Calls live USITC API
  │  2. check_trade_remedies            │ ← Evaluates Section 301/232/122
  │  3. calculate_expected_duties       │ ← Computes all fees and duties
  │  4. report_finding                  │ ← Records each compliance check
  │  5. calculate_risk_score            │ ← Produces overall risk assessment
  └─────────────────────────────────────┘
       ↓
Structured audit report with 7 finding groups, risk score, and CSV export
```

### 2.2 HTS Provision Code Mapping

A key innovation is the agent's built-in provision code mapping table, which ensures it correctly identifies tariff lines on the 7501:

| HTS Provision | Tariff Section | Expected Rate | Description |
|---|---|---|---|
| 9903.88.01-03 | Section 301 (Lists 1-3) | 25% | China tariff, most goods |
| 9903.88.15 | Section 301 (List 4A) | 25% (was 7.5%) | If 7501 shows 7.5%, flag as outdated |
| 9903.03.01 | Section 122 | 10% | Reciprocal tariff on ALL imports |
| 9903.80.01 | Section 232 (Steel) | 25% | Steel (Ch. 72-73) |
| 9903.85.01 | Section 232 (Aluminum) | 10% | Aluminum (Ch. 76) |
| 9903.81.90 | Section 232 (Derivative) | 50% | Steel derivative surcharge |

This mapping prevents the most common compliance errors: confusing Section 122 (9903.03.01 at 10%) with Section 232 aluminum (9903.85.01 at 10%), or accepting the outdated 7.5% Section 301 rate when the current rate is 25%.

### 2.3 Tool Definitions

Each tool is defined with a Zod schema for type-safe input validation and a real execution function:

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `lookup_hts_code` | Validate HTS classification against official tariff schedule | **Live USITC REST API** (hts.usitc.gov) with local fallback (~13,900 entries) |
| `check_trade_remedies` | Determine Section 301, 232, 122 applicability | Trade remedy schedules by country and HTS chapter |
| `calculate_expected_duties` | Compute general duty + special tariffs + MPF + HMF | CBP fee formulas (MPF: 0.3464%, HMF: 0.125%) |
| `report_finding` | Record individual audit finding with severity level | Agent's analysis (info/warning/error) |
| `calculate_risk_score` | Compute 0-100 compliance risk score | Weighted formula based on findings |

### 2.4 Structured 7-Group Audit Report

The agent produces findings organized into 7 groups, each containing detailed field-level checks:

1. **HTS Code & General Duty**: code validity, description match, general duty rate vs USITC
2. **Section 122 (Reciprocal Tariff)**: verifies 9903.03.01 at 10% on all imports
3. **Section 301 (China Tariff)**: flags outdated 7.5% rate, confirms 25% requirement
4. **Section 232 (Steel/Aluminum)**: verifies steel 25%, aluminum 10%, derivatives 50%
5. **Values & Duties**: entered value, calculated vs declared duties, math checks
6. **Parties & Logistics**: importer, manufacturer, carrier, broker, country, ports
7. **Quantities & Merchandise**: descriptions, quantities, weights, entry numbers

Each check is marked: ✅ verified | ⚠️ needs review | ❌ discrepancy found

### 2.5 Data Resilience: USITC Fallback System

The `lookup_hts_code` tool implements a two-tier data strategy:

1. **Primary: Live USITC API** that calls `hts.usitc.gov/reststop/search` with an 8-second timeout
2. **Fallback: Local HTS database** with ~13,900 entries and duty rates, downloaded via `pnpm run sync-hts`

Every response includes a `source` field (`"live_usitc_api"` or `"local_fallback"`) so the agent knows data provenance and can note it in findings.

### 2.6 Key Technical Decisions

- **Streaming with Tool Calls**: The agent streams responses to the UI in real-time, including tool call progress indicators, so users watch the audit happen live.
- **Deterministic Output**: `temperature: 0` ensures consistent, reproducible audit results, which is essential for compliance work.
- **Provider-Agnostic Tools**: Tool definitions use Zod schemas via the Vercel AI SDK, making them portable across AI providers (OpenAI, Anthropic, etc.).
- **Server-Side Execution**: All tools execute server-side via Next.js API routes, keeping API keys secure and enabling direct calls to the USITC API without CORS issues.
- **Autonomous Decision-Making**: The agent decides which tools to call and in what order based on document content. It is not following a hardcoded script.
- **Graceful Degradation**: If the live USITC API is unavailable, the agent automatically falls back to local data, ensuring audits complete even without internet access.

---

## 3. Economic Relevance

### 3.1 Core Economic Concepts

The platform directly addresses several key economic concepts from international trade theory:

**Tariff Incidence & Burden Shifting**
Tariffs function as a tax on imported goods, with the economic burden split between importers/consumers (through higher prices) and foreign producers (through lower export prices). The elasticity of supply and demand determines the split. Our tool helps importers understand their actual tariff burden by calculating precise duty amounts, enabling better pricing decisions.

**Deadweight Loss from Tariffs**
Every tariff creates deadweight loss, meaning welfare reductions beyond the revenue generated. When duties are miscalculated (either overpaid or underpaid), additional market distortions arise. Our audit agent catches these errors, reducing the inefficiency of the tariff system.

**Trade Diversion (Section 301 Effects)**
Section 301 tariffs on Chinese goods (now 25% across all lists) have caused massive trade diversion, with importers shifting sourcing to Vietnam, Bangladesh, Thailand, and other countries. Our agent's `check_trade_remedies` tool evaluates these country-specific tariffs, helping importers understand the true cost of different sourcing decisions. The Scenario Simulator lets importers model these diversion decisions directly.

**Compliance Costs as Market Friction**
Compliance costs represent a market friction that falls disproportionately on SMBs. While large corporations employ dedicated customs departments, small importers bear the same per-entry complexity with far fewer resources. By automating the audit process, our tool reduces this friction and promotes more efficient allocation of compliance resources.

**The Laffer Curve of Trade Enforcement**
CBP penalties (up to 4× unpaid duties) create a strong enforcement incentive, but the complexity of the tariff schedule means even good-faith importers make errors. Our tool helps ensure voluntary compliance, which economic research shows is more efficient than enforcement-driven compliance.

### 3.2 Real-World Impact

- **$3.4 trillion** in goods were imported to the U.S. in 2024
- **Section 301 tariffs** generated over $79 billion in tariff revenue (2018 to 2023)
- **SMBs account for 97%** of U.S. importers but lack compliance infrastructure
- **Average CBP penalty** for classification errors: $10,000 to $50,000 per entry
- **MPF alone** generates ~$2.7 billion annually for CBP

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Server-side rendering, API routes |
| AI | OpenAI GPT-4o via Vercel AI SDK | Autonomous agent with tool calling |
| Streaming | Vercel AI SDK | Real-time streaming with multi-step tool execution |
| UI | Tailwind CSS v4 + shadcn/ui + Radix | Accessible, responsive component library |
| Auth | Firebase Auth | Google SSO + email/password |
| Database | Firebase Firestore | Document storage, shipment records |
| Charts | Recharts | Data visualization for scenarios and reports |
| Forms | React Hook Form + Zod | Type-safe form validation |
| Hosting | Vercel | Edge deployment with serverless functions |
| Language | TypeScript | End-to-end type safety |

---

## 5. Platform Features

### AI-Powered Audit Agent (Primary Feature)
- Autonomous multi-step audit using GPT-4o with real tool calling
- Live USITC HTS database lookup for code validation
- Section 301/232/122 trade remedy evaluation with provision code mapping
- Complete duty calculation (general + special + MPF + HMF)
- 7-group structured findings with field-level severity
- 0-100 compliance risk score
- CSV export for audit records

### HTS Classification Engine
- Product description to HTS code mapping
- Live USITC database integration via server-side proxy
- Duty rate lookup with special provisions

### Duty & Landed Cost Calculator
- Automatic rate determination by country of origin and HTS chapter
- Section 122 (10% all imports), Section 301 (25% China), Section 232 (steel/aluminum)
- Full fee breakdown: general duty, special tariffs, MPF, HMF
- Support for ocean, air, and land shipping methods
- Min/max bounds on MPF ($31.67 to $614.35)

### Tariff Scenario Simulator
- Country-of-origin comparison for sourcing decisions
- Side-by-side duty impact analysis
- Trade diversion cost modeling

### CBP Form 7501 Reference
- Complete field-by-field guide to all 47 fields
- Organized by 5 sections matching the official CBP form
- Contextual tips and validation rules

---

## 6. Verified Audit Results (Live Test)

The following results were produced by the live AI audit agent using real GPT-4o API calls and the USITC database:

**Test Case:** Men's UC Bearcats Hooded Sweatshirt (HTS 6110.20.2079, China origin, 500 pcs @ $18, ocean shipment)

| Check | Severity | Result |
|-------|----------|--------|
| HTS Code Validation | ✅ info | HTS 6110.20.2079 validated in USITC database, 16.5% general rate confirmed |
| General Duty Rate | ✅ info | 16.5% matches USITC database |
| Section 122 (10%) | ✅ info | 9903.03.01 at 10% correctly declared |
| Section 301 Tariff | ❌ error | 7501 declares 7.5% (9903.88.15) but current correct rate is 25% |
| Section 232 | ✅ info | Not applicable (apparel, not steel/aluminum) |
| Entered Value | ✅ info | $9,000 matches across documents |
| Country of Origin | ✅ info | CN consistent on both documents |
| Quantity Units | ⚠️ warning | Invoice shows 500 pieces, 7501 shows 500 DOZ, needs clarification |
| MPF Calculation | ⚠️ warning | 7501 shows $31.18 but minimum is $31.67, $0.49 underpayment |
| HMF Assessment | ❌ error | 7501 shows $0 but HMF should be $11.25 for ocean shipment |

**Key Finding:** The agent correctly flagged the outdated Section 301 rate of 7.5%, a real-world compliance error that would result in underpayment and potential CBP penalties.

---

## 7. File Structure (AI Agent)

```
src/
├── app/
│   ├── api/
│   │   ├── audit/
│   │   │   └── route.ts              ← API route: GPT-4o streaming + tool calling
│   │   └── hts-proxy/
│   │       └── route.ts              ← Server-side USITC proxy (CORS bypass)
│   └── (dashboard)/
│       └── audit/
│           └── page.tsx              ← Audit UI: upload, live progress, results
├── lib/
│   ├── ai/
│   │   ├── audit-tools.ts            ← 5 tool definitions with Zod schemas
│   │   └── audit-prompt.ts           ← System prompt with provision code mapping
│   ├── data/
│   │   └── hts-lookup.json           ← Local HTS fallback (~13,900 entries)
│   └── services/
│       └── hts-fallback.ts           ← Offline HTS search service
scripts/
└── sync-hts-data.ts                  ← USITC data download + processing script
```

---

## 8. How to Run

```bash
# Clone the repository
git clone https://github.com/stafa-san/tariff-compliance-copilot.git
cd tariff-compliance-copilot

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local
# Add: OPENAI_API_KEY=sk-...

# Download latest USITC HTS data (for local fallback)
pnpm run sync-hts

# Start development server
pnpm dev

# Build for production
pnpm build
```

---

## 9. OpenAI GPT-4o Integration Details

### Model Configuration
```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const result = streamText({
  model: openai("gpt-4o"),
  system: AUDIT_SYSTEM_PROMPT,
  messages: await convertToModelMessages(uiMessages),
  tools: auditTools,
  temperature: 0,
  stopWhen: stepCountIs(12),
});

return result.toUIMessageStreamResponse();
```

### Tool Calling Flow
1. User submits document data (Commercial Invoice + Form 7501 fields)
2. The data is sent as a structured prompt to the `/api/audit` endpoint
3. GPT-4o receives the system prompt with the provision code mapping table
4. GPT-4o autonomously calls tools in sequence, receiving results after each call
5. The agent makes up to 12 tool-calling steps per audit
6. Each tool call and result is streamed to the UI in real-time
7. The UI extracts findings, duty calculations, and risk scores from tool results
8. A final structured 7-group audit report is presented with CSV export capability

---

## 10. Team

**Team Members:**
- Mustapha Nasomah
- Tyler Motter

**Competition:** Agentic AI Challenge, Kautz-Uible Economics Institute
**Deadline:** March 9, 2026
