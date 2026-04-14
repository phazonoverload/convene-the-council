<template>
  <div>
    <!-- Question Input -->
    <div v-if="!hasResponded" class="bg-surface rounded-lg border border-border card-shadow overflow-hidden">
      <textarea
        ref="textareaRef"
        v-model="questionDraft"
        @keydown.ctrl.enter="submitQuestion"
        @keydown.meta.enter="submitQuestion"
        :disabled="isLoading"
        placeholder="Ask the council anything..."
        class="w-full px-4 pt-4 pb-2 bg-transparent text-charcoal placeholder-muted/60 resize-none focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed font-serif text-base leading-relaxed"
        rows="3"
      ></textarea>
      <div class="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-parchment/30">
        <p class="text-xs text-muted">Ctrl+Enter to submit</p>
        <button
          @click="submitQuestion"
          :disabled="isLoading || !questionDraft.trim()"
          class="px-5 py-2 bg-burgundy text-white rounded-md font-medium text-sm hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoading ? 'Consulting...' : 'Ask the council' }}
        </button>
      </div>
    </div>

    <!-- Active question display -->
    <div v-else class="mb-6 p-5 bg-surface rounded-lg border border-border card-shadow">
      <p class="text-xs uppercase tracking-wider text-muted mb-2">Your question</p>
      <p class="text-charcoal leading-relaxed whitespace-pre-wrap">{{ question }}</p>
    </div>

    <!-- Judge Verdict (shown as soon as members are done, regardless of member count) -->
    <JudgeVerdict
      v-if="showVerdict"
      :verdict="verdict"
      :is-loading="isLoading && !verdict && !verdictError"
      :error="verdictError"
      @retry="retryJudge"
    />

    <!-- Rate Limit Message -->
    <div v-if="rateLimited" class="mt-6 p-6 bg-surface border border-error rounded-lg text-center card-shadow">
      <p class="text-error font-medium mb-3">Rate limit reached. The council needs a moment to rest.</p>
      <p class="text-muted text-sm mb-4">Deploy your own instance to get higher limits and unlock additional council members.</p>
      <NuxtLink to="/deploy" class="inline-block px-6 py-2 bg-burgundy text-white rounded-lg hover:bg-burgundy/90 transition-colors">
        Deploy your own
      </NuxtLink>
    </div>

    <!-- Council Grid -->
    <div v-if="!rateLimited" class="mt-8 slide-down">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CouncilMemberCard
          v-for="member in visibleCouncilMembers"
          :key="member.id"
          :member="member"
          :state="getMemberState(member.id)"
          :response="responses[member.id]"
          :error="errors[member.id]"
          @retry="retryMember(member.id)"
        />

        <!-- Deploy CTA card (limited mode only) -->
        <NuxtLink
          v-if="limited"
          to="/deploy"
          class="rounded-lg p-5 border border-dashed border-border bg-surface/50 hover:bg-surface hover:card-shadow transition-all flex flex-col justify-center items-center text-center min-h-[200px]"
        >
          <svg class="w-8 h-8 text-burgundy mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <h3 class="font-display text-lg font-semibold text-charcoal mb-2">Deploy your own</h3>
          <p class="text-sm text-muted leading-relaxed">Change the underlying models, remove rate limits, and unlock additional members.</p>
        </NuxtLink>
      </div>

      <!-- Additional members (locked in limited mode, active otherwise) -->
      <div class="mt-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1 h-px bg-border"></div>
          <span class="font-display text-sm font-medium text-muted uppercase tracking-wider">Additional members</span>
          <div class="flex-1 h-px bg-border"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CouncilMemberCard
            v-for="member in visibleLockedMembers"
            :key="member.id"
            :member="member"
            :state="limited ? 'locked' : getMemberState(member.id)"
            :response="limited ? null : responses[member.id]"
            :error="limited ? null : errors[member.id]"
            @retry="limited ? undefined : retryMember(member.id)"
          />
        </div>
      </div>
    </div>

    <!-- Reset Link -->
    <div v-if="hasResponded && !isLoading" class="mt-8 text-center">
      <button @click="reset" class="text-burgundy hover:text-burgundy/80 underline underline-offset-4 text-sm">
        Ask another question
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { COUNCIL_MEMBERS, LOCKED_MEMBERS } from '~/config/council'

const { public: { limitedFeatures: limited, disabledMembers } } = useRuntimeConfig()

