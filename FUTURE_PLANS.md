# Future Plans — Tariff Compliance Copilot

## Partnership Proposal & Business Roadmap

---

## 1. Executive Summary

Tariff Compliance Copilot started as a competition entry for the Kautz-Uible Agentic AI Challenge. It has become something bigger — a working, AI-native compliance intelligence platform that fills a gap none of the major players address.

**The gap:** There is no affordable, self-service tool that helps small-to-mid-size importers understand, verify, and manage their own tariff compliance. CargoWise serves brokers. Flexport serves mid-market shippers who use their freight services. TurboBrokers serves Caribbean customs houses. Nobody serves the SMB importer who wants to classify goods, verify their broker's work, simulate sourcing scenarios, and avoid CBP penalties — on their own terms, without a $5,000/month minimum or an enterprise contract.

**We do.**

This document proposes turning Tariff Compliance Copilot into a real company, with a clear product roadmap, revenue model, and competitive strategy.

---

## 2. What Each Partner Brings

### Partner 1 — [Your Name] (F-1 Student, UC)

| Contribution | Details |
|---|---|
| **Technical development** | Full-stack engineering: Next.js, TypeScript, React, Firebase, Claude API integration |
| **Product surfaces** | Web application (built), native Mac/Windows desktop app (planned), browser extension (planned) |
| **AI/LLM investment** | Up to **$1,000 in Claude API/subscription costs** for both development and production AI usage |
| **Architecture ownership** | System design, API architecture, data pipeline, USITC integration |
| **Time** | Available via CPT (summer) and OPT (post-graduation) for active development |

### Partner 2 — [US Citizen Partner]

| Contribution | Details |
|---|---|
| **Managing Member** | Legal representative, day-to-day operations, business decisions |
| **Business development** | Customer acquisition, partnerships, industry networking |
| **Customs expertise** | CBP broker exam preparation (if pursuing licensed brokerage) |
| **Compliance oversight** | Ensures F-1/CPT/OPT compliance for Partner 1's involvement |
| **Financial management** | Company banking, invoicing, tax filings |

### Equity Structure (to discuss)

A 50/50 split reflects equal but different contributions — one builds the product, the other builds the business. Alternatives (60/40 with vesting, sweat equity schedules) should be discussed with an attorney before filing.

---

## 3. The Market Opportunity

### By the Numbers

| Metric | Value |
|---|---|
| U.S. goods imports (2024) | **$3.4 trillion** |
| Number of U.S. importers | **330,000+** |
| SMBs (% of importers) | **97%** (~320,000 businesses) |
| Section 301 tariff revenue (2018-2023) | **$79 billion** |
| Average CBP penalty per classification error | **$10,000-$50,000** |
| Global customs software market (2026) | **$17-35 billion** |
| CAGR (customs software) | **8-12% through 2033** |
| SaaS gross margins (industry standard) | **70-80%** |

### Why Now

1. **Tariff volatility is at a 90-year high.** Section 301, 232, and retaliatory tariffs change constantly. Importers are desperate for tools that keep up.
2. **Flexport is abandoning SMBs.** Their $5,000/month fulfillment minimum (January 2026) is actively pushing small importers off the platform.
3. **CargoWise just raised prices 20-50%.** Mid-market freight forwarders are evaluating alternatives for the first time in a decade.
4. **AI makes it possible.** What previously required a team of customs brokers can now be done by an AI agent with tool calling, live data, and domain expertise.

---

## 4. Competitive Landscape

### CargoWise (WiseTech Global — $10.2B market cap)

| Factor | CargoWise | Us |
|---|---|---|
| **Target** | Large freight forwarders, 3PLs | SMB importers, small brokers |
| **Pricing** | Enterprise (per-transaction, negotiated) | Freemium SaaS ($49-$299/month) |
| **Setup** | Certified implementation partners, months | Self-service, minutes |
| **AI** | Just launched (Dec 2025), bolted onto 20-yr-old .NET monolith | AI-native from day one (Claude + tool calling) |
| **SMB play** | None — acquired E2open for $2.1B to reach shippers, 2-3 years from integration | Core market from launch |
| **Support** | No phone support, video library only | AI-assisted + human support |
| **Our edge** | They don't serve importers. Period. |

### Flexport ($2.1B revenue, ~$3B valuation)

