<template>
  <header class="bg-surface border-b-2 border-charcoal/10 shadow-sm">
    <div class="h-1 bg-gradient-to-r from-burgundy/40 via-burgundy to-burgundy/40"></div>
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2 sm:gap-3 text-charcoal hover:text-burgundy transition-colors group">
        <img src="/logo.svg" alt="Convene the Council" class="w-7 h-7 sm:w-9 sm:h-9 transition-transform group-hover:scale-110" />
        <span class="font-display text-lg sm:text-2xl tracking-tight whitespace-nowrap">Convene the Council</span>
      </NuxtLink>

      <NuxtLink
        v-if="limited"
        to="/deploy"
        class="text-muted hover:text-burgundy transition-colors text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 rounded-md hover:bg-burgundy/5 whitespace-nowrap"
        :class="{ 'text-burgundy font-semibold bg-burgundy/5': route.path === '/deploy' }"
      >
        <span class="hidden sm:inline">Deploy your own</span>
        <span class="sm:hidden">Deploy</span>
      </NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const { public: { limitedFeatures: limited } } = useRuntimeConfig()
</script>
