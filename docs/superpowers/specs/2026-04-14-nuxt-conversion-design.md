# Convene the Council — Nuxt Conversion & Feature Flags

## Context

The app is a Vue 3 + Tailwind SPA with a Netlify serverless backend. Users "convene a council" of AI personas to discuss topics. Currently hardcoded with 5 free members and 6 premium/locked members defined in two places (frontend and backend), requiring synchronized updates.

## Goals

1. Convert to Nuxt 3 multi-page app
2. Centralize council member configuration
3. Add `LIMITED_FEATURES` env var for free hosted tier vs self-hosted
4. Add `/deploy` page with deployment instructions
5. Enable self-hosted users to customize their council (Phase 2)

---

## Decision: Nuxt 3

**Approach:** Convert from vanilla Vue 3 SPA to Nuxt 3 with file-based routing.

**Trade-offs:**
- Adds build step (was CDN-only, zero config)
- Gains server-side rendering, better routing, auto-imports
- More standard Vue ecosystem

**Verdict:** Acceptable for the maintainability gains.

---

## Architecture

```
/
├── app.vue                  # Root layout with nav
├── pages/
│   ├── index.vue            # Main council page
│   └── deploy.vue          # Deployment instructions
├── config/
│   └── council.ts           # Single source of truth for members
├── components/
│   ├── CouncilMember.vue    # Individual member card
│   ├── CouncilChat.vue      # Chat interface for a member
│   ├── Header.vue           # Navigation header
│   └── DeployCard.vue       # Deploy button/card component
├── server/
│   └── api/
│       └── council.ts       # API endpoint (was netlify function)
├── nuxt.config.ts
└── .env.example
```

### Config File: `config/council.ts`

```typescript
export interface CouncilMember {
  id: string
  name: string
  title: string
  description: string
  model: string
  systemPrompt: string
  avatar: string
  availableWhenLimited: boolean  // true = shown in free tier, false = locked in free tier
}

const members: CouncilMember[] = [
  // 5 free members with full config
  {
    id: 'pragmatist',
    name: 'The Pragmatist',
    title: 'Practical Solutions Expert',
    description: '...',
    model: 'deepseek/deepseek-v3.2',
    systemPrompt: 'You are a pragmatic thinker...',
    avatar: '🧠',
    availableWhenLimited: true,  // shown when LIMITED_FEATURES=true
  },
  // ... 4 more free members
  {
    id: 'mentor',
    name: 'The Mentor',
    title: 'Career Development Guide',
    description: '...',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a wise mentor...',
    avatar: '🎓',
    availableWhenLimited: false,  // locked when LIMITED_FEATURES=true
  },
  // ... 4 more free members
  {
    id: 'mentor',
    name: 'The Mentor',
    title: 'Career Development Guide',
    description: '...',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a wise mentor...',
    avatar: '� guide icon',
    isPremium: true,
  },
  // ... 5 more premium members
]

export default members
```

### Feature Flag Logic

```typescript
// runtimeConfig in nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    limitedFeatures: process.env.LIMITED_FEATURES === 'true',
  }
})

// In components/pages:
const config = useRuntimeConfig()
const isLimited = config.limitedFeatures

// Locked member behavior:
const isLocked = (member: CouncilMember) => !member.availableWhenLimited && isLimited
```

---

## Pages

### `/` — Main Council Page

- Header with app name "Convene the Council" and "Deploy" nav link
- Grid of council member cards
- Clicking a card opens the chat interface for that member
- **Limited mode:** Members with `availableWhenLimited: false` show lock icon + "Deploy to unlock" button
- **Full mode:** All members work, no deploy buttons visible

### `/deploy` — Deployment Instructions Page

Header with back link to home.

Content sections:
1. **"Deploy to Netlify"** — Primary CTA button linking to Netlify deploy
2. **"What you'll need"**
   - OpenRouter API key (with link to get one)
   - Netlify account (free)
3. **"How it works"** — 3-step process:
   - Click the deploy button
   - Set `OPENROUTER_API_KEY` in Netlify environment variables
   - Your council is ready!
4. **"Self-hosting"** — Note that this app is open source and can be self-hosted with full features

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Required for API calls |
| `LIMITED_FEATURES` | `true` = lock premium members, show deploy buttons |

---

## Phase 2: Self-Hosted Council Customization

**Not in this implementation — deferred.**

For self-hosted users (no `LIMITED_FEATURES`), allow:
- Adding custom council members via UI
- Removing default members
- Editing member name, description, model, system prompt
- Persisted to localStorage

**UI additions:**
- "Edit Council" button in header (self-hosted only)
- Modal/drawer for member management
- Form with fields: name, title, description, model (dropdown), system prompt

---

## Spec Self-Review

- [x] Placeholder scan — no TBDs
- [x] Internal consistency — config-driven approach consistent throughout
- [x] Scope check — Phase 1 is scoped for Nuxt conversion + deploy page + feature flag
- [x] Ambiguity check — LIMITED_FEATURES behavior explicitly defined
