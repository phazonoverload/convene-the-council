<template>
  <header class="bg-surface border-b border-border">
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3 text-charcoal hover:text-burgundy transition-colors">
        <svg class="w-7 h-7 text-burgundy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span class="font-display text-xl">Convene the Council</span>
      </NuxtLink>

      <NuxtLink
        v-if="limited"
        to="/deploy"
        class="text-muted hover:text-charcoal transition-colors text-sm"
        :class="{ 'text-burgundy font-semibold': route.path === '/deploy' }"
      >
        Deploy your own
      </NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const { public: { limitedFeatures: limited } } = useRuntimeConfig()
</script>