| Factor | Flexport | Us |
|---|---|---|
| **Model** | Freight forwarder with software layer | Pure SaaS compliance intelligence |
| **Gross margin** | ~6% (freight-attached) | 70-80% (pure software) |
| **SMB access** | $5,000/month minimum | Free tier available |
| **HTS classification** | Requires you to already know your code | Classifies from product description |
| **Audit** | Reactive (audits past entries) | Proactive (catches errors before filing) |
| **Scenario simulator** | No documented sourcing comparison tool | Built-in country-of-origin comparison |
| **Form 7501** | Files it for you (you never see it) | Educates you on every field |
| **Our edge** | They want your freight business. We want to make you smarter. |

### TurboBrokers (Micro-ISV, ~1 employee)

| Factor | TurboBrokers | Us |
|---|---|---|
| **Market** | Caribbean (ASYCUDA customs systems) | United States (CBP/ACE) |
| **Architecture** | Desktop Windows app | Modern web + native + extension |
| **AI** | None | Claude-powered autonomous agent |
| **U.S. compliance** | No ACE/ABI, no Section 301/232 | Full U.S. tariff stack |
| **Our edge** | Different market entirely. Not a competitor. |

### The Positioning Statement

> **Tariff Compliance Copilot is the TurboTax of import compliance** — an AI-native platform that helps SMB importers classify goods, calculate duties, audit documents, and simulate sourcing scenarios, without needing a customs broker on retainer.

---

## 5. Product Roadmap

### Phase 1: Web Application (CURRENT — Built)

**Status:** Live at tariff-compliance-copilot.vercel.app

| Feature | Status |
|---|---|
| AI Audit Agent (Claude + 5 tools + USITC live data) | Shipped |
| HTS Classification Engine | Shipped |
| Duty & Landed Cost Calculator | Shipped |
| Tariff Scenario Simulator | Shipped |
| CBP Form 7501 Field Guide | Shipped |
| Shipment Management | Shipped |
| Firebase Auth (Google SSO + email) | Shipped |
| USITC Data Fallback (13,900 entries) | Shipped |
| CSV Audit Export | Shipped |

**Next on web:**
- Invoice PDF parser (upload real commercial invoices, auto-extract fields)
- Form 7501 PDF parser (upload real CBP forms, auto-extract fields)
- Firestore persistence (save audits, classifications, shipments)
- User dashboard with audit history and compliance trends
- Multi-product catalog management
- Bulk HTS classification
- Report PDF generation with compliance scoring

### Phase 2: Browser Extension (Q3 2026)

A lightweight Chrome/Edge extension that activates on trade-related websites:

| Feature | Description |
|---|---|
| **HTS Quick Lookup** | Highlight any product description on any webpage, get instant HTS classification + duty rate |
| **Tariff Alert Overlay** | When browsing supplier sites (Alibaba, Global Sources), show estimated U.S. duties inline |
| **USITC Enhancement** | On hts.usitc.gov, overlay Section 301/232 applicability, landed cost estimates |
| **CBP ACE Integration** | On ACE portal, cross-check filed entries against our calculations |
| **One-Click Audit** | Select text from an invoice or 7501, send to audit agent for instant compliance check |

**Tech stack:** Chrome Extension (Manifest V3), React popup/sidebar, background service worker calling our API.

### Phase 3: Native Desktop Application (Q1 2027)

A full-featured Mac and Windows application for power users — customs brokers, compliance managers, and frequent importers:

| Feature | Description |
|---|---|
| **Offline Mode** | Full HTS database locally, classify and calculate without internet |
| **Batch Processing** | Import 100+ invoices, classify and audit in bulk |
| **PDF Intelligence** | Drag-and-drop commercial invoices and 7501 forms, AI extracts all fields |
| **Compliance Dashboard** | Portfolio-level view across all products, suppliers, and shipments |
| **Rate Change Alerts** | Desktop notifications when USITC publishes new HTS revisions or tariff changes |
| **Broker Verification** | Compare your broker's filings against our calculations, flag discrepancies |
| **ACE Filing Prep** | Generate CBP-ready entry data (not filing — prep) |

**Tech stack:** Electron (cross-platform) or Tauri (Rust-based, smaller binary), sharing the same React UI components as the web app. Alternatively, Swift (Mac) + .NET MAUI (Windows) for truly native performance.

### Phase 4: API Platform (Q3 2027)

Open the compliance engine as an API for other logistics companies to integrate:

| Endpoint | Description |
|---|---|
| `POST /api/classify` | Product description in, HTS code + duty rate out |
| `POST /api/audit` | Invoice + 7501 data in, compliance findings out |
| `POST /api/duties` | HTS code + value + country in, full duty breakdown out |
| `POST /api/scenario` | Product + country options in, sourcing comparison out |

**Revenue:** Per-API-call pricing ($0.01-$0.10/call) or monthly plans.

---

## 6. Revenue Model

