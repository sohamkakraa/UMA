---
name: UMA Modularity Rules
description: Architectural invariants for component boundaries, store access, LLM access, and extraction pipeline usage in UMA
type: project
---

# UMA Modularity Rules

Codified from the 2026-05-07c batch modularity audit. Violations found and fixed are noted.

## 1. Store access — only via `src/lib/store.ts`

**Rule:** No component or lib file may call `localStorage.setItem("mv_patient_store_v1", …)` or `localStorage.getItem("mv_patient_store_v1")` directly. All reads go through `getStore()` / `getViewingStore()` / `getHydrationSafeStore()`; all writes go through `saveStore()` / `saveViewingStore()`.

**Why:** Direct writes skip the change-detection short-circuit (`stripUpdatedAt`), skip `scheduleRemotePush`, and can corrupt the merge logic. Discovered violations in `familyConnections.ts` (5 direct writes) and `profile/page.tsx` (1 direct write) — both fixed in this batch.

**How to apply:** Before writing to the store in any file, verify it imports from `@/lib/store`. If the import is missing, add it. Never copy-paste the `mv_patient_store_v1` key string outside `store.ts`.

**Key store exports:**
- `getStore()` — reads root store (current user or active family member context)
- `getViewingStore()` — reads the "viewing" store (root or active member)
- `saveStore(store)` — writes root store, dispatches `mv-store-update`, schedules remote push
- `saveViewingStore(store)` — writes root or member store depending on active family context
- `getHydrationSafeStore()` — SSR-safe empty store before hydration

## 2. Shared primitives — only from `src/components/ui/`

**Rule:** Every Button, Input, Select, Dialog, Sheet, Tooltip, Popover, Badge, Card, Combobox, DatePicker must come from `src/components/ui/`. No duplicate implementations elsewhere.

**Why:** Ensures consistent tap targets (≥ 44×44 px), CSS variable theming, and accessibility.

**Current `src/components/ui/` inventory:**
`Badge`, `Button`, `Card`, `Combobox`, `DatePicker`, `DateTimePicker`, `Dialog`, `DropdownMenu`, `Footer`, `GlobalUploadBadge`, `Input`, `Popover`, `RecordNoticeToast`, `Select`, `Sheet`, `TimePicker`, `Tooltip`, `UploadProgressSheet`, `chart`, `cn`

**Exceptions allowed:** Icon-only toggle buttons and chip buttons that don't match the `Button` API may use raw `<button>` elements, but must still use CSS variables and meet the 44×44 px tap target requirement.

## 3. Each bento widget = self-contained component with clear props contract

**Rule:** Dashboard widget content lives in dedicated components under `src/components/health/`, `src/components/labs/`, etc. No widget logic inlined into `src/app/dashboard/page.tsx` beyond passing props and calling store reads.

**Current state:** `dashboard/page.tsx` is 2800+ lines with inline helpers. The bento widget components (`BmiCard`, `DashboardHealthLogSection`, `ConcerningTile`, `HealthTrendsSection`) are self-contained. Further widget extraction is future work.

**How to apply:** When adding a new bento widget, create `src/components/<domain>/<WidgetName>.tsx` with typed props. Never add a new inline component function inside `dashboard/page.tsx`.

## 4. Extraction pipeline — single entry point

**Rule:** All PDF extraction goes through `extractMedicalPdfFromBuffer` exported from `src/lib/server/medicalPdfPipeline.ts`. No other code calls the Anthropic PDF/document block API for extraction purposes.

**Status: CLEAN** — confirmed only `api/extract/route.ts` and `api/chat/route.ts` call this function.

## 5. LLM access — `src/lib/server/llmCredentials.ts` for BYOK

**Rule:** When a user has a BYOK key stored (`UserLlmCredential`), load it via `loadCredential(userId)` from `src/lib/server/llmCredentials.ts` before constructing any LLM client. The BYOK override is currently implemented at the API route level (chat, tidy, extract) — not yet centralized via a `getLlmClient(userId, role)` factory.

**Current state:** `process.env.ANTHROPIC_API_KEY` is read scattered across ~10 files (chat/route.ts, tidy/route.ts, medicalPdfPipeline.ts, threadNaming.ts, cavemanSummarize.ts, etc.). This is a known gap — a `getLlmClient(userId, role)` factory in `src/lib/server/llmProviders/anthropic.ts` is planned but not yet built.

**How to apply (interim):** When adding a new LLM call, import `loadCredential` and check for a user key before falling back to `process.env.ANTHROPIC_API_KEY`.

## 6. Co-located hooks rule

**Rule:** Logic extracted from a widget component goes into a `*.hooks.ts` sibling file or into `src/lib/<domain>.ts` — never inlined into the page. Example: if `BmiCard` needs complex derived state, extract it to `src/lib/bmi.ts`, not to `dashboard/page.tsx`.

## Violations found in 2026-05-07c audit

| File | Violation | Fix |
|---|---|---|
| `src/lib/familyConnections.ts` | 5 direct `localStorage.setItem` calls | Fixed — now uses `getStore()` + `saveStore()` |
| `src/app/profile/page.tsx:2182` | 1 direct `localStorage.setItem` call | Fixed — now uses `getStore()` + `saveStore()` |
| `src/app/dashboard/page.tsx` | 2800+ line page with inline helpers | Documented — future extraction work |
| Multiple API routes | Scattered `process.env.ANTHROPIC_API_KEY` reads | Documented — `getLlmClient` factory is future work |