const visibleCouncilMembers = computed(() =>
  COUNCIL_MEMBERS.filter(m => !(disabledMembers as string[]).includes(m.id))
)
const visibleLockedMembers = computed(() =>
  LOCKED_MEMBERS.filter(m => !(disabledMembers as string[]).includes(m.id))
)
const activeMembers = computed(() =>
  limited
    ? visibleCouncilMembers.value
    : [...visibleCouncilMembers.value, ...visibleLockedMembers.value]
)

type MemberState = 'idle' | 'thinking' | 'responded' | 'error' | 'locked'

interface CouncilResponseItem {
  memberId: string
  name: string
  response: string | null
  error: string | null
}

interface CouncilApiResponse {
  question: string
  rounds: CouncilResponseItem[][]
  verdict: string
  remaining?: number
}

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const questionDraft = ref('')
const question = ref('')
const isLoading = ref(false)
const rateLimited = ref(false)
const responses = ref<Record<string, string>>({})
const errors = ref<Record<string, string>>({})
const lastMemberResponses = ref<CouncilResponseItem[]>([])
const verdict = ref('')
const verdictError = ref('')

const allMembersDone = computed(() => {
  return !!question.value && activeMembers.value.every(m => responses.value[m.id] || errors.value[m.id])
})

const showVerdict = computed(() => {
  return !!question.value && (allMembersDone.value || verdict.value || verdictError.value)
})

const hasResponded = computed(() => {
  return !!question.value && (isLoading.value || Object.keys(responses.value).length > 0 || Object.keys(errors.value).length > 0 || verdict.value.length > 0)
})

const getMemberState = (memberId: string): MemberState => {
  if (errors.value[memberId]) return 'error'
  if (responses.value[memberId]) return 'responded'
  if (isLoading.value && question.value) return 'thinking'
  return 'idle'
}

const applyResponse = (data: CouncilApiResponse) => {
  if (data.rounds?.length) {
    for (const round of data.rounds) {
      for (const item of round) {
        if (item.response) {
          responses.value[item.memberId] = item.response
          delete errors.value[item.memberId]
        } else if (item.error) {
          errors.value[item.memberId] = item.error
        }
      }
    }
    lastMemberResponses.value = data.rounds.flat()
  }
  if (data.verdict) {
    verdict.value = data.verdict
    verdictError.value = ''
  }
}

const submitQuestion = async () => {
  const q = questionDraft.value.trim()
  if (!q || isLoading.value) return

  question.value = q
  isLoading.value = true
  rateLimited.value = false
  responses.value = {}
  errors.value = {}
  verdict.value = ''
  verdictError.value = ''

  try {
    const data = await $fetch<CouncilApiResponse>('/api/council', {
      method: 'POST',
      body: { question: q },
    })
    applyResponse(data)
  } catch (err: any) {
    const status = err?.statusCode || err?.response?.status
    if (status === 429) {
      rateLimited.value = true
    } else {
      verdictError.value = 'Failed to get verdict. The council may be overwhelmed.'
      activeMembers.value.forEach((m) => {
        if (!responses.value[m.id]) {
          errors.value[m.id] = 'Request failed. Please try again.'
        }
      })
    }
  } finally {
    isLoading.value = false
  }
}

const retryMember = async (memberId: string) => {
  if (!question.value) return
  delete errors.value[memberId]
  isLoading.value = true

  try {
    const data = await $fetch<CouncilApiResponse>('/api/council', {
      method: 'POST',
      body: { question: question.value, memberIds: [memberId] },
    })
    applyResponse(data)
    if (!responses.value[memberId]) {
      errors.value[memberId] = 'No response received'
    }
  } catch (err: any) {
    errors.value[memberId] = 'Retry failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const retryJudge = async () => {
  if (!question.value) return
  verdictError.value = ''
  isLoading.value = true

  try {
    const previousResponses = activeMembers.value.map((m) => ({
      memberId: m.id,
      name: m.name,
      response: responses.value[m.id] || null,
      error: errors.value[m.id] || null,
    }))
    const data = await $fetch<{ verdict: string }>('/api/council', {
      method: 'POST',
      body: { question: question.value, judgeOnly: true, previousResponses },
    })
    if (data.verdict) {
      verdict.value = data.verdict
    } else {
      verdictError.value = 'No verdict received'
    }
  } catch (err: any) {
    verdictError.value = 'Retry failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  questionDraft.value = ''
  question.value = ''
  isLoading.value = false
  responses.value = {}
  errors.value = {}
  verdict.value = ''
  verdictError.value = ''
  rateLimited.value = false
  nextTick(() => textareaRef.value?.focus())
}

onMounted(() => {
  textareaRef.value?.focus()
})
</script>
