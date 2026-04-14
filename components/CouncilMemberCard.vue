<template>
  <div 
    class="bg-surface rounded-lg border border-border p-5 flex flex-col gap-3 cursor-pointer hover:border-burgundy/50 transition-colors"
    :class="{ 'opacity-75': isLocked }"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <component :is="avatarIcon" class="w-8 h-8 text-burgundy" />
        <div>
          <h3 class="font-display font-semibold text-charcoal">{{ member.name }}</h3>
          <p class="text-sm text-muted">{{ member.title }}</p>
        </div>
      </div>
      <LockClosedIcon v-if="isLocked" class="w-5 h-5 text-muted" />
    </div>
    
    <p class="text-muted text-sm leading-relaxed">{{ member.description }}</p>
    
    <div v-if="isLocked" class="mt-auto pt-2">
      <DeployButton>Deploy to unlock</DeployButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CouncilMember } from '~/config/council'
import {
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  LightBulbIcon,
  HeartIcon,
  BookOpenIcon,
  BeakerIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  member: CouncilMember
  isLocked: boolean
}>()

const iconMap: Record<string, any> = {
  'wrench-screwdriver': WrenchScrewdriverIcon,
  'question-mark-circle': QuestionMarkCircleIcon,
  'sun': SunIcon,
  'scale': ScaleIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'academic-cap': AcademicCapIcon,
  'light-bulb': LightBulbIcon,
  'heart': HeartIcon,
  'book-open': BookOpenIcon,
  'beaker': BeakerIcon,
  'shield-check': ShieldCheckIcon,
}

const avatarIcon = computed(() => iconMap[props.member.avatar] || QuestionMarkCircleIcon)
</script>
