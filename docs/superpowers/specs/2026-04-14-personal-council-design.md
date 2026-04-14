# Personal Council — Product Design

**Date**: 2026-04-14
**Status**: Approved

---

## Overview

Personal Council is a web app that lets users pose a question to a panel of AI advisors, each with a distinct persona and model via OpenRouter. The judge model synthesizes all responses into a recommendation.

---

## Stack

- **Frontend**: Single HTML file — Vue 3 via CDN, Tailwind CSS via CDN
- **Backend**: Netlify Function (`council.js`)
- **API**: OpenRouter (OpenAI-compatible)
- **No auth, no database, no persistence** in v1

---

## Visual Design

**Aesthetic**: Clean courtroom / council chamber — cream parchment background, deep charcoal text, dark wood or burgundy accents. Feels like a formal proceeding, not a casual chat.

**Colors**:
- Background: `#f5f0e3` (warm cream/parchment)
- Card surface: `#ffffff` with subtle shadow
- Text primary: `#2a2a2a` (near-black)
- Text secondary: `#6b6b6b`
- Accent: `#7a2c2c` (deep burgundy) or `#3d2b1f` (dark walnut)
- Border/divider: `#d4c9b5`
- Error: `#b33a3a`
- Locked/disabled: `#e8e4dc`

**Typography**:
- Headings: `Playfair Display` or `Merriweather` (serif)
- Body: `Source Serif Pro` or `Lora` (readable serif)
- Monospace fallback for model badges: `JetBrains Mono` or `Courier New`

---

## Layout

```
┌─────────────────────────────────────────┐
│  [Logo]  Personal Council       [? Help] │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  Ask the council...              │    │
│  │                                  │    │
│  │                       [Submit]  │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Pragmatist│ │ Skeptic │ │ Optimist│   │
│  │ • deepseek│ │ • mistral│ │ • mistral│  │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐               │
│  │ Devil's  │ │ Risk    │  [+3 locked] │
│  │ Advocate │ │ Manager │               │
│  └─────────┘ └─────────┘               │
│                                          │
│  ─────────────── Judge ─────────────── │
│  │ [Verdict — full width]            │   │
└─────────────────────────────────────────┘
```

---

## Components

### QuestionInput
- Full-width textarea
- Placeholder: "Ask the council anything..."
- Submit button disabled when empty
- Disabled during loading state

### CouncilCard
**Props**: `member` (id, name, description, model, tier, locked, systemPrompt)

**States**:
- `idle` — visible, waiting for question
- `thinking` — shimmer animation, "..." response placeholder
- `responded` — shows response text
- `error` — red border, error message, "Retry" button
- `locked` — greyed out, lock icon, "Deploy to unlock" CTA overlay

### JudgeVerdict
- Full-width card, appears below council grid
- Only visible after all council members respond
- Fade-in animation
- Contains synthesis text with dissenting view preserved

### HelpModal (stretch)
- Triggered by `?` button
- Explains the concept and council member roles

---

## Council Members

### Active (free tier)

| ID | Name | Model | Description |
|---|---|---|---|
| pragmatist | The Pragmatist | deepseek/deepseek-v3.2 | Cuts to what's actually executable. Allergic to theory. |
| skeptic | The Skeptic | mistralai/mistral-large | Assumes there's a fatal flaw and looks for it. |
| optimist | The Optimist | mistralai/mistral-small-3.1 | Finds the best-case path and argues for it. |
| devil | The Devil's Advocate | google/gemini-2.0-flash | Takes the least popular position and defends it properly. |
| risk | The Risk Manager | allenai/olmo-3.1-32b-think | Maps what could go wrong, probability and severity only. |

### Judge (synthesis, not shown as card)
- Model: `anthropic/claude-sonnet-4-6`
- Receives question + all member responses
- Returns verdict with strongest dissenting view preserved

### Locked (premium, shown greyed)

| Name | Model | Reason |
|---|---|---|
| The Mentor | openai/gpt-5.4 | Premium model cost |
| The Contrarian Genius | google/gemini-3.1-pro-preview | Large context, premium cost |
| The Therapist | anthropic/claude-sonnet-4-6 | Different system prompt, polarizing persona |

---

## System Prompts

Each member's system prompt is defined in `src/config/council.js` (see original spec for exact text).

Key constraints applied to all responses:
- 4-6 sentences
- No bullet points
- No headers
- Plain direct prose

Judge: 180-220 words, same plain prose rules.

---

## API Contract

### Request
```json
POST /.netlify/functions/council
{
  "question": "string"
}
```

### Response
```json
{
  "question": "string",
  "rounds": [
    [
      {
        "memberId": "string",
        "round": 1,
        "response": "string",
        "model": "string",
        "tokensUsed": 0
      }
    ]
  ],
  "verdict": "string",
  "completedRounds": 1
}
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Member request fails | Card enters `error` state with retry button; judge runs with available responses |
| Judge request fails | Verdict card shows error with retry |
| Network error | Toast notification + retry option |
| Rate limited (5/day/IP) | Full-page message with Deploy CTA |

---

## Interaction Flow

1. Page load → council cards in idle state, question input auto-focused
2. User submits → input disabled, all active cards enter `thinking` simultaneously
3. Responses appear as they resolve (non-deterministic order)
4. All resolved → judge verdict fades in below
5. "Ask another question" link resets to initial state

---

## File Structure

```
personal-council/
├── netlify/
│   └── functions/
│       └── council.js
├── src/
│   ├── config/
│   │   └── council.js
│   └── app.js              # Vue app initialization
├── index.html              # Complete SPA
├── netlify.toml
└── README.md
```

**Note**: v1 ships as a single `index.html` containing all Vue components, Tailwind, and config inline. This maximizes portability for self-hosting.

---

## Rate Limits (Hosted)

- IP-based: 5 sessions per IP per day
- OpenRouter monthly hard cap: $20

Self-hosters bypass both limits.

---

## V2 Notes (Out of Scope)

- `SESSION_CONFIG.rounds = 2`
- Round 2 receives previous round context so members can respond to each other
