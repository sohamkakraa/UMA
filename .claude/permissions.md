# Required Permissions and Guardrails

## Allowed

- Read and edit files inside this workspace.
- Run project scripts (`npm run dev`, `npm run build`, `npm run lint`).
- Call internal API routes used by the local app.

## Must Follow

- Do not hardcode secrets. Use environment variables only.
- Do not log patient-identifying data in browser or server logs.
- Keep UI copy patient-friendly and plain language.
- Keep the disclaimer "Not medical advice" where AI-generated content appears.
- Preserve theme tokens (`--bg`, `--panel`, `--accent`, etc.) instead of hardcoded palette classes.

## Git Safety

- Do not run destructive git commands unless explicitly requested.
- Do not amend existing commits unless explicitly requested.
- Do not push to remote unless explicitly requested.
