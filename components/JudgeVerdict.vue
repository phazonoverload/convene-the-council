<template>
  <div class="mt-8">
    <div class="flex items-center gap-4 mb-4">
      <div class="flex-1 h-px bg-border"></div>
      <span class="font-display text-sm font-medium text-muted uppercase tracking-wider">Judge's Verdict</span>
      <div class="flex-1 h-px bg-border"></div>
    </div>

    <div
      :class="[
        'rounded-lg p-6 bg-surface card-shadow border border-border',
        isLoading ? '' : 'fade-in',
      ]"
    >
      <div v-if="isLoading" class="h-32">
        <div class="shimmer h-full rounded-md"></div>
      </div>

      <div v-else-if="error" class="text-center">
        <p class="text-error mb-3">{{ error }}</p>
        <button
          @click="$emit('retry')"
          class="text-sm px-4 py-2 border border-error text-error rounded hover:bg-error/10 transition-colors"
        >
          Retry Verdict
        </button>
      </div>

      <div v-else>
        <p class="text-charcoal leading-relaxed whitespace-pre-wrap">{{ verdict }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  verdict?: string | null
  isLoading?: boolean
  error?: string | null
}>()

defineEmits<{
  retry: []
}>()
</script>
