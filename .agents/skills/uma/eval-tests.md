# UMA Playwright E2E Test Suite

## Overview

UMA uses Playwright for end-to-end tests. The suite lives in `tests/e2e/` and runs against a live Next.js dev server (or a pre-built production server in CI).

## Directory Layout

```
tests/e2e/
  fixtures/
    auth.ts              # dev-token cookie helper + authenticatedPage fixture
    seed-store.ts        # ARJUN_FIXTURE + seedPatientStore() helper
    personas/
      elderly.ts         # 200% font scale, prefers-reduced-motion emulation
      young-fast.ts      # baseline (no modifications)
  flows/                 # Functional smoke/flow tests
    dashboard.spec.ts    # Concerning items, BMI tile, LDL flag, responsive width
    chat.spec.ts         # Active/Archived tabs, thread operations
    upload.spec.ts       # Upload redirect check
    profile.spec.ts      # Profile page load
    notifications.spec.ts # Notification bell visibility
  visual/                # Golden screenshot tests at multiple viewports
    dashboard.spec.ts    # 375/393/768/1280px
    chat.spec.ts         # 375/1280px
    profile.spec.ts      # 375/1280px
  a11y/
    full-page.spec.ts    # Console-error-free load check (axe stub pending)
  __screenshots__/       # Stored golden screenshots (committed)
playwright.config.ts     # Root config — elderly + young-fast projects
```

## NPM Scripts

| Script | Purpose |
|---|---|
| `npm run eval` | Run all tests (elderly + young-fast projects) |
| `npm run eval:visual` | Run visual regression tests only |
| `npm run eval:a11y` | Run accessibility tests only |
| `npm run eval:update-snapshots` | Regenerate golden screenshots |

## Auth Fixture

E2E auth uses a **signed** `mv_session` cookie via `loginWithDevToken(page)` (calls `signSessionToken` — the old plain `dev-token` value no longer works). For the OpenAI CUA agent, use `POST /api/auth/test-session` (dev only) or `npm run test:cua`.

```ts
import { loginWithDevToken } from "../fixtures/auth";
await loginWithDevToken(page);
await page.goto("/dashboard");
```

## Patient Store Fixture

`seedPatientStore(page)` writes the `ARJUN_FIXTURE` to `localStorage` key `mv_patient_store_v1` and reloads the page.

- Patient: Arjun Mehta, DOB 1955-04-12, 175cm/76kg
- Meds: Metformin 500mg 2x/day, Atorvastatin 10mg 1x/day
- Labs: HbA1c 6.2%, LDL 145 mg/dL (flagged above range)
- Conditions: Type 2 Diabetes, Hypertension
- Allergy: Penicillin

## Personas

- **elderly**: 393x852 viewport, 200% root font size (32px), prefers-reduced-motion
- **young-fast**: Desktop Chrome, no modifications

## Visual Regression

Screenshots stored in `tests/e2e/__screenshots__/`. Run `npm run eval:update-snapshots` to regenerate after intentional UI changes. `maxDiffPixelRatio: 0.005` tolerance.

## A11y Tests (Stub)

`a11y/full-page.spec.ts` currently checks that `/dashboard`, `/chat`, `/profile` load without critical console errors. Full axe-core scanning is stubbed pending `npm install --save-dev @axe-core/playwright`.

## CI

`.github/workflows/e2e.yml` runs on every PR:
1. Installs Chromium only (`npx playwright install --with-deps chromium`)
2. Builds the app (`npm run build`)
3. Runs `npm run eval` with `CI=true`
4. Uploads `playwright-report/` as artifact on failure (7-day retention)

The CI workflow does NOT start a webserver — the app must be running (handled by the build step and `npm start`). Note: the current workflow runs `npm run eval` without explicitly starting the server between build and test — update the workflow to add `npm start &` + wait-on if needed.
