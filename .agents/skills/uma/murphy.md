---
name: Murphy visual regression
description: How to run ProsusAI/Murphy for UX/visual regression on UMA — usage, persona files, output layout, CI integration
type: project
---

# Murphy — Visual / UX Regression

Murphy (`ProsusAI/Murphy`) is the visual regression tool used on UMA for UI-change PRs.

## When to use

Run a Murphy session for any item that changes layout, colours, typography, or component visibility — especially bento cards, the chat sidebar, and the dashboard sections.

## When NOT to use

- Pure backend / API-only changes (no UI surface changed).
- Hotfixes where the visual diff would be trivially zero.

## Running Murphy

**Pre-requisite:** `uv` must be on `$PATH`. Murphy must be checked out locally.

```bash
# Before every run — pull latest Murphy
git -C path/to/Murphy pull origin main

# From the UMA project root:
npm run murphy                         # browse localhost:3000
npm run murphy:goal                    # goal-directed run (prompts for goal text)
npm run murphy:auth                    # with auth flow
npm run murphy:open                    # open last run report
```

## Persona file convention

Generate personas once, commit to `murphy/output/personas.json`, then pass `--personas murphy/output/personas.json` on every run. This keeps persona behaviour deterministic across sessions.

## Output directory convention

```
murphy/output/<batch>/<itemN>/   # e.g. murphy/output/2026-05-07c/item6/
murphy/output/ci/                # CI runs (ephemeral, uploaded as artifact)
```

Commit: the summary report JSON and any flagged screenshots.
Gitignore: raw screenshot frame sequences (too large).

## CI integration

`.github/workflows/murphy.yml` runs Murphy against the Vercel preview URL on every PR with the `ui` label. **Non-blocking for the first 2 weeks** (`continue-on-error: true`). Flip to required after a baseline is established.

To mark as required:
1. Remove `continue-on-error: true` from `murphy.yml`.
2. Add the job to the branch protection required checks in GitHub settings.

## Interpreting a failed run

- **Visual diff > threshold**: Murphy outputs a diff image. Open `murphy/output/ci/` artifact. If the diff is intentional (you changed the UI), run `npm run eval:update-snapshots` and commit.
- **Goal not met**: Murphy couldn't find the element or state your `--goal` specified. Check: is the dev server running? Is the element conditional on data? Check seed data.
- **Persona crash**: Python/uv version mismatch. Ensure `uv` ≥ 0.4 and Python ≥ 3.11.

## Gotchas

- Murphy requires `localhost:3000` (or a live URL) — it does NOT drive Next.js in test mode.
- Always `git pull` Murphy before a run; the tool evolves quickly.
- The `--auth` flag is needed when the page under test requires a login session.
