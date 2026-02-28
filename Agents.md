# Agents.md — Tariff Compliance Copilot

## Agentic AI Challenge Submission
**Kautz-Uible Economics Institute — Spring 2026**

---

## 1. Project Overview

**Tariff Compliance Copilot** is an AI-powered U.S. import compliance platform that helps small-to-mid-size businesses (SMBs) navigate the complexities of international trade. The platform's centerpiece is an **autonomous AI audit agent** that cross-checks Commercial Invoices against CBP Entry Summary Forms (Form 7501), validates HTS classifications against the live USITC database, calculates expected duties, and produces actionable compliance reports — all in real time.

**Live Application:** https://tariff-compliance-copilot.vercel.app

---

## 2. The Problem

U.S. import compliance is extraordinarily complex. Importers must correctly classify goods under 10-digit Harmonized Tariff Schedule (HTS) codes, apply the correct duty rates (including Section 301/232 trade remedy tariffs), calculate fees (MPF, HMF), and reconcile values across multiple documents — all under threat of CBP penalties up to 4× the unpaid duties.

For SMBs, this compliance burden is disproportionately costly. Large enterprises employ dedicated customs brokers and compliance teams; small importers often rely on manual spreadsheets and guesswork. A single misclassification can result in thousands of dollars in penalties or seized merchandise.

---

## 3. Agentic Architecture

### 3.1 How the AI Agent Works

The audit agent is built on **Anthropic's Claude API** using the **Vercel AI SDK** with streaming and multi-step tool calling. Unlike a simple chatbot that generates text, the agent autonomously decides which tools to call, in what order, and how to interpret the results — making it truly agentic.

```
User uploads documents
       ↓
Claude Agent (claude-sonnet-4)
       ↓
  ┌────┴────┐
  │  Autonomous Tool-Calling Loop  │
  │  (up to 15 steps per audit)    │
  │                                │
  │  1. lookup_hts_code           │ ← Calls live USITC API
  │  2. check_trade_remedies      │ ← Evaluates Section 301/232/AD/CVD
  │  3. calculate_expected_duties │ ← Computes all fees and duties
  │  4. report_finding            │ ← Records each compliance check
  │  5. calculate_risk_score      │ ← Produces overall risk assessment
  └────┬────┘
       ↓
Structured audit report with findings, risk score, and CSV export
```

### 3.2 Tool Definitions

Each tool is defined with a Zod schema for type-safe input validation and a real execution function:

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `lookup_hts_code` | Validate HTS classification against official tariff schedule | **Live USITC REST API** (hts.usitc.gov) |
| `check_trade_remedies` | Determine Section 301, 232, AD/CVD applicability | Trade remedy schedules by country and HTS chapter |
| `calculate_expected_duties` | Compute general duty + special tariffs + MPF + HMF | CBP fee formulas (MPF: 0.3464%, HMF: 0.125%) |
| `report_finding` | Record individual audit finding with severity level | Agent's analysis (info/warning/error) |
| `calculate_risk_score` | Compute 0-100 compliance risk score | Weighted formula based on findings |

### 3.3 Multi-Step Reasoning

The agent follows a structured 6-step audit workflow:

1. **Validate HTS Classification** — Searches the USITC database for the HTS code, verifies it exists and matches the merchandise description, compares the official duty rate with the declared rate.

2. **Check Trade Remedies** — Evaluates whether Section 301 tariffs (China), Section 232 tariffs (steel/aluminum), or AD/CVD duties apply based on country of origin and HTS code.

3. **Calculate Expected Duties** — Computes the full duty breakdown: general duty, Section 301/232 surcharges, Merchandise Processing Fee (MPF with min/max bounds), Harbor Maintenance Fee (ocean only), and total landed cost.

4. **Cross-Check Documents** — Compares entered values, quantities, country of origin, and manufacturer information between the Commercial Invoice and Form 7501.

5. **Report Findings** — Records each compliance check with a severity level (info = verified correct, warning = needs review, error = definite discrepancy) and specific recommendations.

6. **Risk Assessment** — Calculates an overall compliance risk score (0-100) with a risk level (Low/Medium/High) and actionable recommendations.

### 3.4 Key Technical Decisions

- **Streaming with Tool Calls**: The agent streams its responses to the UI in real-time, including tool call progress indicators, so users can watch the audit happen live.
- **Server-Side Execution**: All tools execute server-side via Next.js API routes, keeping API keys secure and enabling direct calls to the USITC API without CORS issues.
- **Autonomous Decision-Making**: The agent decides which tools to call and in what order based on the document content — it is not following a hardcoded script. Claude's reasoning determines the audit flow.
- **Up to 15 steps per audit**: The `stopWhen: stepCountIs(15)` configuration allows Claude to make multiple sequential tool calls in a single audit session, enabling thorough multi-step analysis.

---

## 4. Economic Relevance

### 4.1 Core Economic Concepts

The platform directly addresses several key economic concepts from international trade theory:

**Tariff Incidence & Burden Shifting**
Tariffs function as a tax on imported goods, with the economic burden split between importers/consumers (through higher prices) and foreign producers (through lower export prices). The elasticity of supply and demand determines the split. Our tool helps importers understand their actual tariff burden by calculating precise duty amounts, enabling better pricing decisions.

