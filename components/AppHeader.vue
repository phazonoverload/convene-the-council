<template>
  <header class="bg-surface border-b-2 border-charcoal/10 shadow-sm">
    <div class="h-1 bg-gradient-to-r from-burgundy/40 via-burgundy to-burgundy/40"></div>
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3 text-charcoal hover:text-burgundy transition-colors group">
        <img src="/logo.svg" alt="Convene the Council" class="w-9 h-9 transition-transform group-hover:scale-110" />
        <span class="font-display text-2xl tracking-tight">Convene the Council</span>
      </NuxtLink>

      <NuxtLink
        v-if="limited"
        to="/deploy"
        class="text-muted hover:text-burgundy transition-colors text-sm font-medium px-3 py-1.5 rounded-md hover:bg-burgundy/5"
        :class="{ 'text-burgundy font-semibold bg-burgundy/5': route.path === '/deploy' }"
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