### SaaS Tiers

| Tier | Price | Target | Features |
|---|---|---|---|
| **Free** | $0/month | Individual importers, students | 3 classifications/month, 1 audit/month, basic calculator |
| **Starter** | $49/month | Small importers (<$500K annual imports) | 50 classifications, 10 audits, scenario simulator, CSV export |
| **Professional** | $149/month | Mid-size importers, small brokers | Unlimited classifications, unlimited audits, PDF parsing, bulk processing, API access |
| **Enterprise** | $299+/month | Customs brokers, compliance teams, 3PLs | Everything + team seats, Firestore persistence, priority support, custom integrations |

### Revenue Projections (Conservative)

| Year | Customers | MRR | ARR | Notes |
|---|---|---|---|---|
| Year 1 | 50-100 free, 10-20 paid | $1,500-$5,000 | $18K-$60K | Validation phase, competition wins |
| Year 2 | 500 free, 80-150 paid | $10K-$30K | $120K-$360K | Product-market fit, browser extension launch |
| Year 3 | 2,000 free, 400-800 paid | $50K-$150K | $600K-$1.8M | Desktop app, API platform, first enterprise deals |
| Year 5 | 10,000 free, 2,000+ paid | $200K-$500K | $2.4M-$6M | Market leadership in SMB compliance |

### Unit Economics Target

| Metric | Target |
|---|---|
| CAC (Customer Acquisition Cost) | $50-$200 |
| LTV (Lifetime Value) | $1,500-$5,000 |
| LTV:CAC Ratio | >10:1 |
| Gross Margin | 75%+ |
| Churn | <5% monthly |
| Claude API cost per audit | ~$0.05-$0.15 (Sonnet 4) |

---

## 7. Customer Acquisition Strategy

### Phase 1: Founder-Led Sales (Year 1)

| Channel | Action | Cost |
|---|---|---|
| **Competition wins** | Kautz-Uible challenge → credibility + press | $0 |
| **LinkedIn content** | Weekly posts on tariff changes, compliance tips, product demos | $0 |
| **SEO** | Target "HTS code lookup", "Section 301 calculator", "customs compliance software" | $0 |
| **Trade forums** | Reddit r/importing, r/logistics, trade compliance LinkedIn groups | $0 |
| **Cincinnati logistics network** | CVG airport customs, Cincinnati/NKY freight community | $0 |
| **Free tool virality** | The calculator and classifier are free — users share them | $0 |

### Phase 2: Scaled Acquisition (Year 2-3)

| Channel | Action | Budget |
|---|---|---|
| **Google Ads** | "Customs compliance software", "HTS classification tool" | $2K-$5K/month |
| **LinkedIn Ads** | Target customs brokers, trade compliance managers | $1K-$3K/month |
| **Industry events** | Manifest, TI50, NCBFAA conferences — demo booth | $5K-$10K/event |
| **Partnerships** | Integrate with QuickBooks, Shopify, Amazon Seller Central | Revenue share |
| **Content marketing** | Tariff change alerts, compliance guides, case studies | $500/month |
| **Referral program** | Existing users get free months for referrals | Variable |

### Phase 3: Product-Led Growth (Year 3+)

| Strategy | Mechanism |
|---|---|
| **Freemium funnel** | Free classifications → paid audits → enterprise |
| **Browser extension** | Installs → daily usage → conversion |
| **API platform** | Developers integrate → their customers discover us |
| **CBP broker directory** | Listed as a compliance tool recommendation |

---

## 8. AI Investment & Cost Structure

### Claude API Budget ($1,000 initial contribution)

| Usage | Model | Est. Cost/Unit | Monthly Volume | Monthly Cost |
|---|---|---|---|---|
| Audit agent | Sonnet 4 | $0.05-$0.15/audit | 200 audits | $10-$30 |
| HTS classification | Sonnet 4 | $0.02-$0.05/query | 500 queries | $10-$25 |
| Scenario simulation | Haiku 4.5 | $0.005-$0.01/sim | 300 sims | $1.50-$3 |
| Development & testing | Opus 4.6 (via subscription) | $200/month | Ongoing | $200 |
| **Total estimated** | | | | **$220-$260/month** |

At $1,000 initial investment, this covers **4-5 months** of development + production AI costs. Revenue from paid tiers will cover API costs within Year 1.

### Startup Cost Summary

