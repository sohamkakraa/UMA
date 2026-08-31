---
name: CODE_REPO.md registry
description: How to read and update CODE_REPO.md — the per-file index of every source file in UMA
type: project
---

# CODE_REPO.md — File Registry

## Read this first before opening source files.

`CODE_REPO.md` at the project root is a living index of every TypeScript, TSX, Prisma, and script file in the UMA codebase. Read it before using Glob/Grep to understand the structure.

## When to read it
- Before any code change: find the right files without scanning the whole tree.
- When you're unfamiliar with a directory: the section header tells you what lives there.
- When asked where a feature is implemented: search CODE_REPO.md first.

## When to update it
**You MUST update CODE_REPO.md in the same commit whenever you:**
- Add a new file
- Delete a file
- Rename a file
- Significantly change a file's purpose (re-describe it)

The pre-commit hook (`scripts/check-code-repo-sync.mjs`) auto-stubs new files with "TODO: describe". Replace the stub with a real one-line description before merging.

## Pre-commit contract

The hook runs automatically on `git commit`:
1. Reads staged files.
2. For each `.ts`/`.tsx`/`.mjs`/`.prisma` file in `src/`, `scripts/`, or `prisma/`:
   - If already in CODE_REPO.md → pass.
   - If missing → appends a stub row and stages CODE_REPO.md automatically.
3. The CI job `code-repo-check` blocks merge on any line containing `TODO: describe`.

## Bootstrap script

To regenerate CODE_REPO.md from scratch (e.g. after a large refactor):
```bash
node scripts/bootstrap-code-repo.mjs
```
This overwrites CODE_REPO.md. Then fill in descriptions manually before committing.

## Row format

```
- `path/to/file.ts` · N lines · One-line purpose · exports: `foo`, `bar`
```

- Line count is informational (not enforced).
- "One-line purpose" must describe WHAT it does, not HOW.
- "exports:" lists the top 8 named exports; omit if the file has none.

## CI guard

`.github/workflows/code-repo-check.yml` fails PRs when any row still has `TODO: describe`. This forces descriptions to be filled in before merge. It does NOT run on main commits directly — only on PRs.

## Gotchas

- The registry becomes stale after large refactors. Run bootstrap to reset, then re-describe key files.
- Worktree directories (`.claude/worktrees/`) are excluded from the registry.
- Test files (`*.test.ts`, `__tests__/`) are excluded; their purpose is obvious from the test name.
