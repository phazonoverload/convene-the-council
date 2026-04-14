<template>
  <div 
    class="bg-surface rounded-lg border border-border p-5 flex flex-col gap-3 cursor-pointer hover:border-burgundy/50 transition-colors"
    :class="{ 'opacity-75': isLocked }"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <span class="text-3xl">{{ member.avatar }}</span>
        <div>
          <h3 class="font-display font-semibold text-charcoal">{{ member.name }}</h3>
          <p class="text-sm text-muted">{{ member.title }}</p>
        </div>
      </div>
      <span v-if="isLocked" class="text-lg">🔒</span>
    </div>
    
    <p class="text-muted text-sm leading-relaxed">{{ member.description }}</p>
    
    <div v-if="isLocked" class="mt-auto pt-2">
      <DeployButton>Deploy to unlock</DeployButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CouncilMember } from '~/config/council'

const props = defineProps<{
  member: CouncilMember
  isLocked: boolean
}>()
</script>
