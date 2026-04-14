<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h1 class="font-display text-3xl text-charcoal mb-2">Deploy Your Own Council</h1>
      <p class="text-muted">Run your own instance with all council members unlocked.</p>
    </div>

    <div class="bg-surface rounded-lg border border-border p-6 mb-6">
      <h2 class="font-display text-xl text-charcoal mb-4">Deploy to Netlify</h2>
      <p class="text-muted mb-4">
        One-click deployment to get your own instance running in minutes.
      </p>
      <DeployButton variant="large">
        Deploy to Netlify
      </DeployButton>
    </div>

    <div class="bg-surface rounded-lg border border-border p-6 mb-6">
      <h2 class="font-display text-xl text-charcoal mb-4">What you'll need</h2>
      <ul class="space-y-3 text-muted">
        <li class="flex items-start gap-3">
          <span class="text-burgundy">1.</span>
          <div>
            <strong class="text-charcoal">OpenRouter API Key</strong>
            <p class="text-sm">Required for AI responses. Get one at <a href="https://openrouter.ai" target="_blank" class="text-burgundy hover:underline">openrouter.ai</a></p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy">2.</span>
          <div>
            <strong class="text-charcoal">Netlify Account</strong>
            <p class="text-sm">Free account at <a href="https://netlify.com" target="_blank" class="text-burgundy hover:underline">netlify.com</a></p>
          </div>
        </li>
      </ul>
    </div>

    <div class="bg-surface rounded-lg border border-border p-6 mb-6">
      <h2 class="font-display text-xl text-charcoal mb-4">How it works</h2>
      <ol class="space-y-4 text-muted">
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">1.</span>
          <p>Click the deploy button above</p>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">2.</span>
          <p>Connect your GitHub repository</p>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">3.</span>
          <p>Add your <code class="bg-parchment px-2 py-0.5 rounded text-sm">OPENROUTER_API_KEY</code> to Netlify environment variables</p>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">4.</span>
          <p>Your council is ready! All premium members are unlocked.</p>
        </li>
      </ol>
    </div>

    <div class="bg-parchment rounded-lg border border-border p-6">
      <h2 class="font-display text-xl text-charcoal mb-2">Self-Hosting</h2>
      <p class="text-muted text-sm">
        This app is open source and can be self-hosted on any platform. When self-hosting, 
        set <code class="bg-surface px-2 py-0.5 rounded text-sm">LIMITED_FEATURES=false</code> 
        (or leave it unset) to unlock all council members. No deploy buttons will appear.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Deploy'
})
</script>
