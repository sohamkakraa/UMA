# Tidy Debug Panel

## What it is

A developer-only inspection panel attached to the "Tidy Beta" button. It shows exactly what happened during the last Tidy run: inputs sent, LLM prompt, proposed ops, and any schema errors.

## How to enable

Debug mode activates when either condition is true:

- URL query param: `?debug=1` (e.g. `http://localhost:3000/dashboard?debug=1`)
- localStorage flag: `localStorage.uma_debug = "1"` (set in browser console)

When active, a `Bug` icon appears next to the Tidy Beta pill. Click it to open `TidyDebugSheet`.

## Files

| File | Role |
|---|---|
| `src/components/tidy/TidyDebugSheet.tsx` | Sheet component with 4 collapsible sections |
| `src/components/nav/TidyButton.tsx` | Hosts the Bug toggle; stores debug runs in localStorage |
| `src/app/api/tidy/route.ts` | Extends response with `debug` envelope when `?debug=1` |

## API extension

`POST /api/tidy?debug=1` returns an extra `debug` field on the response:

```ts
type TidyDebugEnvelope = {
  inputSnapshot: {
    doctorCount: number;
    doctorNames: string[];      // first 5 only
    hospitalCount: number;
    hospitalNames: string[];    // first 5 only
    conditionCount: number;
    allergyCount: number;
    medicationCount: number;
  };
  promptText: string;           // full system + user messages concatenated
  rawLlmOutput: unknown;        // tool_use input before schema validation
  schemaErrors: { path: string; message: string }[];
  appliedOps: unknown[];
  rejectedOps: { op: unknown; reason: string }[];
};
```

The envelope is only included when `?debug=1` is present — no extra cost or risk in production.

## localStorage persistence

After each successful Tidy run in debug mode, the envelope is saved:

```ts
localStorage.setItem("uma_tidy_debug_runs", JSON.stringify(runs.slice(0, 5)));
```

Key: `uma_tidy_debug_runs` — last 5 runs, newest first.

## TidyDebugSheet layout

- Right-side slide-in sheet, `w-screen sm:w-[480px]`
- Header: title + timestamp + source
- 4 `<details>` sections (no library required):
  1. **Input** — counts + first-5 names + Copy JSON button
  2. **Retrieved** — full prompt text in `<pre>`, Copy prompt button
  3. **Proposed changes** — each op with kind badge + applied/rejected chip
  4. **Errors / warnings** — schema errors + raw LLM output

## Design notes

- CSS variables only; no hardcoded colours
- `text-xs` is acceptable here (developer surface, not user-facing)
- Bug icon is `max-sm:hidden` (hidden on mobile; the whole Tidy button is hidden on mobile)
