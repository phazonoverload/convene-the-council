<template>
  <div>
    <!-- Question Input -->
    <div v-if="!hasResponded" class="bg-surface rounded-lg border-2 border-charcoal/10 shadow-lg overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-burgundy/60 via-burgundy to-burgundy/60"></div>
      <textarea
        ref="textareaRef"
        v-model="questionDraft"
        @keydown.ctrl.enter="submitQuestion"
        @keydown.meta.enter="submitQuestion"
        :disabled="isLoading"
        placeholder="Ask the council anything..."
        class="w-full px-5 pt-5 pb-3 bg-transparent text-charcoal placeholder-muted/50 resize-none outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed font-serif text-lg leading-relaxed"
        rows="4"
      ></textarea>
      <div class="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-parchment/30">
        <p class="text-xs text-muted">Ctrl+Enter to submit</p>
        <button
          @click="submitQuestion"
          :disabled="isLoading || !questionDraft.trim()"
          class="px-5 py-2 bg-burgundy text-white rounded-md font-medium text-sm hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 focus-visible:ring-offset-2"
        >
          {{ isLoading ? 'Seeking wisdom...' : 'Ask the council' }}
        </button>
      </div>
    </div>

    <!-- Active question display -->
    <div v-else class="mb-6 p-5 bg-surface rounded-lg border border-border card-shadow">
      <p class="text-xs uppercase tracking-wider text-muted mb-2">Your question</p>
      <p class="text-charcoal leading-relaxed whitespace-pre-wrap">{{ activeRound?.question }}</p>
    </div>

    <!-- Judge Verdict (shown as soon as members are done, regardless of member count) -->
    <JudgeVerdict
      v-if="showVerdict"
      :verdict="activeRound?.verdict ?? ''"
      :is-loading="isLoading && !activeRound?.verdict && !activeRound?.verdictError"
      :error="activeRound?.verdictError ?? ''"
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
      <!-- Self-hosted: all members in one unified grid -->
      <template v-if="!limited">
        <div class="grid council-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CouncilMemberCard
            v-for="member in visibleCouncilMembers"
            :key="member.id"
            :member="member"
            :state="getMemberState(member.id, activeRound)"
            :response="activeRound?.memberResponses[member.id]"
            :error="activeRound?.memberErrors[member.id]"
            @retry="retryMember(member.id)"
          />
          <CouncilMemberCard
            v-for="member in visibleLockedMembers"
            :key="member.id"
            :member="member"
            :state="getMemberState(member.id, activeRound)"
            :response="activeRound?.memberResponses[member.id]"
            :error="activeRound?.memberErrors[member.id]"
            @retry="retryMember(member.id)"
          />
        </div>
      </template>

      <!-- Limited: primary members + deploy CTA, then additional members with heading -->
      <template v-else>
        <div class="grid council-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CouncilMemberCard
            v-for="member in visibleCouncilMembers"
            :key="member.id"
            :member="member"
            :state="getMemberState(member.id, activeRound)"
            :response="activeRound?.memberResponses[member.id]"
            :error="activeRound?.memberErrors[member.id]"
            @retry="retryMember(member.id)"
          />

          <NuxtLink
            to="/deploy"
            class="rounded-xl p-6 border-2 border-dashed border-charcoal/20 bg-surface/80 hover:bg-surface hover:border-burgundy/50 hover:shadow-xl scale-in transition-all flex flex-col justify-center items-center text-center min-h-[200px]"
          >
            <svg class="w-10 h-10 text-burgundy mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <h3 class="font-display text-lg font-semibold text-charcoal mb-2">Deploy your own</h3>
            <p class="text-sm text-muted leading-relaxed">Change the underlying models, remove rate limits, and unlock additional members.</p>
          </NuxtLink>
        </div>

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
              state="locked"
              :response="null"
              :error="null"
            />
          </div>
        </div>
      </template>
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
  rounds?: CouncilResponseItem[][]
  verdict: string
  remaining?: number
}

let roundIdCounter = 0

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const questionDraft = ref('')
interface CouncilRound {
  id: number
  question: string
  memberResponses: Record<string, string>
  memberErrors: Record<string, string>
  verdict: string
  verdictError: string
}

const rounds = ref<CouncilRound[]>([])
const activeRoundId = ref<number | null>(null)
const isLoading = ref(false)
const rateLimited = ref(false)

const activeRound = computed(() =>
  activeRoundId.value !== null
    ? rounds.value.find(r => r.id === activeRoundId.value) ?? null
    : null
)

const previousRounds = computed(() =>
  rounds.value.filter(r => r.id !== activeRoundId.value)
)

const allMembersDone = computed(() => {
  if (!activeRound.value) return false
  return activeMembers.value.every(m =>
    activeRound.value.memberResponses[m.id] || activeRound.value.memberErrors[m.id]
  )
})

