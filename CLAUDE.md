# UMA — CLAUDE.md

## Project Vision

UMA (Ur Medical Assistant) is a personal health companion that bridges the gap between raw medical data and human understanding. The core idea: connect to any hospital or clinic database the user has visited, pull their records into one place, and present everything in plain language that a non-medical person can actually understand and act on.

There are two primary views:

---

### 1. Dashboard (Health Overview)

The dashboard is the user's health home base. It should feel like a calm, well-organised summary of their body over time — not a clinical records dump.

Key dashboard sections:
- **Health trends** — charts of key biomarkers (HbA1c, LDL, glucose, etc.) over time, auto-populated from uploaded documents
- **Latest reports** — most recent lab reports, imaging summaries, diagnoses, prescriptions shown in a timeline
- **Medication tracker** — active medications with dose, frequency, start/end dates, and adherence notes; includes scheduled injections (e.g. monthly B12, quarterly vaccinations)
- **Quick profile snapshot** — name, DOB, conditions, allergies, primary care provider, next visit date
- **Doctor visit summary export** — printable/PDF one-pager for clinician visits

The dashboard language must be friendly and plain. Avoid raw clinical jargon without explanation. The goal is for a non-professional to look at it and say "I understand what is happening with my body."

---

### 2. Chat Interface (Health Companion)

A conversational AI agent the user can talk to about their health. It is NOT a diagnosis engine — it is a knowledgeable companion that helps the user understand and manage their health day-to-day.

Chat capabilities (to build toward):
- **Answer health questions** using the user's own stored records as context — "What was my last HbA1c?" "Am I still on Metformin?"
- **Book appointments** with doctors from any linked hospital or clinic
- **Recommend doctors** based on the user's conditions, location, and preferences when needed
- **Medication reminders** — proactively ask whether the user has taken their meds; track adherence conversationally
- **Wellness check-ins** — periodically ask how the user is feeling (mood, symptoms, energy) in a gentle, non-overwhelming way; one question at a time, not a form
- **Explain reports in plain English** — when a new document is uploaded, explain what it means without alarming language
- **Follow-up nudges** — remind about upcoming injections, scheduled visits, or pending referrals

Chat design principles:
- Never ask multiple questions at once — one question, wait for response
- Never be alarmist; frame everything supportively
- Never provide diagnosis or replace clinical advice — always note when the user should speak to a doctor
- Maintain context across the conversation (remember what the user said earlier in the session)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind CSS v4, custom CSS variables for theming (dark/light)
- **Components**: Custom component library in `src/components/ui/` (Button, Card, Badge, Input)
- **Charts**: Recharts (AreaChart for lab trends)
- **Icons**: Lucide React
- **PDF ingestion**: Anthropic Messages API with a `document` content block (base64 PDF); no local PDF text library for the LLM path
- **AI extraction**: Anthropic API via `@anthropic-ai/sdk` — PDF `document` block with **citations enabled**, free-form reply: small **`uma-meta` JSON fence** (metadata + patient names) plus **`markdownArtifact`** body (no API JSON Schema — avoids Anthropic union-type limits)
- **State / storage**: `localStorage` via `src/lib/store.ts` (`mv_patient_store_v1` key); no backend DB yet
- **Runtime**: Next.js API routes (`/api/extract`, `/api/chat`) running on Node.js

---

## Project Structure

```
src/
  app/
    page.tsx              # Landing / root redirect
    layout.tsx            # Root layout with ThemeInit and ChatDock
    dashboard/page.tsx    # Main health dashboard
    upload/page.tsx       # PDF upload and extraction UI
    docs/[id]/page.tsx    # Individual document detail view
    profile/page.tsx      # User profile editor
    login/page.tsx        # Login screen
    api/
      extract/route.ts    # POST — PDF → ExtractedDoc via Claude (PDF + citations + uma-meta JSON + markdown body; charts/labs not filled from JSON)
      chat/route.ts       # POST — question + store → answer (Claude preferred; OpenAI optional fallback; parallel PDF records agent when ANTHROPIC_API_KEY is set)
      auth/
        login/route.ts
        logout/route.ts
  components/
    ui/                   # Button, Card, Badge, Input, cn utility
    chat/ChatDock.tsx     # Floating chat widget used in root layout
    theme/ThemeInit.tsx   # Applies theme from store on mount
    theme/ThemeToggle.tsx # Dark/light toggle
  lib/
    store.ts              # localStorage read/write, seed data, mergeExtractedDoc, removeDoc
    types.ts              # PatientStore, ExtractedDoc, ExtractedMedication, ExtractedLab, etc.
```

---

## Data Model

Defined in `src/lib/types.ts`. All state lives in `PatientStore` (stored in `localStorage`):

