# CLAUDE.md — Tariff Compliance Copilot

## Project Overview
AI-powered U.S. import compliance and tariff intelligence platform for small-to-mid-size businesses. Classifies goods into HTS codes, calculates duties, scores compliance risks, and simulates tariff scenarios.

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Radix UI
- **Backend:** Firebase (Auth, Firestore, Storage) + Next.js API Routes
- **AI:** Anthropic Claude API via Vercel AI SDK (streaming, tool calling)
- **Charts:** Recharts (via shadcn/ui chart component)
- **Forms:** React Hook Form + Zod
- **Package Manager:** pnpm

## Firebase Config
- **Project ID:** tariff-compliance-copilot
- **Auth Domain:** tariff-compliance-copilot.firebaseapp.com
- **Storage Bucket:** tariff-compliance-copilot.firebasestorage.app
- **Hosting:** tariff-compliance-copilot.web.app

## Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/components/ui/` — shadcn/ui primitives (auto-generated, do not manually edit)
- `src/components/` — Feature-specific components (classification, calculator, scenarios, etc.)
- `src/lib/firebase/` — Firebase client and admin configuration
- `src/lib/ai/` — Claude agent setup, tool definitions, system prompts
- `src/lib/services/` — Business logic (HTS lookup, duty calc, risk scoring)
- `src/lib/types/` — TypeScript type definitions
- `scripts/` — HTS data seeding and scraping scripts

## Conventions
- Use `pnpm` for all package operations
- Use shadcn/ui components — install with `pnpm dlx shadcn@latest add <component>`
- Use the `cn()` utility from `src/lib/utils/cn.ts` for conditional classes
- API routes go in `src/app/api/` following REST conventions
- All Firestore operations go through `src/lib/firebase/firestore.ts`
- AI tool definitions use Zod schemas in `src/lib/ai/schemas.ts`
- Forms use React Hook Form with Zod resolvers for validation
- Git: always work on `dev` branch, merge to `main` when stable
- Hosting: Firebase Hosting (primary), Vercel as backup

## Important Context
- CBP Form 7501 is the Entry Summary form — 47 fields across 27 pages
- HTS codes are 10-digit Harmonized Tariff Schedule codes from USITC (hts.usitc.gov)
- Duty calculation includes: general duty + special tariffs (Section 301/232/201) + AD/CVD + MPF + HMF
- MPF: 0.3464% of entered value (min $31.67, max $614.35)
- HMF: 0.125% of entered value (ocean shipments only)
- Reference materials are in `ZIP for Agent/` at project root

## CBP Form 7501 Field Reference (Key Fields)
- **1** Filer Code/Entry Number — **2** Entry Type — **3** Summary Date
- **8** Importing Carrier — **9** Mode of Transport — **10** Country of Origin
- **12** B/L or AWB Number — **13** Manufacturer ID
- **19** Foreign Port of Lading — **20** U.S. Port of Unlading
- **31** Line No — **32** Description of Merchandise
- **33A** HTSUS No / **33B** AD/CVD No
- **34A** Gross Weight / **34B** Manifest Qty — **35** Net Quantity in HTSUS Units
- **36A** Entered Value / **36B** CHGS / **36C** Relationship
- **37A** HTSUS Rate / **37B** AD/CVD Rate / **37C** IRC Rate / **37D** Visa Number
- **38** Duty and IR Tax (Dollars + Cents)
- **39** Total Entered Value
- **41** Total Duty — **42** Tax — **43** Other — **44** Total

## Test Data (from reference invoices)
- **Product:** Men's UC Bearcats Hooded Sweatshirt (80% Cotton / 20% Polyester)
- **HTS Code:** 6110.20.2079 (Sweaters, pullovers of cotton, knitted)
- **Section 301 HTS:** 9903.88.15 (7.5% additional)
- **Origin:** China (Guangzhou Elite Apparel Manufacturing Co., Ltd.)
- **Quantity:** 500 pieces, 350 kg, 5 cartons
- **Unit Value:** $18.00, **Total:** $9,000.00
- **General Duty:** 16.5% = $1,485.00
- **Section 301:** 7.5% = $675.00
- **MPF:** $31.18
- **Total Duties:** $2,191.18

## Commands
- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- `pnpm test` — Run Vitest
