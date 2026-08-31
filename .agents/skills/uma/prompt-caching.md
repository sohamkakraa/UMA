---
name: Anthropic prompt caching
description: How UMA caches the LLM system prompt to cut input-token cost by ~90% within a 5-minute window
type: project
---

# Prompt Caching in UMA

## What is cached

UMA splits the chat system prompt into two parts:

### cacheablePrefix (static — cached by Anthropic for 5 min)
- Allergy safety banner
- "You are the conversation agent for UMA…" framing block
- `=== PATIENT PROFILE ===`
- `=== MEDICATIONS ===`
- `=== LAB VALUES ===`
- `=== SAVED DOCUMENTS ===` (BM25-ranked docs and excerpts)
- `=== CUSTOM LAB LABELS ===`
- `=== INSURANCE PLANS ===`
- `=== INSURANCE CLAIMS HISTORY ===`
- All behavior guidelines and instruction blocks
- Bills requiring claim section
- Insurance agent guidance
- Lab trend rules

### dynamicSuffix (per-turn — must NOT be cached)
- `viewingLabel` — changes when the user switches family members mid-session
- `diaryAugment` — reminder chip context, per-turn medication intake injections

## Where the cache_control lives

```ts
// src/app/api/chat/route.ts — conversationAgentLLM and conversationAgentLLMStream
system: [
  { type: "text", text: cacheablePrefix, cache_control: { type: "ephemeral" } },
  ...(dynamicSuffix ? [{ type: "text", text: dynamicSuffix }] : []),
],

// src/app/api/threads/[id]/messages/route.ts — callConversationLLM
system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
```

## OpenAI fallback
OpenAI does not support Anthropic-style `cache_control`. In the OpenAI path, prefix + suffix are concatenated into a single string. Marked with `// OpenAI: caching n/a`.

## Cache invalidation
Any character change in `cacheablePrefix` breaks the cache. That is why the `viewingLabel` (which changes per family member) is separated into `dynamicSuffix`. The patient profile, meds, and labs change only when a document is uploaded or the profile is edited — these naturally invalidate the cache, which is the expected behaviour.

**Do NOT** try to partially invalidate the cache. Anthropic's cache is prefix-keyed; the first block with `cache_control` that changes invalidates the cache for that block and everything after.

## Telemetry

The Anthropic API returns:
- `cache_creation_input_tokens` — tokens written to cache on a cache miss (cost: 1.25× normal input)
- `cache_read_input_tokens` — tokens read from cache on a cache hit (cost: 0.10× normal input)

Both are included in the `usage` event emitted over SSE from `/api/chat`. The `computeChatCost` function accounts for both.

## Acceptance test
Send 4 chat messages in a thread within 60 s. Message 1 should report `cache_creation_input_tokens > 0` and `cache_read_input_tokens === 0`. Messages 2–4 should report `cache_creation_input_tokens === 0` and `cache_read_input_tokens > 0`. Total cost across 4 messages should be <30% of the uncached equivalent.

## When to watch for cache misses
- When patient data changes (doc upload, profile edit) — expected cache miss on next turn
- When switching family members — viewingLabel changes, but cacheablePrefix is unchanged → cache still hits
- After 5 minutes of inactivity — Anthropic's TTL expires; next turn re-fills the cache

## Gotchas
- Cache TTL is 5 minutes from the Anthropic SDK, not 5 minutes from the first message. Each write resets the TTL.
- The streaming API (`messages.stream`) reports `cache_creation_input_tokens` in the `message_start` event.
- `cache_control` is only supported by Anthropic's API; it is silently ignored / errors on other providers.
