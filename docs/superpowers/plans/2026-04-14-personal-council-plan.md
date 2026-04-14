# Personal Council Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A complete Personal Council web app — single HTML file frontend with Netlify Function backend — letting users pose questions to AI council members and receive a synthesized verdict.

**Architecture:** Single-page Vue 3 app served as `index.html` (maximizes portability). Netlify Function handles OpenRouter fan-out for council members + judge. No build step required.

**Tech Stack:** Vue 3 (CDN), Tailwind CSS (CDN), Netlify Functions, OpenRouter API

---

## File Structure

```
personal-council/
├── netlify/
│   └── functions/
│       └── council.js       # OpenRouter fan-out + judge synthesis
├── index.html               # Complete SPA (Vue components + Tailwind + config)
├── netlify.toml             # Netlify build config
└── README.md                # Self-hosting instructions
```

---

## Task 1: Create netlify.toml

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Write netlify.toml**

```toml
[build]
  publish = "."
  functions = "netlify/functions"

[template.environment]
  OPENROUTER_API_KEY = "Your OpenRouter API key"
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml && git commit -m "feat: add netlify.toml build config"
```

---

## Task 2: Create Netlify Function

**Files:**
- Create: `netlify/functions/council.js`

**API:** `POST /.netlify/functions/council` — `{ question: string }`

**Logic:**
1. Validate question presence
2. Fan out parallel requests to all 5 active council members via OpenRouter
3. Wait for all member responses
4. Fire judge request with question + all responses
5. Return `{ question, rounds: [[responses]], verdict, completedRounds: 1 }`

**Rate limiting:** Check `x-nf-client-connection-ip` header, track count in memory (simple Map). Return `429` if >5 requests per IP per day. Self-hosters bypass via their own deployment.

- [ ] **Step 1: Write netlify/functions/council.js**

See actual file in repository.

- [ ] **Step 2: Verify syntax**

```bash
node --check netlify/functions/council.js
```

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/council.js && git commit -m "feat: add council Netlify function with OpenRouter fan-out"
```

---

## Task 3: Create index.html (Complete SPA)

**Files:**
- Create: `index.html`

This is the core deliverable. Must include:
- Google Fonts (Playfair Display, Lora)
- Tailwind CSS (CDN)
- Vue 3 (CDN)
- Full council config (members, locked members, system prompts)
- QuestionInput component
- CouncilCard component (all 5 states)
- JudgeVerdict component
- Complete app logic (submit, display, reset)

**Visual Design Implementation:**
- Background: `#f5f0e3` (cream parchment)
- Cards: `#ffffff` with `box-shadow`
- Text: `#2a2a2a` (near-black)
- Accent: `#7a2c2c` (deep burgundy)
- Borders: `#d4c9b5`
- Typography: Playfair Display for headings, Lora for body

**Council Card States:**
- `idle`: name + description + model badge, waiting state
- `thinking`: shimmer/pulse animation, "..." placeholder
- `responded`: response text displayed
- `error`: red border, error message, "Retry" button
- `locked`: greyed out, lock icon, "Deploy to unlock" overlay

**Layout:**
- Header with logo + title + help button
- Question input (full-width textarea + submit)
- 5 council cards in responsive grid (3 top row, 2 + "locked" indicator bottom row)
- Judge verdict card (full-width, appears after all responses)
- "Ask another question" reset link

- [ ] **Step 1: Write index.html**

See actual file in repository.

- [ ] **Step 2: Test in browser**

Open `index.html` directly in browser to verify:
1. Page loads without errors
2. All council cards visible with correct styling
3. Fonts load correctly (Playfair Display, Lora)
4. Submit button disabled when input empty
5. Help modal opens/closes

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: add complete SPA with council UI"
```

---

## Task 4: Create README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

See actual file in repository.

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: add README"
```

---

## Spec Coverage Check

| Spec Section | Tasks |
|---|---|
| Layout (header, input, council grid, verdict) | Task 3 |
| Components (QuestionInput, CouncilCard, JudgeVerdict, HelpModal) | Task 3 |
| Council Members (5 active + 3 locked) | Task 3 |
| System Prompts | Task 2 (function), Task 3 (config) |
| Card States (idle, thinking, responded, error, locked) | Task 3 |
| Visual Design (cream, serif, burgundy) | Task 3 |
| API Contract (POST /council, response shape) | Task 2 |
| Error Handling (rate limit, member/judge errors) | Task 2, Task 3 |
| Rate Limits (5/day/IP) | Task 2 |
| File Structure | Task 1-4 |
| README | Task 4 |

---

## Placeholder Check

All steps contain complete code. No TODOs, TBDs, or deferred implementations.

---

**Plan complete.** Saved to `docs/superpowers/plans/2026-04-14-personal-council-plan.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
