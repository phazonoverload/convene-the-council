<template>
  <div
    :class="[
      'relative rounded-lg pt-5 px-5 pb-3 bg-surface card-shadow border border-border transition-all',
      state === 'error' ? 'border-error ring-1 ring-error/30' : '',
      state === 'responded' ? 'fade-in' : '',
      state === 'locked' ? 'opacity-60' : '',
    ]"
  >
    <div class="flex items-start gap-3 mb-3">
      <div
        :class="[
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          iconMeta.bg,
        ]"
      >
        <component :is="iconMeta.component" :class="['w-5 h-5', iconMeta.color]" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-display text-lg font-semibold text-charcoal leading-tight">{{ member.name }}</h3>
          <LockClosedIcon v-if="state === 'locked'" class="w-4 h-4 text-muted flex-shrink-0" />
        </div>
        <p class="text-xs text-muted mt-1 leading-snug">{{ member.description }}</p>
      </div>
    </div>

    <div v-if="state === 'idle'" class="flex items-center justify-center h-36 border-t border-border/50 pt-4">
      <p class="text-sm text-muted/60 italic">Awaiting your question...</p>
    </div>

    <div v-else-if="state === 'locked'" class="flex items-center justify-center h-36 border-t border-border/50 pt-4">
      <p class="text-sm text-muted/70 italic">Deploy to unlock</p>
    </div>

    <div v-else-if="state === 'thinking'" class="h-36 border-t border-border/50 pt-4">
      <div class="shimmer h-full rounded-md"></div>
    </div>

    <div v-else-if="state === 'responded'" class="border-t border-border/50 pt-4">
      <div class="h-36 overflow-y-auto pr-1">
        <p class="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{{ response }}</p>
      </div>
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

    <div class="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5">
      <img
        v-if="!logoFailed"
        :src="logoUrl"
        :alt="member.logo"
        class="w-6 h-6 flex-shrink-0 opacity-80"
        @error="logoFailed = true"
      />
      <CpuChipIcon v-else class="w-6 h-6 text-muted/70 flex-shrink-0" />
      <p class="text-[11px] text-muted/80 truncate" :title="member.model">{{ prettyModel }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  UserCircleIcon,
  CpuChipIcon,
} from '@heroicons/vue/24/outline'
import type { CouncilMember } from '~/config/council'

const props = defineProps<{
  member: CouncilMember
  state: 'idle' | 'thinking' | 'responded' | 'error' | 'locked'
  response?: string | null
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const ICON_MAP: Record<string, { component: any; color: string; bg: string }> = {
  pragmatist: { component: WrenchScrewdriverIcon, color: 'text-slate-700', bg: 'bg-slate-100' },
  skeptic:    { component: QuestionMarkCircleIcon, color: 'text-amber-700', bg: 'bg-amber-100' },
  optimist:   { component: SunIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  devil:      { component: ScaleIcon, color: 'text-purple-700', bg: 'bg-purple-100' },
  risk:       { component: ExclamationTriangleIcon, color: 'text-red-700', bg: 'bg-red-100' },
  mentor:     { component: AcademicCapIcon, color: 'text-indigo-700', bg: 'bg-indigo-100' },
  genius:     { component: LightBulbIcon, color: 'text-amber-600', bg: 'bg-amber-100' },
  therapist:  { component: HeartIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
  historian:  { component: BookOpenIcon, color: 'text-stone-700', bg: 'bg-stone-100' },
  inventor:   { component: BeakerIcon, color: 'text-teal-700', bg: 'bg-teal-100' },
  guardian:   { component: ShieldCheckIcon, color: 'text-emerald-700', bg: 'bg-emerald-100' },
}

const iconMeta = computed(() => ICON_MAP[props.member.id] ?? { component: UserCircleIcon, color: 'text-muted', bg: 'bg-locked' })

const prettyModel = computed(() => props.member.label)
const logoUrl = computed(() => `https://models.dev/logos/${props.member.logo}.svg`)
const logoFailed = ref(false)
</script>
