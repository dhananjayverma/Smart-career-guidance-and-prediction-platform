# Mentor Memory MongoDB Migration Plan

## Current State

Learning memory is stored locally in `backend/data/mentorLearning.json`.

It tracks:

- user education
- preferred branch/course
- interests
- emotion patterns
- recent support context
- repeated prompt patterns

This is good for local development, but production should use MongoDB as the primary store.

## Target Store

Use a dedicated `MentorMemory` collection. Keep `Session` for short chat history only.

Recommended shape:

```js
{
  userId,
  version: 1,
  promptCount: 0,
  education: 'graduation',
  preferredBranch: 'B.Tech CSE',
  preferences: {},
  interests: {
    ai: { weight: 0.9, count: 4, lastUsed: Date, source: 'inferred' },
    coding: { weight: 0.8, count: 3, lastUsed: Date, source: 'inferred' }
  },
  emotions: {
    stressed: { weight: 0.7, count: 2, lastUsed: Date, source: 'emotional' }
  },
  recentNeeds: [],
  meta: {},
  createdAt,
  updatedAt
}
```

## Importance Score

Each learned signal should store:

- `count`: how many times it appeared
- `weight`: priority score from `0` to `1`
- `lastUsed`: when it was last seen

Suggested weight update:

```js
newWeight = Math.min(
  1,
  oldWeight * 0.8 + signalStrength * 0.6 + recencyBoost
)
```

Use higher signal strength for:

- repeated interests
- explicit statements like “main B.Tech CSE me hu”
- emotional phrases
- chosen roadmap/career clicks

Signal priority:

```text
explicit > behavioral > emotional > inferred
```

Pollution control:

```js
storeSignal = count >= 2 || signalStrength >= 0.7 || source === 'explicit'
```

## Migration Steps

1. Keep JSON fallback for development.
2. Add `getMemory(userId)`:
   - if MongoDB connected, read `MentorMemory`
   - else read JSON
3. Add `updateMemory(userId, signals)`:
   - if MongoDB connected, update `MentorMemory`
   - else write JSON
4. Backfill existing JSON users into MongoDB once on startup or with an admin script.
5. Keep JSON fallback for outages.

## Safety Rules

- Never store raw sensitive crisis text forever without limits.
- Keep `recentNeeds` capped to 5 short entries.
- Allow memory clear/reset per user.
- Do not let user memory override safety handling.
- Local crisis/emotion route always runs before cache/template/AI.

## Future Collection

Implemented model:

```js
{
  userId,
  version,
  education,
  preferredBranch,
  interests,
  emotions,
  recentNeeds,
  analytics,
  createdAt,
  updatedAt
}
```

Index:

```js
{ userId: 1 }
```

## Product Goal

The mentor should get smarter without needing OpenAI for common cases:

```text
Emotion/support -> local emotion engine
Common career query -> template
Known user profile -> memory-personalized local answer
Complex free-form query -> AI fallback
```
