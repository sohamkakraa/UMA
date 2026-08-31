# BYOK — Bring Your Own Key

## What it is

BYOK lets users plug in their own LLM API key so that chat and AI features use that key instead of UMA's server-managed Anthropic key. The user's costs go directly to the provider they choose.

## Registry

**`src/lib/providers/registry.ts`** — single source of truth for all supported providers.

Each entry in `PROVIDERS` (typed as `Record<ProviderId, ProviderSpec>`) contains:
- `id`, `label`, `docsUrl`, `consoleUrl` — display metadata
- `apiKeyPattern` — optional regex to validate the key format before calling the API
- `curatedModels` — array of `ProviderModel` with pricing (`inputPerMTok`, `outputPerMTok`), context window, and capability flags (`supportsTools`, `supportsVision`)
- `verify(key, modelId)` — async function that makes a minimal live call to the provider to confirm the key works; returns `{ ok: true }` or `{ ok: false; reason: string }`

### How to add a new provider

1. Add its `ProviderId` to the union type in `registry.ts`.
2. Add a `ProviderSpec` entry to `PROVIDERS` with at least one curated model and a `verify` implementation.
3. If the provider is OpenAI-compatible, use the `openai` package with `baseURL` set to the provider's endpoint — see `deepseek`, `moonshot`, `perplexity`, `huggingface` for examples.
4. If the provider has a custom HTTP API, use `fetch` with a 10 s `AbortController` timeout — see `google` for an example.
5. Run `npm run lint && npx tsc --noEmit` to verify no type errors.

## Database model

`UserLlmCredential` in `prisma/schema.prisma` — one row per user (upsert pattern).

| Field | Notes |
|---|---|
| `userId` | PK, FK → `users.id` ON DELETE CASCADE |
| `provider` | ProviderId string, e.g. "anthropic" |
| `modelId` | Selected model id |
| `apiKeyCipher` | BYTEA — pgp_sym_encrypt output |
| `apiKeyLastFour` | Last 4 chars of the plaintext key (for display only) |
| `verifiedAt` | Set when verify() passes |

## Encryption invariant

- The plaintext API key **never** leaves the server.
- Keys are encrypted with `pgp_sym_encrypt(plaintext, secret)` and decrypted with `pgp_sym_decrypt(cipher, secret)` — both are PostgreSQL functions from the `pgcrypto` extension.
- The master secret is `LLM_CRED_MASTER_SECRET` (env var, server-side only, 32+ char random string).
- No API endpoint ever returns the cipher or the plaintext key. The verify/GET endpoints return only `lastFour` and metadata.

## Server helpers

**`src/lib/server/llmCredentials.ts`** exports:
- `saveCredential(userId, provider, modelId, apiKey)` — encrypt + upsert
- `loadCredential(userId)` — decrypt + return full object (for use by chat routes when BYOK is active)
- `deleteCredential(userId)` — hard delete
- `getCredentialMeta(userId)` — returns provider/model/lastFour/verifiedAt without decrypting (used by the GET endpoint)

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/profile/llm-credentials` | GET | Returns `{ provider, modelId, lastFour, verifiedAt }` or `null` |
| `/api/profile/llm-credentials` | DELETE | Removes the stored credential |
| `/api/profile/llm-credentials/verify` | POST | Validates key + model, saves if ok, returns `{ ok, lastFour }` |

## Profile UI

The "AI provider" `<section>` is in `src/app/profile/page.tsx` (anchored `id="profile-ai-provider"`). It shows:
- A badge: "Using your key" (accent) or "Using UMA's default" (muted)
- Provider + model dropdowns (provider excludes "default" from user-selectable list)
- API key input with show/hide toggle, or masked display when a key is already saved
- "Save & verify" button — calls the verify endpoint
- "Use UMA's default again" text link — calls DELETE and resets UI
- `RecordNoticeToast` for confirmation messages

## Future work

The `getLlmClient` factory (item 11 — modularity audit) will use `loadCredential` to route chat requests through the user's own key when one is stored. Until then, storing/managing the credential is complete but the chat route still uses `process.env.ANTHROPIC_API_KEY`.
