<template>
  <div
    :class="[
      'relative rounded-lg p-5 transition-all',
      state === 'locked' ? 'bg-locked border border-border/50 opacity-60' : 'bg-surface card-shadow border border-border',
      state === 'error' ? 'border-error ring-1 ring-error/30' : '',
      state === 'responded' ? 'fade-in' : '',
    ]"
  >
    <div v-if="state === 'locked'" class="absolute inset-0 bg-locked/80 rounded-lg flex flex-col items-center justify-center z-10">
      <svg class="w-8 h-8 text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
      <p class="text-sm text-muted font-medium">Deploy to unlock</p>
    </div>

    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-display text-lg font-semibold text-charcoal">{{ member.name }}</h3>
        <p class="text-xs text-muted mt-0.5">{{ member.description }}</p>
      </div>
      <span v-if="member.tier === 'premium'" class="text-xs px-2 py-0.5 bg-burgundy/10 text-burgundy rounded">Premium</span>
    </div>

    <div v-if="state === 'idle'" class="flex items-center justify-center h-24 border-t border-border/50 pt-4">
      <p class="text-sm text-muted/60 italic">Awaiting your question...</p>
    </div>

    <div v-else-if="state === 'thinking'" class="h-32 border-t border-border/50 pt-4">
      <div class="shimmer h-full rounded-md"></div>
    </div>

    <div v-else-if="state === 'responded'" class="border-t border-border/50 pt-4">
      <p class="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{{ response }}</p>
    </div>

    <div v-else-if="state === 'error'" class="border-t border-error/30 pt-4">
      <p class="text-sm text-error mb-3">{{ error }}</p>
      <button
        @click="$emit('retry')"
        class="text-xs px-3 py-1.5 border border-error text-error rounded hover:bg-error/10 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CouncilMember } from '~/config/council'

defineProps<{
  member: CouncilMember
  state: 'idle' | 'thinking' | 'responded' | 'error' | 'locked'
  response?: string | null
  error?: string | null
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.card-shadow {
  box-shadow: 0 2px 8px rgba(42, 42, 42, 0.08), 0 1px 2px rgba(42, 42, 42, 0.04);
}
.shimmer {
  background: linear-gradient(90deg, #e8e4dc 25%, #f5f0e3 50%, #e8e4dc 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.fade-in {
  animation: fadeIn 0.6s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>