| Category | Cost | Who Covers |
|---|---|---|
| LLC formation (Ohio) | $99 | Split |
| Registered agent (Year 1) | $50-$200 | Split |
| Operating agreement (lawyer) | $500-$1,000 | Split |
| Domain + hosting (Vercel Pro) | $20/month | Partner 1 |
| Claude API/subscription | $200-$260/month (up to $1,000 total) | Partner 1 |
| Firebase (Blaze plan) | $0-$50/month (pay-as-you-go) | Split |
| **Total Year 1** | **~$2,000-$4,000** | |

---

## 9. Legal Structure & F-1 Compliance

### LLC Formation

| Item | Details |
|---|---|
| **Entity** | Ohio LLC (multi-member) |
| **Filing** | Ohio Secretary of State, $99 |
| **Managing Member** | Partner 2 (US citizen) — handles all operations |
| **Passive Member** | Partner 1 (F-1) — equity holder, no active work without CPT/OPT |
| **EIN** | Apply via IRS Form SS-4 |
| **Operating Agreement** | Define roles, equity, profit distribution, IP assignment |

### F-1 Work Authorization Timeline

| Period | Authorization | Partner 1's Role |
|---|---|---|
| **Now** (academic year) | None needed | Passive investor/owner only. No coding, no sales, no management. Partner 2 runs everything. |
| **Summer 2026** | CPT | Active development (full-time OK). Apply through UC International Services. Need: offer letter from LLC, related course enrollment, DSO approval. |
| **Post-graduation** | OPT (12 months) | Full-time active role. Self-employment allowed if degree-related, full-time, properly documented. |
| **STEM OPT** | +24 months | Extended active role. Partner 2 must supervise (>50% control). E-Verify required for LLC. |

### Critical Rules

- Partner 1 **cannot** do any work (coding, marketing, sales, customer calls) during the academic year without CPT authorization
- Operating agreement must clearly document Partner 1's passivity during unauthorized periods
- Keep written records proving no unauthorized work activity
- Consult UC DSO and an immigration attorney **before** forming the LLC

---

## 10. Milestones & Timeline

### 2026

| Date | Milestone |
|---|---|
| **March 9** | Submit Agentic AI Challenge entry |
| **March** | Form Ohio LLC, file operating agreement |
| **April-May** | Partner 2 handles business setup (banking, EIN, domain) while Partner 1 remains passive |
| **June** | Partner 1 activates via summer CPT — intensive development sprint |
| **June-Aug** | Invoice PDF parser, Firestore persistence, user dashboard, bulk classification |
| **September** | Launch paid tiers (Starter $49, Professional $149) |
| **October** | Browser extension MVP (Chrome) |
| **November** | First 10 paying customers |
| **December** | Year 1 review, plan Year 2 |

### 2027

| Quarter | Milestone |
|---|---|
| **Q1** | Desktop app MVP (Mac first, then Windows) |
| **Q2** | API platform beta, first integration partners |
| **Q3** | 100 paying customers, $10K+ MRR |
| **Q4** | Seed funding round or revenue-sustaining |

### 2028

| Goal | Target |
|---|---|
| **Customers** | 500+ paid |
| **ARR** | $500K-$1M |
| **Team** | 3-5 people (engineering, sales, support) |
| **Product** | Web + extension + desktop + API — full platform |

---

## 11. Why This Works

### The Wedge

Every major player in customs/logistics software has the same blind spot: **they don't serve the importer directly.** CargoWise serves brokers. Flexport serves shippers who use their freight. Everyone assumes the importer will hire a broker and never think about compliance again.

But importers *want* to understand their own compliance. They want to know:
- "Is my broker classifying this correctly?"
- "How much will duties actually cost if I source from Vietnam instead of China?"
- "Am I going to get hit with a CBP penalty?"
- "What does Box 33A on my Form 7501 actually mean?"

We answer all of these. Nobody else does.

### The Moat (Over Time)

1. **AI-native architecture** — Built on Claude from day one, not bolted onto a 20-year-old .NET monolith
2. **Live USITC data** — Real-time tariff data with local fallback, not static tables
3. **Multi-surface presence** — Web + extension + desktop covers every workflow
4. **SMB trust** — We educate, not gatekeep. Importers learn from us.
5. **Network effects** — Every classification, every audit improves our understanding of common errors, edge cases, and industry patterns
6. **API platform** — Other tools build on us, creating switching costs

### The Ask

Form the LLC. Start with what we have — a working product, a real AI agent, and a clear market gap. The total investment is under $4,000 for Year 1, with a realistic path to $60K-$360K ARR by Year 2.

The worst case: we built impressive software, won a competition, and learned how to start a company.

The best case: we built the compliance intelligence platform that 320,000 U.S. importers have been waiting for.

---

*Drafted: February 28, 2026*
*For discussion between partners before LLC formation*