```ts
PatientStore {
  docs: ExtractedDoc[]        // All uploaded + extracted documents
  meds: ExtractedMedication[] // Merged active medication list
  labs: ExtractedLab[]        // All lab values (append-only, deduped)
  profile: {                  // User profile
    name, dob, sex, email, phone
    primaryCareProvider, nextVisitDate
    trends: string[]          // Which lab metrics to chart on dashboard
    allergies: string[]
    conditions: string[]
    notes?: string
  }
  preferences: { theme: "dark" | "light" }
  updatedAtISO: string
}
```

`ExtractedDoc` carries: `id`, `type` (Lab report / Prescription / Bill / Imaging / Other), `title`, `dateISO`, `provider`, `summary`, `medications[]`, `labs[]`, `tags[]`, `allergies[]`, `conditions[]`, `sections[]`.

---

## Key Behaviours & Invariants

- **Store merge logic** (`store.ts → mergeExtractedDoc`): new docs prepend; meds dedupe by lowercase name (latest wins); labs append and dedupe by `name|date|value|unit` key; allergies/conditions union-merge into profile.
- **Lab normalisation** (`standardized.ts`): canonical names like HbA1c, LDL, HDL, TSH, etc. are enforced so chart lookups and markdown tables stay consistent.
- **LLM extraction** (`extract/route.ts` → `medicalPdfPipeline.ts`): requires `ANTHROPIC_API_KEY`. PDFs use a base64 **`document`** block with **`citations: { enabled: true }`** and **`messages.create`**. The model returns `uma-meta` JSON + markdown; then **`parseMarkdownArtifact.ts`** fills `doc.labs`, `medications`, `allergies`, `conditions`, `sections`, `doctors`, `facilityName` from pipe tables and bullet sections. **`mergeExtractedDoc`** runs **`enrichDocFromMarkdown`** again after lexicon patches so client-side merges stay in sync. Run **`npm test`** (Vitest) for parser coverage.
- **Chat route** (`api/chat/route.ts`): uses Claude when `ANTHROPIC_API_KEY` is set (store as system context), else OpenAI if `OPENAI_API_KEY` is set, else keyword fallback. Attaching a PDF in chat runs the same extraction pipeline in parallel when `ANTHROPIC_API_KEY` is set.
- **Theme**: CSS custom properties (`--accent`, `--bg`, `--panel`, `--border`, `--fg`, `--muted`, etc.) are set by `ThemeInit` on the `<html>` element. Always use these variables, never hardcode colours.
- **No server-side persistence yet**: everything is `localStorage`. Future work will add a backend with proper auth and hospital API connectors.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Required for PDF upload extraction and for chat when using Claude. |
| `ANTHROPIC_MODEL` | Chat model (default: `claude-haiku-4-5-20251001`). |
| `ANTHROPIC_PDF_MODEL` | PDF extraction model (default: `claude-sonnet-4-5-20250929`). |
| `OPENAI_API_KEY` | Optional chat fallback if Anthropic is not configured. |
| `OPENAI_CHAT_MODEL` | OpenAI chat model when using the fallback (default: `gpt-4o-mini`). |

---

## Development Commands

```bash
npm run dev    # Start dev server (Next.js on port 3000)
npm run build  # Production build
npm run lint   # ESLint
```

---

## Planned / Future Work

In rough priority order:

1. **LLM-powered chat** — replace the keyword-match in `/api/chat` with an actual LLM call (Claude recommended) that gets the full `PatientStore` as system context and answers in plain, supportive language
2. **Medication reminder system** — scheduled notifications or proactive chat messages asking "Did you take your Metformin this morning?"
3. **Injection / recurring treatment tracker** — separate tracker for periodic injections (B12, insulin, vaccinations) with a countdown to the next due date
4. **Appointment booking** — integrate with hospital/clinic scheduling APIs; surface available slots from within chat
5. **Doctor recommendation engine** — match user conditions and location to appropriate specialists
6. **Hospital database connectors** — FHIR-compliant API integrations to pull records directly from visited hospitals/clinics (replacing or supplementing manual PDF upload)
7. **Backend persistence** — move from `localStorage` to a proper database with user auth, so data persists across devices
8. **Wellness check-in loop** — gentle daily/weekly prompts in chat asking how the user feels; store symptom notes over time for trend analysis
9. **Plain-language report explainer** — on document upload, automatically generate a "what this means for you" summary in the chat

---

## Coding Guidelines

- Keep language plain and patient-friendly everywhere it surfaces in UI copy.
- Never display raw clinical codes, abbreviations, or flags without a plain-English label next to them.
- The disclaimer "Not medical advice" must appear wherever AI-generated content is shown to the user.
- Prefer editing existing files over creating new ones.
- Do not add speculative abstractions — build exactly what the current feature needs.
- Maintain the custom CSS variable system; do not introduce Tailwind colour utilities that bypass it.
- All API routes must validate input with Zod before processing.
- Patient data is sensitive — never log PII to the console.
