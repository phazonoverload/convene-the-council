<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-10">
      <h1 class="font-display text-3xl sm:text-4xl text-charcoal mb-3">Deploy your own council</h1>
      <p class="text-muted leading-relaxed">
        The hosted version is capped at a handful of requests a day and runs the six additional
        members in locked mode. Deploy your own copy and you get the full panel, your own rate
        limit, and full control over which models power each seat. No coding required, roughly
        ten minutes end to end.
      </p>
    </div>

    <!-- Step 1 -->
    <section class="bg-surface rounded-lg card-shadow border border-border p-6 mb-5">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center font-display text-lg font-semibold">1</div>
        <div class="flex-1">
          <h2 class="font-display text-xl text-charcoal mb-2">Get an OpenRouter API key</h2>
          <p class="text-muted text-sm leading-relaxed mb-3">
            OpenRouter is a single API that proxies to every major model provider. You pay per
            token used, typically a fraction of a cent per question. Create an account, top up
            a few dollars of credit (five goes a long way), and generate an API key.
          </p>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 text-sm text-burgundy hover:underline"
          >
            Open openrouter.ai/keys
            <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          </a>
          <p class="mt-3 text-xs text-muted">
            Keep the key somewhere safe, you will paste it into Netlify in step three.
          </p>
        </div>
      </div>
    </section>

    <!-- Step 2 -->
    <section class="bg-surface rounded-lg card-shadow border border-border p-6 mb-5">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center font-display text-lg font-semibold">2</div>
        <div class="flex-1">
          <h2 class="font-display text-xl text-charcoal mb-2">Click deploy</h2>
          <p class="text-muted text-sm leading-relaxed mb-4">
            This button forks the repo into your GitHub account and wires it up as a new
            Netlify project. If you do not have a Netlify account yet, the flow will create
            one for free.
          </p>
          <a
            href="https://app.netlify.com/start/deploy?repository=https://github.com/phazonoverload/convene-the-council"
            target="_blank"
            rel="noopener"
            class="inline-block"
          >
            <img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" />
          </a>
        </div>
      </div>
    </section>

    <!-- Step 3 -->
    <section class="bg-surface rounded-lg card-shadow border border-border p-6 mb-5">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center font-display text-lg font-semibold">3</div>
        <div class="flex-1">
          <h2 class="font-display text-xl text-charcoal mb-2">Paste your API key</h2>
          <p class="text-muted text-sm leading-relaxed mb-3">
            During the Netlify deploy flow you will be asked for environment variables. Add:
          </p>
          <div class="bg-parchment/60 rounded border border-border/60 p-3 mb-3 text-sm font-mono text-charcoal">
            OPENROUTER_API_KEY = <span class="text-muted">your key from step 1</span>
          </div>
          <p class="text-muted text-sm leading-relaxed">
            Hit deploy. Netlify will build the site (around a minute) and hand you back a URL
            ending in <code class="bg-parchment/60 px-1.5 py-0.5 rounded text-xs">netlify.app</code>.
            That URL is your own private council.
          </p>
        </div>
      </div>
    </section>

    <!-- Optional tweaks -->
    <section class="bg-surface rounded-lg card-shadow border border-border p-6 mb-5">
      <h2 class="font-display text-xl text-charcoal mb-4">Optional: tune it to taste</h2>
      <p class="text-muted text-sm leading-relaxed mb-4">
        Under <strong class="text-charcoal">Site configuration → Environment variables</strong>
        in Netlify you can add any of these. None are required, defaults are fine for most people.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left">
              <th class="py-2 pr-4 font-semibold text-charcoal">Variable</th>
              <th class="py-2 pr-4 font-semibold text-charcoal">Default</th>
              <th class="py-2 font-semibold text-charcoal">What it does</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr class="border-b border-border/50">
              <td class="py-2 pr-4 font-mono text-xs text-charcoal">OPENROUTER_API_KEY</td>
              <td class="py-2 pr-4 font-mono text-xs">(required)</td>
              <td class="py-2">Your key from openrouter.ai</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2 pr-4 font-mono text-xs text-charcoal">MAX_TOKENS_PER_MEMBER</td>
              <td class="py-2 pr-4 font-mono text-xs">200</td>
              <td class="py-2">Length cap for each council member's response.</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2 pr-4 font-mono text-xs text-charcoal">MAX_TOKENS_JUDGE</td>
              <td class="py-2 pr-4 font-mono text-xs">400</td>
              <td class="py-2">Length cap for the judge's synthesis.</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2 pr-4 font-mono text-xs text-charcoal">RATE_LIMIT</td>
              <td class="py-2 pr-4 font-mono text-xs">5</td>
              <td class="py-2">How many questions any single visitor can ask per window.</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2 pr-4 font-mono text-xs text-charcoal">RATE_LIMIT_WINDOW_MS</td>
              <td class="py-2 pr-4 font-mono text-xs">86400000</td>
              <td class="py-2">Rate limit window in milliseconds. Default is 24 hours.</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-xs text-charcoal">DISABLED_MEMBERS</td>
              <td class="py-2 pr-4 font-mono text-xs">(none)</td>
              <td class="py-2">
                Comma-separated member IDs to remove entirely. Hidden from the UI and never called, even on retry.
                <div class="mt-2 flex flex-wrap gap-1">
                  <code v-for="id in memberIds" :key="id" class="bg-parchment/60 px-1.5 py-0.5 rounded text-xs">{{ id }}</code>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="mt-4 text-sm text-muted leading-relaxed">
        Want different models? Edit <code class="bg-parchment/60 px-1.5 py-0.5 rounded text-xs">config/council.ts</code>
        in your fork, change the <code>model</code> field for any seat to any
        <a href="https://openrouter.ai/models" target="_blank" rel="noopener" class="text-burgundy hover:underline">OpenRouter model slug</a>,
        and push. Netlify will redeploy automatically.
      </p>
    </section>

    <!-- FAQ -->
    <section class="bg-parchment/60 rounded-lg border border-border p-6">
      <h2 class="font-display text-xl text-charcoal mb-4">Common questions</h2>
      <dl class="space-y-4 text-sm">
        <div>
          <dt class="font-semibold text-charcoal mb-1">How much will this cost?</dt>
          <dd class="text-muted leading-relaxed">Netlify is free for personal projects. OpenRouter charges per token; the current model lineup costs roughly $0.002–$0.01 per question.</dd>
        </div>
        <div>
          <dt class="font-semibold text-charcoal mb-1">Do I need to know how to code?</dt>
          <dd class="text-muted leading-relaxed">No. The three steps above are all click, paste, deploy. You only need to touch code if you want to swap models or prompts.</dd>
        </div>
        <div>
          <dt class="font-semibold text-charcoal mb-1">Is my data stored anywhere?</dt>
          <dd class="text-muted leading-relaxed">No. There is no database and no account system. Questions are sent to OpenRouter and discarded.</dd>
        </div>
        <div>
          <dt class="font-semibold text-charcoal mb-1">Can I run it locally instead?</dt>
          <dd class="text-muted leading-relaxed">
            Yes. Clone the repo, copy <code class="bg-surface px-1.5 py-0.5 rounded text-xs">.env.example</code>
            to <code class="bg-surface px-1.5 py-0.5 rounded text-xs">.env</code>, fill in your key, then
            <code class="bg-surface px-1.5 py-0.5 rounded text-xs">npm install &amp;&amp; npm run dev</code>.
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import council from '~/config/council'

definePageMeta({
  title: 'Deploy',
})

const memberIds = council.map(m => m.id)
</script>