**Deadweight Loss from Tariffs**
Every tariff creates deadweight loss — welfare reductions beyond the revenue generated. When duties are miscalculated (either overpaid or underpaid), additional market distortions arise. Our audit agent catches these errors, reducing the inefficiency of the tariff system.

**Trade Diversion (Section 301 Effects)**
Section 301 tariffs on Chinese goods (7.5%–25% additional) have caused massive trade diversion, with importers shifting sourcing to Vietnam, Bangladesh, Thailand, and other countries. Our agent's `check_trade_remedies` tool evaluates these country-specific tariffs, helping importers understand the true cost of different sourcing decisions.

**Compliance Costs as Market Friction**
Compliance costs represent a market friction that falls disproportionately on SMBs. While large corporations employ dedicated customs departments, small importers bear the same per-entry complexity with far fewer resources. By automating the audit process, our tool reduces this friction and promotes more efficient allocation of compliance resources.

**The Laffer Curve of Trade Enforcement**
CBP penalties (up to 4× unpaid duties) create a strong enforcement incentive, but the complexity of the tariff schedule means even good-faith importers make errors. Our tool helps ensure voluntary compliance, which economic research shows is more efficient than enforcement-driven compliance.

### 4.2 Real-World Impact

- **$3.4 trillion** in goods were imported to the U.S. in 2024
- **Section 301 tariffs** generated over $79 billion in tariff revenue (2018–2023)
- **SMBs account for 97%** of U.S. importers but lack compliance infrastructure
- **Average CBP penalty** for classification errors: $10,000–$50,000 per entry
- **MPF alone** generates ~$2.7 billion annually for CBP

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Server-side rendering, API routes |
| AI | Claude Sonnet 4 via Vercel AI SDK | Autonomous agent with tool calling |
| Streaming | Vercel AI SDK v6 | Real-time streaming with multi-step tool execution |
| UI | Tailwind CSS v4 + shadcn/ui + Radix | Accessible, responsive component library |
| Auth | Firebase Auth | Google SSO + email/password |
| Database | Firebase Firestore | Document storage, shipment records |
| Charts | Recharts | Data visualization for scenarios and reports |
| Forms | React Hook Form + Zod | Type-safe form validation |
| Hosting | Vercel | Edge deployment with serverless functions |
| Language | TypeScript | End-to-end type safety |

---

## 6. Platform Features

### AI-Powered Audit Agent (Primary Feature)
- Autonomous multi-step audit using Claude with real tool calling
- Live USITC HTS database lookup for code validation
- Section 301/232 trade remedy evaluation
- Complete duty calculation (general + special + MPF + HMF)
- Document cross-check with finding-level severity
- 0-100 compliance risk score
- CSV export for audit records

### HTS Classification Engine
- Product description to HTS code mapping
- Live USITC database integration via server-side proxy
- Duty rate lookup with special provisions

### Duty & Landed Cost Calculator
- Full fee breakdown: general duty, Section 301/232, AD/CVD, MPF, HMF
- Support for ocean, air, and land shipping methods
- Min/max bounds on MPF ($31.67–$614.35)

### Tariff Scenario Simulator
- Country-of-origin comparison for sourcing decisions
- Side-by-side duty impact analysis
- Trade diversion cost modeling

### CBP Form 7501 Reference
- Complete field-by-field guide to all 47 fields
- Organized by 5 sections matching the official CBP form
- Contextual tips and validation rules

### Shipment Management
- Full CRUD for import shipment records
- Status tracking (Draft → In Transit → Cleared → Delivered)
- Linked classification and duty data

---

## 7. File Structure (AI Agent)

```
src/
├── app/
│   ├── api/
│   │   └── audit/
│   │       └── route.ts          ← API route: Claude streaming + tool calling
│   └── (dashboard)/
│       └── audit/
│           └── page.tsx          ← Audit UI: upload, live progress, results
├── lib/
│   └── ai/
│       ├── audit-tools.ts        ← 5 tool definitions with Zod schemas
│       └── audit-prompt.ts       ← System prompt with workflow + economics
```

---

## 8. How to Run

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local
# Add: ANTHROPIC_API_KEY=sk-ant-...

# Start development server
pnpm dev

# Build for production
pnpm build
```

---

## 9. Claude API Integration Details

### Model Configuration
```typescript
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: AUDIT_SYSTEM_PROMPT,
  messages: await convertToModelMessages(uiMessages),
  tools: auditTools,
  stopWhen: stepCountIs(15),
});

return result.toUIMessageStreamResponse();
```

### Tool Calling Flow
1. User submits document data (Commercial Invoice + Form 7501 fields)
2. The data is sent as a structured prompt to the `/api/audit` endpoint
3. Claude receives the system prompt defining its audit workflow
4. Claude autonomously calls tools in sequence, receiving results after each call
5. The agent makes up to 15 tool-calling steps per audit
6. Each tool call and result is streamed to the UI in real-time
7. The UI extracts findings, duty calculations, and risk scores from tool results
8. A final structured audit report is presented with CSV export capability

---

## 10. Team

**Submission by:** Tariff Compliance Copilot Team
**Competition:** Agentic AI Challenge — Kautz-Uible Economics Institute
**Deadline:** March 9, 2026
