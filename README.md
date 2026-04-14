# Convene the Council

A small web app for putting a question to a panel of AI advisors with different sensibilities and getting back a synthesized recommendation. Five advisors respond in parallel, a judge model synthesizes their answers.

A tool by [Kevin Lewis](https://lws.io).

## Try it

Hosted version: [convene-the-council.netlify.app](https://convene-the-council.netlify.app). Capped to a few questions per day per visitor and only runs the five free seats.

## Deploy your own

The fastest path is the deploy page in the app itself, which walks you through it in three clicks. If you'd rather do it from here:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/phazonoverload/convene-the-council)

1. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys) and top up a few dollars of credit.
2. Click the button above. Netlify will fork the repo into your GitHub account.
3. During the deploy flow, set `OPENROUTER_API_KEY` to your key.
4. Done. Your copy gets all eleven members and your own rate limit.

## Run locally

```bash
git clone https://github.com/phazonoverload/convene-the-council
cd convene-the-council
cp .env.example .env          # fill in OPENROUTER_API_KEY
npm install
npm run dev                   # http://localhost:3000
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | *required* | Your key from [openrouter.ai](https://openrouter.ai/keys). |
| `LIMITED_FEATURES` | `false` | Set to `true` to lock the six bonus seats (this is how the public hosted version is configured). Leave unset for the full panel. |
| `MAX_TOKENS_PER_MEMBER` | `200` | Length cap on each council member's reply. |
| `MAX_TOKENS_JUDGE` | `400` | Length cap on the judge's synthesis. |
| `RATE_LIMIT` | `5` | Requests per window per IP. |
| `RATE_LIMIT_WINDOW_MS` | `86400000` | Rate-limit window in milliseconds. Default is 24 hours. |

Set these in Netlify under **Site configuration → Environment variables** (or in your local `.env` for development).

## Council members

Each seat is powered by an [OpenRouter](https://openrouter.ai/models) model slug. To swap any seat, edit the `model` field for that member in `config/council.ts` and redeploy.

**Free panel** — five advisors plus a judge, always available

| Seat | Role |
|---|---|
| The Pragmatist | Cuts to what's executable |
| The Skeptic | Finds the fatal flaw |
| The Optimist | Argues the best-case path |
| The Devil's Advocate | Defends the contrarian view |
| The Risk Manager | Probability and severity only |
| **The Judge** | Synthesizes the verdict |

**Bonus seats** (active when `LIMITED_FEATURES` is unset or `false`)

| Seat | Role |
|---|---|
| The Mentor | Career and leadership counsel |
| The Genius | Polymath, breakthrough thinking |
| The Therapist | Emotional and relational angle |
| The Historian | Pattern matching from the past |
| The Inventor | Novel systems and designs |
| The Guardian | Principled, long-horizon reasoning |

## Stack

- [Nuxt 3](https://nuxt.com) with Nitro running on Netlify Functions
- [Tailwind CSS](https://tailwindcss.com) with a custom parchment palette
- [Heroicons](https://heroicons.com) for the seat icons
- [OpenRouter](https://openrouter.ai) as the single proxy to every model

No database, no auth, no state beyond the in-memory rate limiter.

## License

MIT.
