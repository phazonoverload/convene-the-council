<template>
<div
  :class="[
    'relative rounded-xl pt-5 px-5 pb-3 bg-surface card-shadow border-2 border-charcoal/5 transition-all duration-300 scale-in',
    state === 'error' ? 'border-error ring-2 ring-error/20' : '',
    state === 'responded' ? 'border-burgundy/30' : '',
    state === 'locked' ? 'opacity-50' : '',
    state !== 'locked' && state !== 'error' ? 'hover:border-burgundy/50 hover:shadow-xl hover:-translate-y-1' : '',
  ]"
>
    <div class="flex items-start gap-3 mb-3">
      <div
        :class="[
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm',
          iconMeta.bg,
        ]"
      >
        <component :is="iconMeta.component" :class="['w-6 h-6', iconMeta.color]" />
      </div>
      <div class="flex-1 min-w-0 pt-1">
        <div class="flex items-center gap-2">
          <h3 class="font-display text-lg font-semibold text-charcoal leading-tight">{{ member.name }}</h3>
          <LockClosedIcon v-if="state === 'locked'" class="w-4 h-4 text-muted flex-shrink-0" />
          <CheckCircleIcon v-else-if="state === 'responded'" class="w-4 h-4 text-burgundy/70 flex-shrink-0" />
        </div>
        <p class="text-xs text-muted/80 mt-0.5 leading-snug">{{ member.description }}</p>
      </div>
    </div>

    <div v-if="state === 'idle'" class="hidden sm:flex items-center justify-center h-36 border-t border-border/50 pt-4">
      <p class="text-sm text-muted/70 italic">The council awaits your query...</p>
    </div>

    <div v-else-if="state === 'locked'" class="flex items-center justify-center h-36 border-t border-border/50 pt-4">
      <p class="text-sm text-muted/70 italic">Deploy to unlock</p>
    </div>

    <div v-else-if="state === 'thinking'" class="border-t border-border/50 pt-4">
      <p class="sm:hidden text-sm text-muted/70 italic py-2">This member is thinking…</p>
      <div class="hidden sm:block h-32 shimmer rounded-md"></div>
    </div>

    <div v-else-if="state === 'responded'" class="border-t border-border/50 pt-4">
      <div class="sm:hidden">
        <div v-if="!showResponse">
          <button
            @click="showResponse = true"
            class="text-xs px-3 py-1.5 border border-burgundy/40 text-burgundy rounded hover:bg-burgundy/10 transition-colors"
          >
            View response
          </button>
        </div>
        <div v-else>
          <p class="text-sm text-charcoal leading-relaxed whitespace-pre-wrap mb-2">{{ response }}</p>
          <button
            @click="showResponse = false"
            class="text-xs text-muted/70 hover:text-muted transition-colors underline"
          >
            Hide
          </button>
        </div>
      </div>
      <div class="hidden sm:block h-36 overflow-y-auto pr-1">
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
  CheckCircleIcon,
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
const showResponse = ref(false)
</script>
