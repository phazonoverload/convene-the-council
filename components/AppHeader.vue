<template>
  <header class="bg-surface border-b border-border">
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3 text-charcoal hover:text-burgundy transition-colors">
        <img src="/logo.svg" alt="Convene the Council" class="w-7 h-7" />
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
