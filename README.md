# Personal Council

A web app that lets you pose questions to a panel of AI advisors and receive a synthesized recommendation.

## Quick Start

### Try the Hosted Version

Visit [personalcouncil.app](https://personalcouncil.app) to use the public deployment.

### Deploy Your Own

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/convene-the-council)

1. Click the deploy button above
2. During setup, enter your OpenRouter API key as an environment variable `OPENROUTER_API_KEY`
3. Deploy

That's it. Your personal council is ready.

## What You Get with Self-Hosting

- **No rate limits** — Beyond the OpenRouter API constraints you set
- **Access to premium council members** — The Mentor, Contrarian Genius, and Therapist (currently locked on the hosted version)
- **Your own API costs** — Pay OpenRouter directly for what you use

## Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local development server
netlify dev

# Open in browser
open http://localhost:8888
```

## Architecture

- **Frontend**: Vue 3 + Tailwind CSS (loaded via CDN, no build step required)
- **Backend**: Netlify Function that fans out requests to OpenRouter for each council member
- **Storage**: None — no database, no authentication, no persistence

The entire app is a single `index.html` file that can be hosted anywhere.

## Council Members

| Member | Model | Role |
|--------|-------|------|
| The Pragmatist | deepseek/deepseek-v3.2 | Cuts to what's actually executable |
| The Skeptic | mistralai/mistral-large | Finds the fatal flaw |
| The Optimist | mistralai/mistral-small-3.1 | Argues the best-case path |
| The Devil's Advocate | google/gemini-2.0-flash | Defends the contrarian position |
| The Risk Manager | allenai/olmo-3.1-32b-think | Maps probability and severity |
| **The Judge** | anthropic/claude-sonnet-4-6 | Synthesizes the final verdict |

## Self-Hosting

The app is a single HTML file (`index.html`). You can host it on:

- **Netlify** (recommended) — Drag and drop deployment
- **Vercel** — Zero-config hosting
- **GitHub Pages** — Free static hosting
- **Any web server** — Just serve the HTML file

No build step, no dependencies to install, no database to configure.
