<template>
  <header class="bg-surface border-b border-border">
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-xl text-charcoal hover:text-burgundy transition-colors">
        Convene the Council
      </NuxtLink>
      
      <div class="flex items-center gap-6">
        <NuxtLink 
          to="/" 
          class="text-muted hover:text-charcoal transition-colors"
          :class="{ 'text-burgundy font-semibold': route.path === '/' }"
        >
          Council
        </NuxtLink>
        <NuxtLink 
          to="/deploy" 
          class="text-muted hover:text-charcoal transition-colors"
          :class="{ 'text-burgundy font-semibold': route.path === '/deploy' }"
        >
          Deploy
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