const showVerdict = computed(() => {
  if (!activeRound.value) return false
  return allMembersDone.value || !!activeRound.value.verdict || !!activeRound.value.verdictError
})

const hasResponded = computed(() => rounds.value.length > 0)

const getMemberState = (memberId: string, round?: CouncilRound | null): MemberState => {
  if (!round) return 'idle'
  if (round.memberErrors[memberId]) return 'error'
  if (round.memberResponses[memberId]) return 'responded'
  if (isLoading.value && round.id === activeRoundId.value) return 'thinking'
  return 'idle'
}

function buildHistory(): { question: string; memberResponses: { memberId: string; name: string; response: string | null; error: string | null }[]; verdict: string }[] {
  return previousRounds.value.map(r => ({
    question: r.question,
    memberResponses: activeMembers.value.map(m => ({
      memberId: m.id,
      name: m.name,
      response: r.memberResponses[m.id] || null,
      error: r.memberErrors[m.id] || null,
    })),
    verdict: r.verdict,
  }))
}

const applyResponseToRound = (roundId: number, data: CouncilApiResponse) => {
  const round = rounds.value.find(r => r.id === roundId)
  if (!round) return

  if (data.rounds?.length) {
    for (const roundData of data.rounds) {
      for (const item of roundData) {
        if (item.response) {
          round.memberResponses[item.memberId] = item.response
          delete round.memberErrors[item.memberId]
        } else if (item.error) {
          round.memberErrors[item.memberId] = item.error
        }
      }
    }
  }
  if (data.verdict) {
    round.verdict = data.verdict
    round.verdictError = ''
  }
}

const submitQuestion = async () => {
  const q = questionDraft.value.trim()
  if (!q || isLoading.value) return

  isLoading.value = true
  rateLimited.value = false

  const roundId = ++roundIdCounter
  const newRound: CouncilRound = {
    id: roundId,
    question: q,
    memberResponses: {},
    memberErrors: {},
    verdict: '',
    verdictError: '',
  }
  rounds.value.push(newRound)
  activeRoundId.value = roundId
  questionDraft.value = ''

  const history = buildHistory()

  try {
    const data = await $fetch<CouncilApiResponse>('/api/council', {
      method: 'POST',
      body: { question: q, history },
    })
    applyResponseToRound(roundId, data)
  } catch (err: any) {
    const status = err?.statusCode || err?.response?.status
    if (status === 429) {
      rateLimited.value = true
      rounds.value = rounds.value.filter(r => r.id !== roundId)
      activeRoundId.value = null
    } else {
      const round = rounds.value.find(r => r.id === roundId)
      if (round) {
        round.verdictError = 'Failed to get verdict. The council may be overwhelmed.'
        activeMembers.value.forEach((m) => {
          if (!round.memberResponses[m.id]) {
            round.memberErrors[m.id] = 'Request failed. Please try again.'
          }
        })
      }
    }
  } finally {
    isLoading.value = false
  }
}

const retryMember = async (memberId: string) => {
  if (!activeRound.value) return
  delete activeRound.value.memberErrors[memberId]
  isLoading.value = true

  const history = buildHistory()

  try {
    const data = await $fetch<CouncilApiResponse>('/api/council', {
      method: 'POST',
      body: { question: activeRound.value.question, memberIds: [memberId], history },
    })
    applyResponseToRound(activeRound.value.id, data)
    if (!activeRound.value.memberResponses[memberId]) {
      activeRound.value.memberErrors[memberId] = 'No response received'
    }
  } catch (err: any) {
    activeRound.value.memberErrors[memberId] = 'Retry failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const retryJudge = async () => {
  if (!activeRound.value) return
  activeRound.value.verdictError = ''
  isLoading.value = true

  const history = buildHistory()

  try {
    const previousResponses = activeMembers.value.map((m) => ({
      memberId: m.id,
      name: m.name,
      response: activeRound.value!.memberResponses[m.id] || null,
      error: activeRound.value!.memberErrors[m.id] || null,
    }))
    const data = await $fetch<{ verdict: string }>('/api/council', {
      method: 'POST',
      body: { question: activeRound.value.question, judgeOnly: true, previousResponses, history },
    })
    if (data.verdict) {
      activeRound.value.verdict = data.verdict
    } else {
      activeRound.value.verdictError = 'No verdict received'
    }
  } catch (err: any) {
    activeRound.value.verdictError = 'Retry failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  questionDraft.value = ''
  rounds.value = []
  activeRoundId.value = null
  isLoading.value = false
  rateLimited.value = false
  nextTick(() => textareaRef.value?.focus())
}

onMounted(() => {
  textareaRef.value?.focus()
})
</script>
