# Tariff Compliance Copilot

> An AI-powered import compliance and tariff intelligence platform that transforms how small-to-mid-size businesses navigate U.S. customs regulations, HTS classification, and landed cost analysis.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Core Features](#core-features)
6. [Data Sources & APIs](#data-sources--apis)
7. [AI Agent Workflow](#ai-agent-workflow)
8. [Database Schema](#database-schema)
9. [Project Structure](#project-structure)
10. [Pages & Routes](#pages--routes)
11. [UI/UX Design System](#uiux-design-system)
12. [Implementation Phases](#implementation-phases)
13. [Economic Theory Foundation](#economic-theory-foundation)
14. [Deployment](#deployment)

---

## Problem Statement

U.S. import compliance is a high-friction, high-cost process:

- **Tariffs change constantly** — trade policy shifts, anti-dumping duties, and sanctions alter costs overnight
- **HTS classification is complex** — 10,000+ codes; a single misclassification triggers fines, overpayment, or seizures
- **Documentation errors cause delays** — missing forms hold shipments at port for days/weeks
- **Small businesses lack expertise** — hiring licensed customs brokers is expensive; mistakes cost more
- **CBP Form 7501** (Entry Summary) requires precise data across 40+ fields — most SMBs fill it out incorrectly

**Who currently does this work:**
- U.S. Customs and Border Protection (CBP) — enforces duties, reviews classifications
- Licensed Customs Brokers — classify goods, calculate duties, file entry documents
- Partner agencies — FDA, USDA, EPA, Fish & Wildlife (product-specific regulations)

---

## Solution Overview

**Tariff Compliance Copilot** is an agentic AI platform that:

1. **Classifies goods** into HTS codes using product descriptions and AI reasoning
2. **Calculates duties & tariffs** with real-time rate lookups
3. **Detects compliance risks** — flags FDA/USDA/EPA requirements, anti-dumping duties, sanctions
4. **Simulates cost scenarios** — "what if tariffs rise 10%?" or "what if I source from Vietnam?"
5. **Generates documentation checklists** — CBP Form 7501 field mapping, required certificates
6. **Produces compliance reports** — exportable, audit-ready summaries

### Agent Workflow (Input → Output)

```
INPUT                          AGENT WORKFLOW                        OUTPUT
─────────────────────────────────────────────────────────────────────────────
Product description      →  1. HTS Classification (AI + DB)    →  Compliance Report
Supplier country         →  2. Duty & Tariff Calculation       →  Total Landed Cost
Invoice & shipment data  →  3. Regulatory Requirement Check    →  Risk Alerts
Commercial invoice PDF   →  4. Compliance Risk Detection       →  Tariff Scenarios
                         →  5. Cost Scenario Simulation        →  Documentation Checklist
                         →  6. Documentation Mapping           →  CBP 7501 Field Guide
```

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js 15)                         │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────────┐ │
│  │ Dashboard  │ │ Classify │ │ Scenarios │ │ Compliance Reports   │ │
│  │  (Home)   │ │  Agent   │ │ Simulator │ │ & 7501 Generator     │ │
│  └─────┬─────┘ └────┬─────┘ └─────┬─────┘ └──────────┬───────────┘ │
│        │             │             │                   │             │
│  ┌─────┴─────────────┴─────────────┴───────────────────┴───────────┐ │
│  │              Shared UI Layer (shadcn/ui + Tailwind)             │ │
│  └─────────────────────────────┬───────────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ HTTPS / WebSocket
┌────────────────────────────────┼─────────────────────────────────────┐
│                     SERVER (Next.js API Routes)                      │
│  ┌─────────────────────────────┴───────────────────────────────────┐ │
│  │                   API Route Handlers                            │ │
│  │  /api/classify  /api/calculate  /api/simulate  /api/compliance  │ │
│  └──────┬──────────────┬──────────────┬──────────────┬─────────────┘ │
│         │              │              │              │                │
│  ┌──────┴──────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴──────┐        │
│  │  AI Agent   │ │  Tariff   │ │ Scenario  │ │ Compliance │        │
│  │  (Claude)   │ │  Engine   │ │  Engine   │ │  Engine    │        │
│  └──────┬──────┘ └─────┬─────┘ └─────┬─────┘ └─────┬──────┘        │
│         │              │              │              │                │
│  ┌──────┴──────────────┴──────────────┴──────────────┴──────┐        │
│  │                   Service Layer                          │        │
│  │  HTS Lookup │ Duty Calculator │ Risk Scorer │ PDF Parser │        │
│  └──────────────────────────┬───────────────────────────────┘        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────────┐
│                      DATA LAYER                                      │
│                              │                                        │
│  ┌──────────────┐  ┌────────┴───────┐  ┌──────────────────────────┐  │
│  │  Firebase     │  │  Firestore     │  │  External APIs           │  │
│  │  Auth         │  │  Database      │  │  ─────────────           │  │
│  │  ──────       │  │  ──────────    │  │  HTS USITC Database      │  │
│  │  Google SSO   │  │  users         │  │  CBP Trade Data          │  │
│  │  Email/Pass   │  │  shipments     │  │  Claude API (Anthropic)  │  │
│  │               │  │  classifications│  │  Exchange Rates          │  │
│  │               │  │  reports       │  │                          │  │
│  │               │  │  scenarios     │  │                          │  │
│  └──────────────┘  └────────────────┘  └──────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Firebase Storage — uploaded invoices, generated PDFs, exports   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose | Why |
|---|---|---|
| **Next.js 15** (App Router) | Full-stack React framework | Server components, API routes, streaming, SEO |
| **TypeScript** | Type safety | Catch errors early, better DX |
| **Tailwind CSS v4** | Utility-first styling | Rapid UI development, consistent design |
| **shadcn/ui** | Component library | Beautiful, accessible, customizable primitives |
| **Radix UI** | Headless primitives | Accessibility-first, composable |
| **Lucide Icons** | Icon system | Consistent, lightweight, tree-shakeable |
| **Recharts** | Data visualization | Tariff comparison charts, cost breakdowns |
| **React Hook Form + Zod** | Form handling + validation | Type-safe forms for shipment data entry |
| **Framer Motion** | Animations | Smooth transitions, micro-interactions |
| **next-themes** | Dark mode | System-aware theme switching |
| **nuqs** | URL state management | Shareable filter/search states |

### Backend
| Technology | Purpose | Why |
|---|---|---|
| **Next.js API Routes** | Server endpoints | Co-located with frontend, edge-ready |
| **Firebase Auth** | Authentication | Google SSO, email/password, session management |
| **Cloud Firestore** | NoSQL database | Real-time sync, offline support, scalable |
| **Firebase Storage** | File storage | Invoice PDFs, generated reports |
| **Firebase Admin SDK** | Server-side Firebase | Secure database access from API routes |
| **Anthropic Claude API** | AI agent backbone | HTS classification, risk analysis, reasoning |
| **Vercel AI SDK** | Streaming AI responses | Stream Claude responses to UI in real-time |

### AI & Data
| Technology | Purpose | Why |
|---|---|---|
| **Claude Opus/Sonnet** | AI reasoning engine | Best-in-class reasoning for classification |
| **Vercel AI SDK** | AI integration | `useChat`, `streamText`, tool calling |
| **pdf-parse / unpdf** | PDF extraction | Parse commercial invoices |
| **Cheerio** | Web scraping | HTS data extraction from USITC |
| **Fuse.js** | Fuzzy search | HTS code search with typo tolerance |

### DevOps & Tooling
| Technology | Purpose | Why |
|---|---|---|
| **Vercel** | Hosting & deployment | Zero-config Next.js deployment, edge functions |
| **pnpm** | Package manager | Fast, disk-efficient |
| **ESLint + Prettier** | Code quality | Consistent code style |
| **Husky + lint-staged** | Git hooks | Pre-commit quality checks |
| **Vitest** | Unit testing | Fast, Vite-native testing |
| **Playwright** | E2E testing | Cross-browser testing |

---

## Core Features

### 1. HTS Classification Agent
The AI-powered core that classifies products into Harmonized Tariff Schedule codes.

```
User Input:  "Bluetooth wireless earbuds with noise cancellation, manufactured in China"
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  AI CLASSIFICATION PIPELINE                             │
│                                                         │
│  Step 1: Parse product attributes                       │
│    → category: electronics / audio                      │
│    → material: plastic, lithium battery                 │
│    → function: wireless audio reception                 │
│    → origin: China                                      │
│                                                         │
│  Step 2: Search HTS database                            │
│    → Chapter 85: Electrical machinery & equipment       │
│    → Heading 8518: Microphones, loudspeakers, headsets  │
│    → Subheading 8518.30: Headphones & earphones         │
│                                                         │
│  Step 3: Narrow to 10-digit code                        │
│    → 8518.30.2000 — Other headphones/earphones          │
│                                                         │
│  Step 4: Confidence scoring                             │
│    → Primary:   8518.30.2000 (92% confidence)           │
│    → Alternate: 8517.62.0090 (15% confidence)           │
│                                                         │
│  Step 5: Cross-check special provisions                 │
│    → Section 301 tariff applies (China origin)          │
│    → No anti-dumping duty found                         │
│    → FCC compliance required                            │
└─────────────────────────────────────────────────────────┘
     │
     ▼
Output: HTS 8518.30.2000 — General duty 4.9% + Section 301 (25%)
```

**Key capabilities:**
- Natural language product description input
- Multi-step AI reasoning with chain-of-thought
- Confidence scoring with alternative codes
- Explanation of classification logic
- Batch classification for multiple products

### 2. Duty & Tariff Calculator
Real-time duty calculation based on HTS code, country of origin, and trade agreements.

**Calculates:**
- General duty rate (MFN — Most Favored Nation)
- Special duty programs (GSP, USMCA, CAFTA-DR, etc.)
- Section 201/232/301 additional tariffs
- Anti-dumping & countervailing duties (AD/CVD)
- Merchandise Processing Fee (MPF)
- Harbor Maintenance Fee (HMF)

**Formula:**
```
Total Landed Cost = Product Cost
                  + Freight & Insurance
                  + General Duty (value × rate%)
                  + Special Tariffs (Section 301, etc.)
                  + AD/CVD (if applicable)
                  + MPF (0.3464% of value, min $31.67, max $614.35)
                  + HMF (0.125% of value)
                  + Brokerage Fees
```

### 3. Compliance Risk Scoring
Each shipment receives a compliance risk score (0-100) with categorized alerts.

```
RISK SCORE: 73 / 100  [HIGH RISK]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  HIGH    Section 301 tariff applies — 25% additional duty (China origin)
⚠️  HIGH    Product may require FCC certification (electronic device)
🟡  MEDIUM  HTS classification has 2 plausible codes — verify with broker
🟡  MEDIUM  Anti-dumping review pending for similar product category
🟢  LOW     Standard documentation requirements — no special licenses
```

**Risk factors evaluated:**
- Country-specific tariffs & sanctions (OFAC screening)
- Product-specific regulatory requirements (FDA, USDA, EPA, CPSC, FCC)
- Classification ambiguity level
- Anti-dumping / countervailing duty exposure
- Free trade agreement eligibility
- Historical enforcement patterns

### 4. Tariff Scenario Simulator
Interactive "what-if" analysis for supply chain decisions.

**Scenario types:**
- **Tariff change simulation** — "If Section 301 tariffs increase to 35%, what happens to my costs?"
- **Country sourcing comparison** — "Compare landed cost: China vs. Vietnam vs. Mexico"
- **Trade agreement impact** — "How much do I save with USMCA eligibility?"
- **Volume-based analysis** — "At what volume does the tariff impact become critical?"

```
┌───────────────────────────────────────────────────────────────┐
│  SCENARIO: Source Bluetooth Earbuds from 3 Countries          │
│                                                               │
│  Product: 8518.30.2000 — Wireless earbuds                     │
│  Unit Value: $12.00 │ Quantity: 10,000 units                  │
│                                                               │
│  ┌─────────────┬──────────┬───────────┬───────────────────┐   │
│  │ Factor      │ China    │ Vietnam   │ Mexico (USMCA)    │   │
│  ├─────────────┼──────────┼───────────┼───────────────────┤   │
│  │ Unit Cost   │ $12.00   │ $13.50    │ $15.00            │   │
│  │ Freight     │ $0.80    │ $0.90     │ $0.40             │   │
│  │ Gen. Duty   │ 4.9%     │ 4.9%     │ 0% (USMCA)        │   │
│  │ Sec. 301    │ 25%      │ 0%        │ 0%                │   │
│  │ MPF         │ $614.35  │ $614.35   │ $614.35           │   │
│  │ HMF         │ $150.00  │ $168.75   │ $0.00             │   │
│  ├─────────────┼──────────┼───────────┼───────────────────┤   │
│  │ LANDED/UNIT │ $15.72   │ $15.10    │ $15.46            │   │
│  │ TOTAL COST  │ $157,164 │ $150,983  │ $154,614          │   │
│  │ SAVINGS     │ baseline │ -$6,181   │ -$2,550           │   │
│  └─────────────┴──────────┴───────────┴───────────────────┘   │
│                                                               │
│  💡 RECOMMENDATION: Vietnam sourcing saves $6,181 (3.9%)      │
│     with no Section 301 exposure                              │
└───────────────────────────────────────────────────────────────┘
```

### 5. CBP Form 7501 Assistant
Guides users through Entry Summary (7501) field mapping based on their shipment data.

**Capabilities:**
- Auto-maps invoice data to 7501 fields
- Validates field formats and required entries
- Highlights commonly missed fields
- Generates printable checklist of required supporting documents
- References official CBP field instructions

### 6. Commercial Invoice Parser
Upload a commercial invoice PDF and extract structured data automatically.

**Extracted fields:**
- Seller / buyer details
- Product descriptions & quantities
- Unit prices & total values
- Country of origin
- Shipping terms (Incoterms)
- Invoice number & date

### 7. Compliance Report Generator
Produces a comprehensive, exportable compliance report for each shipment analysis.

**Report sections:**
- Executive summary
- HTS classification with reasoning
- Duty & tariff breakdown
- Regulatory requirements checklist
- Risk assessment
- Landed cost analysis
- Recommendations

---

## Data Sources & APIs

### Primary Data Sources

| Source | URL | Data |
|---|---|---|
| **USITC HTS Database** | https://hts.usitc.gov/ | Official HTS codes, duty rates, special notes |
| **CBP Form 7501 Reference** | https://www.cbp.gov/trade/programs-administration/entry-summary/cbp-form-7501 | Entry summary field definitions |
| **CBP ACE/AMS** | https://www.cbp.gov/trade/automated/cargo-systems-messaging-service | Automated cargo systems reference |
| **OFAC Sanctions** | https://sanctionssearch.ofac.treas.gov/ | Sanctions screening |
| **Exchange Rates** | Open Exchange Rates API | Currency conversion |
| **Anthropic Claude API** | https://api.anthropic.com | AI classification & reasoning |

### HTS Data Strategy

The HTS database is publicly available but not offered as a REST API. Our approach:

1. **Scrape & cache** the USITC HTS chapters into Firestore (refreshed monthly)
2. **Build a search index** with Fuse.js for fuzzy matching
3. **AI-assisted lookup** — Claude uses the cached HTS data as context for classification
4. **Manual override** — users can search and select codes directly

```
Firestore Collection: hts_codes
├── chapter_85/
│   ├── 8518.30.2000: { description, general_rate, special_rates, units, notes }
│   ├── 8518.30.4000: { ... }
│   └── ...
├── chapter_61/
│   └── ...
└── last_updated: "2026-02-01"
```

---

## AI Agent Workflow

### Classification Agent (Claude)

The agent uses a structured tool-calling pattern with the Vercel AI SDK:

```typescript
// Simplified agent flow
const tools = {
  searchHTS: {
    description: "Search HTS database for matching tariff codes",
    parameters: z.object({
      query: z.string(),
      chapter: z.string().optional(),
    }),
    execute: async ({ query, chapter }) => {
      // Search Firestore HTS collection
    },
  },
  lookupDutyRate: {
    description: "Get duty rates for a specific HTS code",
    parameters: z.object({
      htsCode: z.string(),
      countryOfOrigin: z.string(),
    }),
    execute: async ({ htsCode, countryOfOrigin }) => {
      // Lookup rates including special tariffs
    },
  },
  checkRegulations: {
    description: "Check if product requires agency clearance",
    parameters: z.object({
      htsCode: z.string(),
      productDescription: z.string(),
    }),
    execute: async ({ htsCode, productDescription }) => {
      // Check FDA, USDA, EPA, CPSC, FCC flags
    },
  },
  calculateLandedCost: {
    description: "Calculate total landed cost for a shipment",
    parameters: z.object({
      declaredValue: z.number(),
      dutyRate: z.number(),
      specialTariffs: z.array(z.object({ name: z.string(), rate: z.number() })),
      freight: z.number(),
      insurance: z.number(),
    }),
    execute: async (params) => {
      // Run landed cost formula
    },
  },
};

// System prompt for the classification agent
const systemPrompt = `You are a U.S. import compliance specialist AI.
Your job is to classify products into HTS codes, calculate duties,
and identify compliance risks. Always:
1. Search the HTS database using multiple strategies
2. Consider the product's material, function, and intended use
3. Apply GRI (General Rules of Interpretation) when codes are ambiguous
4. Check for country-specific tariffs (Section 201/232/301)
5. Flag any regulatory agency requirements
6. Provide confidence scores and reasoning for your classification`;
```

### Agent Decision Flow

```
User submits product + origin
         │
         ▼
   Parse product attributes
   (material, function, use)
         │
         ▼
   Search HTS database ──→ Multiple candidate codes
         │
         ▼
   Evaluate each candidate
   using GRI rules
         │
         ▼
   Select best HTS code ──→ Confidence score
         │
         ▼
   Lookup duty rates for
   selected code + origin
         │
         ▼
   Check special tariffs ──→ Section 301? AD/CVD?
         │
         ▼
   Scan regulatory flags ──→ FDA? USDA? FCC? EPA?
         │
         ▼
   Calculate landed cost
         │
         ▼
   Generate compliance report
   with risk score
```

---

## Database Schema

### Firestore Collections

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── company: string
│       ├── plan: "free" | "pro" | "enterprise"
│       ├── createdAt: timestamp
│       └── settings: {
│           ├── defaultCurrency: string
│           ├── defaultOrigin: string
│           └── notifications: boolean
│       }
│
├── shipments/
│   └── {shipmentId}/
│       ├── userId: string (ref → users)
│       ├── status: "draft" | "classified" | "reviewed" | "filed"
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── products: [{
│       │   ├── description: string
│       │   ├── htsCode: string
│       │   ├── htsDescription: string
│       │   ├── confidence: number
│       │   ├── alternativeCodes: [{ code, confidence, reason }]
│       │   ├── countryOfOrigin: string
│       │   ├── quantity: number
│       │   ├── unitValue: number
│       │   ├── totalValue: number
│       │   └── currency: string
│       │}]
│       ├── supplier: {
│       │   ├── name: string
│       │   ├── country: string
│       │   └── address: string
│       │}
│       ├── invoiceUrl: string (Firebase Storage ref)
│       ├── shippingMethod: "ocean" | "air" | "ground"
│       ├── incoterms: string
│       ├── freight: number
│       └── insurance: number
│
├── classifications/
│   └── {classificationId}/
│       ├── shipmentId: string (ref → shipments)
│       ├── userId: string (ref → users)
│       ├── productDescription: string
│       ├── htsCode: string
│       ├── confidence: number
│       ├── reasoning: string (AI chain-of-thought)
│       ├── alternativeCodes: [{ code, confidence, reason }]
│       ├── dutyRate: number
│       ├── specialTariffs: [{ name, rate, authority }]
│       ├── regulatoryFlags: [{ agency, requirement, severity }]
│       ├── riskScore: number
│       ├── riskFactors: [{ factor, severity, description }]
│       └── createdAt: timestamp
│
├── scenarios/
│   └── {scenarioId}/
│       ├── userId: string
│       ├── name: string
│       ├── baseProduct: { htsCode, description, unitValue, quantity }
│       ├── countries: [{ country, unitCost, freight, dutyRate, specialTariffs, landedCost }]
│       ├── tariffVariations: [{ label, rateChange, impactAmount }]
│       └── createdAt: timestamp
│
├── reports/
│   └── {reportId}/
│       ├── shipmentId: string
│       ├── userId: string
│       ├── type: "compliance" | "landed_cost" | "scenario"
│       ├── pdfUrl: string (Firebase Storage ref)
│       ├── summary: string
│       └── createdAt: timestamp
│
├── hts_codes/
│   └── {chapterId}/
│       └── codes/
│           └── {htsCode}/
│               ├── code: string
│               ├── description: string
│               ├── generalRate: string
│               ├── specialRates: { program: rate }
│               ├── unit: string
│               ├── chapter: number
│               ├── section: number
│               └── notes: string
│
└── audit_log/
    └── {logId}/
        ├── userId: string
        ├── action: string
        ├── resource: string
        ├── details: object
        └── timestamp: timestamp
```

---

## Project Structure

```
tariff-compliance-copilot/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png
│
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (providers, nav)
│   │   ├── page.tsx                      # Landing page
│   │   ├── globals.css                   # Tailwind base + custom tokens
│   │   │
│   │   ├── (auth)/                       # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                  # Protected route group
│   │   │   ├── layout.tsx                # Dashboard shell (sidebar + topbar)
│   │   │   ├── dashboard/page.tsx        # Overview / home
│   │   │   ├── classify/
│   │   │   │   ├── page.tsx              # HTS classification agent
│   │   │   │   └── [id]/page.tsx         # Classification result detail
│   │   │   ├── shipments/
│   │   │   │   ├── page.tsx              # Shipment list
│   │   │   │   ├── new/page.tsx          # Create shipment
│   │   │   │   └── [id]/page.tsx         # Shipment detail + compliance
│   │   │   ├── calculator/page.tsx       # Duty & landed cost calculator
│   │   │   ├── scenarios/
│   │   │   │   ├── page.tsx              # Scenario list
│   │   │   │   └── new/page.tsx          # Create scenario simulation
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx              # Report history
│   │   │   │   └── [id]/page.tsx         # View report
│   │   │   ├── form-7501/page.tsx        # CBP 7501 assistant
│   │   │   └── settings/page.tsx         # User settings
│   │   │
│   │   └── api/                          # API route handlers
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── classify/route.ts         # POST — AI classification
│   │       ├── calculate/route.ts        # POST — duty calculation
│   │       ├── simulate/route.ts         # POST — scenario simulation
│   │       ├── compliance/route.ts       # POST — risk scoring
│   │       ├── parse-invoice/route.ts    # POST — PDF extraction
│   │       ├── hts/
│   │       │   ├── search/route.ts       # GET — HTS code search
│   │       │   └── [code]/route.ts       # GET — HTS code details
│   │       ├── reports/
│   │       │   └── generate/route.ts     # POST — generate report PDF
│   │       └── chat/route.ts             # POST — streaming chat agent
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── chart.tsx                 # Recharts wrapper (shadcn)
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx               # Dashboard sidebar navigation
│   │   │   ├── topbar.tsx                # Top navigation bar
│   │   │   ├── mobile-nav.tsx            # Mobile navigation drawer
│   │   │   └── footer.tsx
│   │   │
│   │   ├── classification/
│   │   │   ├── classify-form.tsx         # Product input form
│   │   │   ├── classification-result.tsx # Result display with confidence
│   │   │   ├── hts-code-badge.tsx        # Styled HTS code chip
│   │   │   ├── confidence-meter.tsx      # Visual confidence indicator
│   │   │   ├── reasoning-panel.tsx       # AI reasoning chain display
│   │   │   └── batch-upload.tsx          # CSV/bulk classification
│   │   │
│   │   ├── calculator/
│   │   │   ├── duty-calculator-form.tsx  # Calculator input form
│   │   │   ├── cost-breakdown.tsx        # Itemized cost table
│   │   │   ├── landed-cost-card.tsx      # Summary card
│   │   │   └── fee-tooltip.tsx           # Fee explanation popovers
│   │   │
│   │   ├── compliance/
│   │   │   ├── risk-score-gauge.tsx      # Circular risk score display
│   │   │   ├── risk-factor-list.tsx      # Categorized risk alerts
│   │   │   ├── regulatory-badges.tsx     # FDA/USDA/EPA/FCC badges
│   │   │   └── compliance-checklist.tsx  # Documentation checklist
│   │   │
│   │   ├── scenarios/
│   │   │   ├── scenario-builder.tsx      # Interactive scenario form
│   │   │   ├── country-comparison.tsx    # Side-by-side country table
│   │   │   ├── tariff-slider.tsx         # Tariff rate slider
│   │   │   └── savings-chart.tsx         # Bar/line chart of savings
│   │   │
│   │   ├── shipments/
│   │   │   ├── shipment-form.tsx         # Multi-step shipment creation
│   │   │   ├── shipment-card.tsx         # Shipment list item
│   │   │   ├── invoice-upload.tsx        # Drag & drop PDF upload
│   │   │   └── shipment-timeline.tsx     # Status timeline
│   │   │
│   │   ├── form-7501/
│   │   │   ├── field-mapper.tsx          # Interactive 7501 field guide
│   │   │   ├── field-validator.tsx       # Field validation display
│   │   │   └── document-checklist.tsx    # Required docs list
│   │   │
│   │   ├── reports/
│   │   │   ├── report-card.tsx           # Report list item
│   │   │   ├── report-viewer.tsx         # Full report display
│   │   │   └── export-button.tsx         # PDF/CSV export
│   │   │
│   │   ├── chat/
│   │   │   ├── chat-panel.tsx            # Sliding chat panel
│   │   │   ├── chat-message.tsx          # Message bubble
│   │   │   └── chat-input.tsx            # Message input with suggestions
│   │   │
│   │   └── shared/
│   │       ├── country-select.tsx        # Country dropdown with flags
│   │       ├── currency-input.tsx        # Currency-formatted input
│   │       ├── loading-skeleton.tsx      # Page loading states
│   │       ├── empty-state.tsx           # Empty list illustrations
│   │       ├── error-boundary.tsx        # Error UI
│   │       └── page-header.tsx           # Consistent page headers
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts                 # Firebase client config
│   │   │   ├── admin.ts                  # Firebase Admin SDK init
│   │   │   ├── auth.ts                   # Auth helper functions
│   │   │   └── firestore.ts              # Firestore helper functions
│   │   │
│   │   ├── ai/
│   │   │   ├── agent.ts                  # Claude agent setup + tools
│   │   │   ├── tools.ts                  # Tool definitions (Vercel AI SDK)
│   │   │   ├── prompts.ts                # System prompts
│   │   │   └── schemas.ts                # Zod schemas for tool params
│   │   │
│   │   ├── services/
│   │   │   ├── hts-service.ts            # HTS lookup & search
│   │   │   ├── duty-service.ts           # Duty rate calculation
│   │   │   ├── risk-service.ts           # Risk scoring engine
│   │   │   ├── scenario-service.ts       # Scenario simulation logic
│   │   │   ├── invoice-parser.ts         # PDF parsing logic
│   │   │   └── report-service.ts         # Report generation
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                     # clsx + twMerge utility
│   │   │   ├── format.ts                 # Number/currency formatting
│   │   │   ├── constants.ts              # App-wide constants
│   │   │   └── countries.ts              # Country list + codes
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-auth.ts               # Firebase auth hook
│   │   │   ├── use-shipments.ts          # Firestore shipments hook
│   │   │   └── use-classification.ts     # Classification state hook
│   │   │
│   │   └── types/
│   │       ├── shipment.ts               # Shipment types
│   │       ├── classification.ts         # Classification types
│   │       ├── hts.ts                    # HTS code types
│   │       ├── scenario.ts               # Scenario types
│   │       └── report.ts                 # Report types
│   │
│   └── styles/
│       └── globals.css                   # Tailwind + shadcn theme tokens
│
├── scripts/
│   ├── seed-hts.ts                       # Seed Firestore with HTS data
│   └── scrape-hts.ts                     # Scrape USITC HTS website
│
├── .env.local                            # Environment variables (git-ignored)
├── .env.example                          # Template for env vars
├── components.json                       # shadcn/ui config
├── firebase.json                         # Firebase config
├── firestore.rules                       # Firestore security rules
├── storage.rules                         # Firebase Storage rules
├── next.config.ts                        # Next.js config
├── tailwind.config.ts                    # Tailwind config
├── tsconfig.json                         # TypeScript config
├── package.json
├── pnpm-lock.yaml
├── CLAUDE.md                             # AI coding assistant context
├── PROJECT.md                            # This file
└── README.md                             # User-facing readme
```

---

## Pages & Routes

### Public Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Hero, features, pricing, CTA |
| `/login` | Login | Email/password + Google SSO |
| `/register` | Register | Account creation |

### Protected Routes (Dashboard)

| Route | Page | Description |
|---|---|---|
| `/dashboard` | Overview | Summary stats, recent activity, quick actions |
| `/classify` | HTS Classifier | AI-powered product classification |
| `/classify/[id]` | Classification Detail | Full result with reasoning, alternatives |
| `/shipments` | Shipment List | All shipments with filters, search |
| `/shipments/new` | New Shipment | Multi-step form: products, supplier, shipping |
| `/shipments/[id]` | Shipment Detail | Full shipment view with compliance status |
| `/calculator` | Duty Calculator | Standalone duty & landed cost calculation |
| `/scenarios` | Scenario List | Saved scenario simulations |
| `/scenarios/new` | Scenario Builder | Interactive country/tariff comparison |
| `/reports` | Report History | Generated compliance reports |
| `/reports/[id]` | Report Viewer | Full report with export options |
| `/form-7501` | 7501 Assistant | Interactive CBP Form 7501 guide |
| `/settings` | Settings | Profile, preferences, API keys |

---

## UI/UX Design System

### Design Principles
- **Clarity over density** — compliance data is complex; UI should simplify, not overwhelm
- **Progressive disclosure** — show summaries first, details on demand
- **Actionable insights** — every data point should lead to a decision
- **Trust through transparency** — show AI reasoning, confidence scores, and data sources

### Theme

```css
/* shadcn/ui CSS custom properties */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;       /* Blue — trust, reliability */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --accent: 142.1 76.2% 36.3%;        /* Green — success, savings */
  --destructive: 0 84.2% 60.2%;       /* Red — risk, alerts */
  --warning: 38 92% 50%;              /* Amber — caution */
  --muted: 210 40% 96.1%;
  --card: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.625rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --card: 222.2 84% 6.9%;
}
```

### Key UI Patterns

**Dashboard Cards** — Key metrics at a glance
```
┌────────────────────────────────────────────────────────┐
│  📊 Dashboard                                         │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Active   │ │ Pending  │ │ Avg Risk │ │ Total    │  │
│  │ Shipments│ │ Reviews  │ │ Score    │ │ Duties   │  │
│  │   12     │ │   3      │ │  42/100  │ │ $24,891  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│  ┌─────────────────────┐ ┌────────────────────────┐    │
│  │ Recent Activity     │ │ Duty Cost Trend        │    │
│  │ ─────────────────── │ │ (Recharts line chart)  │    │
│  │ ✅ Classified: HDMI │ │          ╱╲            │    │
│  │ ⚠️ Risk alert: FDA  │ │    ╱╲  ╱  ╲╱╲         │    │
│  │ 📄 Report generated │ │ ──╱──╲╱      ╲──      │    │
│  │ 🆕 New shipment     │ │                        │    │
│  └─────────────────────┘ └────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

**Classification Result** — AI output with confidence
```
┌───────────────────────────────────────────────────────┐
│  🔍 Classification Result                             │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  HTS 8518.30.2000                    92% ████░  │  │
│  │  Headphones, earphones & combined sets          │  │
│  │                                                 │  │
│  │  General Duty: 4.9%                             │  │
│  │  Section 301: +25.0% (China)                    │  │
│  │  ─────────────────────────────────              │  │
│  │  Effective Rate: 29.9%                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ⚡ AI Reasoning                          [Expand ▾]  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 1. Product is an electronic audio device        │  │
│  │ 2. Falls under Chapter 85 — Electrical equip.   │  │
│  │ 3. Heading 8518 covers headphones/earphones     │  │
│  │ 4. Subheading .30 for headsets/earphone sets    │  │
│  │ 5. Statistical suffix .2000 for "other"         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  🔄 Alternative Codes                                 │
│  ┌─────────────────────────────────────────────────┐  │
│  │  8517.62.0090  Machines for reception  15%      │  │
│  │  8518.30.4000  Combined microphone     12%      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  [💰 Calculate Landed Cost]  [📄 Generate Report]     │
└───────────────────────────────────────────────────────┘
```

### Responsive Strategy
- **Desktop (1280px+):** Full sidebar + content + optional detail panel
- **Tablet (768-1279px):** Collapsible sidebar, stacked content
- **Mobile (< 768px):** Bottom nav, full-width cards, drawer navigation

---

## Implementation Phases

### Phase 1 — Foundation (Week 1)
**Goal:** Project scaffold, auth, basic dashboard

- [ ] Initialize Next.js 15 project with TypeScript, Tailwind, pnpm
- [ ] Install and configure shadcn/ui (components.json, theme tokens)
- [ ] Set up Firebase project (Auth, Firestore, Storage)
- [ ] Implement authentication (Google SSO + email/password)
- [ ] Build dashboard layout (sidebar, topbar, mobile nav)
- [ ] Create dashboard overview page with placeholder cards
- [ ] Set up environment variables and Firebase config
- [ ] Deploy initial version to Vercel

### Phase 2 — Classification Engine (Week 2)
**Goal:** Core AI classification with HTS lookup

- [ ] Scrape and seed HTS codes into Firestore (key chapters)
- [ ] Build HTS search endpoint with fuzzy matching
- [ ] Set up Claude API integration with Vercel AI SDK
- [ ] Define classification tools (searchHTS, lookupDutyRate, checkRegulations)
- [ ] Build classification form UI (product description + country)
- [ ] Implement streaming classification results
- [ ] Display results with confidence scores and reasoning
- [ ] Add classification history (Firestore persistence)

### Phase 3 — Duty Calculator & Risk Scoring (Week 3)
**Goal:** Landed cost calculation and compliance risk assessment

- [ ] Build duty calculation engine (all fee components)
- [ ] Implement risk scoring algorithm
- [ ] Create duty calculator page UI
- [ ] Build cost breakdown component with itemized table
- [ ] Add risk score gauge and risk factor list
- [ ] Implement regulatory flag detection (FDA, USDA, EPA, FCC)
- [ ] Connect calculator to classification results

### Phase 4 — Scenarios & Reports (Week 4)
**Goal:** Scenario simulation and exportable reports

- [ ] Build scenario simulation engine
- [ ] Create interactive scenario builder UI
- [ ] Implement country comparison table with charts
- [ ] Add tariff rate slider for "what-if" analysis
- [ ] Build compliance report generator
- [ ] Implement PDF export functionality
- [ ] Create report viewer page

### Phase 5 — Document Handling & Polish (Week 5)
**Goal:** Invoice parsing, 7501 assistant, final polish

- [ ] Implement commercial invoice PDF parser
- [ ] Build drag-and-drop upload component
- [ ] Create CBP Form 7501 interactive guide
- [ ] Add shipment management (CRUD, status tracking)
- [ ] Implement global chat panel (always-available AI assistant)
- [ ] Performance optimization (caching, lazy loading)
- [ ] Mobile responsiveness pass
- [ ] Dark mode support
- [ ] Final testing and bug fixes

---

## Economic Theory Foundation

This project connects directly to core economic principles — critical for competition judging.

### 1. Transaction Cost Economics (Coase, Williamson)
Import compliance creates enormous **transaction costs** — the costs of participating in a market beyond the price of the good itself. These include:
- **Search costs** — finding the correct HTS code among 10,000+ entries
- **Information costs** — understanding duty rates, trade agreements, regulatory requirements
- **Bargaining costs** — negotiating with customs brokers
- **Enforcement costs** — penalties from misclassification

**Our agent reduces all four categories** by automating search, centralizing information, eliminating broker dependency for routine classifications, and preventing compliance errors.

### 2. Information Asymmetry (Akerlof)
Small importers face a severe **information asymmetry** compared to large corporations with dedicated trade compliance departments. This leads to:
- Overpayment of duties (not claiming eligible trade preference programs)
- Under-utilization of free trade agreements (USMCA, GSP)
- Higher error rates and penalty exposure

**Our agent levels the playing field** by giving SMBs access to the same classification intelligence that large firms have.

### 3. Trade Policy & Tariff Theory (Ricardo, Krugman)
Tariffs distort trade flows and impose **deadweight loss** on the economy. However, businesses can minimize their tariff burden through:
- Correct classification (avoiding overpayment)
- Trade agreement utilization
- Strategic sourcing decisions

**Our scenario simulator enables strategic decisions** — showing exactly how sourcing changes affect total landed cost.

### 4. Market Efficiency (Fama)
Trade compliance friction represents a **market inefficiency** — information that should be freely available requires expensive intermediaries. By democratizing access to compliance intelligence, we move the market closer to efficiency.

---

## Deployment

### Environment Variables

```env
# .env.local

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

### Firebase Setup

```bash
# Install Firebase CLI
pnpm add -g firebase-tools

# Login and init
firebase login
firebase init  # Select Firestore, Storage, Hosting

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules
```

---

## Key Reference Documents

| Document | Location | Purpose |
|---|---|---|
| CBP Form 7501 Template | `/reference/7501-template.pdf` | Entry Summary form reference |
| Sample Commercial Invoices | `/reference/invoices/` | Test data for invoice parser |
| HTS Chapter Index | Firestore `hts_codes` collection | Classification database |
| CBP 7501 Field Guide | https://www.cbp.gov/trade/programs-administration/entry-summary/cbp-form-7501 | Official field definitions |
| USITC HTS Database | https://hts.usitc.gov/ | Official tariff schedule |
| ACE/AMS Reference | https://www.cbp.gov/trade/automated/cargo-systems-messaging-service | Automated trade systems |

---

## License

This project is developed for educational and competition purposes.

---

*Built with Next.js 15, Firebase, Claude AI, shadcn/ui, and Tailwind CSS.*
