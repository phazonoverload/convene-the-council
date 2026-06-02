# Multi-Round Conversations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support multiple rounds of Q&A with the council, where round 2+ members see past verdicts and the judge sees all responses from all rounds.

**Architecture:** Server accepts `history` array with the request. Client maintains `rounds[]` state and sends it as history on follow-ups. Members get verdicts-only context; judge gets full response history.

**Tech Stack:** Nuxt 3 / Nitro (server), Vue 3 (client), Tailwind CSS

---

### Task 1: Server — accept history, inject context per role

**Files:**
- Modify: `server/api/council.ts`

- [ ] **Step 1: Add ConversationRound interface and update CouncilRequest**

Add to the top of `server/api/council.ts`, after the existing `MemberResponse` interface:

```typescript
interface ConversationRound {
  question: string
  memberResponses: MemberResponse[]
  verdict: string
}
```

Update `CouncilRequest` to include optional history:

```typescript
interface CouncilRequest {
  question: string
  memberIds?: string[]
  judgeOnly?: boolean
  history?: ConversationRound[]
}
```

- [ ] **Step 2: Add history-capping helper**

Add before `getCouncilResponses`:

```typescript
const MAX_HISTORY_ROUNDS = 10

function capHistory(history: ConversationRound[]): ConversationRound[] {
  if (history.length <= MAX_HISTORY_ROUNDS) return history
  return history.slice(history.length - MAX_HISTORY_ROUNDS)
}
```

- [ ] **Step 3: Update getCouncilResponses to inject verdict history**

Replace the function signature and body of `getCouncilResponses`:

```typescript
async function getCouncilResponses(
  question: string,
  maxTokensPerMember: number,
  history: ConversationRound[],
  memberIds?: string[],
  limited?: boolean,
  disabledMembers: string[] = [],
): Promise<MemberResponse[]> {
  const pool = (limited ? COUNCIL_MEMBERS : ALL_MEMBERS)
    .filter(m => !disabledMembers.includes(m.id))
  const members = memberIds
    ? pool.filter(m => memberIds!.includes(m.id))
    : pool

  const previousVerdicts = history.length > 0
    ? 'Previous discussion:\n\nJudge\'s verdicts:\n' +
      history.map((r, i) => `Round ${i + 1}: ${r.verdict}`).join('\n\n')
    : ''

  const userMessage = previousVerdicts
    ? `${previousVerdicts}\n\nNew question: ${question}`
    : question

  const promises = members.map(member =>
    callOpenRouter(member.model, member.systemPrompt, userMessage, maxTokensPerMember)
      .then(response => ({
        memberId: member.id,
        name: member.name,
        response,
        error: null,
      }))
      .catch(error => ({
        memberId: member.id,
        name: member.name,
        response: null,
        error: error.message,
      }))
  )

  return Promise.all(promises)
}
```

- [ ] **Step 4: Update getJudgeVerdict to receive full history**

Replace the function signature and body:

```typescript
async function getJudgeVerdict(
  question: string,
  currentResponses: MemberResponse[],
  history: ConversationRound[],
  maxTokensJudge: number,
): Promise<string> {
  const allResponses: MemberResponse[] = []

  for (const round of history) {
    allResponses.push(...round.memberResponses)
  }
  allResponses.push(...currentResponses)

  const historyVeridctsText = history.length > 0
    ? history.map((r, i) => `Round ${i + 1}:\n${r.memberResponses.map(m => `${m.name}: ${m.response || `Error: ${m.error}`}`).join('\n')}\nVerdict: ${r.verdict}`).join('\n\n')
    : ''

  const judgeBody = historyVeridctsText
    ? `Full conversation:\n\n${historyVeridctsText}\n\nCurrent question: ${question}\n\nCurrent responses:\n${currentResponses.map(m => `${m.name}: ${m.response || `Error: ${m.error}`}`).join('\n\n')}`
    : `Question: ${question}\n\nCouncil Responses:\n${currentResponses.map(m => `${m.name}: ${m.response || `Error: ${m.error}`}`).join('\n\n')}`

  return callOpenRouter(JUDGE_CONFIG.model, JUDGE_CONFIG.systemPrompt, judgeBody, maxTokensJudge)
}
```

- [ ] **Step 5: Update the request handler to wire history through**

In the `defineEventHandler`, after `const question = body.question.trim()`, cap the history:

```typescript
const history = body.history ? capHistory(body.history) : []
```

Then in the main try block (around line 196), pass history to both functions. Replace the existing try block:

```typescript
  try {
    const limited = config.public.limitedFeatures as boolean
    const disabledMembers = config.public.disabledMembers as string[]
    const memberResponses = await getCouncilResponses(question, maxTokensPerMember, history, body.memberIds, limited, disabledMembers)
    const verdict = await getJudgeVerdict(question, memberResponses, history, maxTokensJudge)

    return {
      question,
      rounds: [memberResponses.map(m => ({
        memberId: m.memberId,
        name: m.name,
        response: m.response,
        error: m.error,
      }))],
      verdict,
      remaining: rateLimitResult.remaining,
    }
  } catch (err: any) {
```

Also update the `judgeOnly` branch. Replace the existing `if (body.judgeOnly)` block:

```typescript
  if (body.judgeOnly) {
    try {
      const previousResponses = (body as any).previousResponses as MemberResponse[] | undefined
      if (!previousResponses?.length) {
        throw createError({ statusCode: 400, message: 'previousResponses required for judgeOnly' })
      }
      const verdict = await getJudgeVerdict(question, previousResponses, history, maxTokensJudge)
      return { verdict, remaining: rateLimitResult.remaining }
    } catch (err: any) {
      if (err.statusCode) throw err
      throw createError({ statusCode: 500, message: err.message || 'Failed to get verdict' })
    }
  }
```

- [ ] **Step 6: Run dev server to check for compilation errors**

```bash
npm run dev
```

Expected: Server starts without errors on http://localhost:3000

- [ ] **Step 7: Commit**

```bash
git add server/api/council.ts
git commit -m "feat: accept conversation history in council API for multi-round support"
```

---

### Task 2: Client — rounds state management and history-passing submit

**Files:**
- Modify: `pages/index.vue`

- [ ] **Step 1: Replace single-response state with rounds array**

In the script section, replace these lines:

```typescript
const question = ref('')
const isLoading = ref(false)
const rateLimited = ref(false)
const responses = ref<Record<string, string>>({})
const errors = ref<Record<string, string>>({})
const lastMemberResponses = ref<CouncilResponseItem[]>([])
const verdict = ref('')
const verdictError = ref('')
```

With:

```typescript
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
```

Then replace the `CouncilApiResponse` interface:

```typescript
interface CouncilApiResponse {
  question: string
  rounds: CouncilResponseItem[][]
  verdict: string
  remaining?: number
}
```

- [ ] **Step 2: Add computed properties**

Add these after the existing `activeMembers` computed:

```typescript
const activeRound = computed(() =>
  activeRoundId.value !== null
    ? rounds.value.find(r => r.id === activeRoundId.value) ?? null
    : null
)

const previousRounds = computed(() =>
  rounds.value.filter(r => r.id !== activeRoundId.value)
)

const hasPreviousRounds = computed(() => previousRounds.value.length > 0)

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
```

- [ ] **Step 3: Replace getMemberState, applyResponse, submitQuestion**

Replace `getMemberState`:

```typescript
const getMemberState = (memberId: string, round?: CouncilRound | null): MemberState => {
  if (!round) return 'idle'
  if (round.memberErrors[memberId]) return 'error'
  if (round.memberResponses[memberId]) return 'responded'
  if (isLoading.value && round.id === activeRoundId.value) return 'thinking'
  return 'idle'
}
```

Replace `submitQuestion`:

```typescript
const submitQuestion = async () => {
  const q = questionDraft.value.trim()
  if (!q || isLoading.value) return

  isLoading.value = true
  rateLimited.value = false

  const roundId = Date.now()
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

  const history = previousRounds.value.map(r => ({
    question: r.question,
    memberResponses: activeMembers.value.map(m => ({
      memberId: m.id,
      name: m.name,
      response: r.memberResponses[m.id] || null,
      error: r.memberErrors[m.id] || null,
    })),
    verdict: r.verdict,
  }))

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
```

Replace `applyResponse` with:

```typescript
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
```

- [ ] **Step 4: Update retryMember and retryJudge**

Replace `retryMember`:

```typescript
const retryMember = async (memberId: string) => {
  if (!activeRound.value) return
  delete activeRound.value.memberErrors[memberId]
  isLoading.value = true

  const history = previousRounds.value.map(r => ({
    question: r.question,
    memberResponses: activeMembers.value.map(m => ({
      memberId: m.id,
      name: m.name,
      response: r.memberResponses[m.id] || null,
      error: r.memberErrors[m.id] || null,
    })),
    verdict: r.verdict,
  }))

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
```

Replace `retryJudge`:

```typescript
const retryJudge = async () => {
  if (!activeRound.value) return
  activeRound.value.verdictError = ''
  isLoading.value = true

  const history = previousRounds.value.map(r => ({
    question: r.question,
    memberResponses: activeMembers.value.map(m => ({
      memberId: m.id,
      name: m.name,
      response: r.memberResponses[m.id] || null,
      error: r.memberErrors[m.id] || null,
    })),
    verdict: r.verdict,
  }))

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
```

- [ ] **Step 5: Update reset and template bindings**

Replace `reset`:

```typescript
const reset = () => {
  questionDraft.value = ''
  rounds.value = []
  activeRoundId.value = null
  isLoading.value = false
  rateLimited.value = false
  nextTick(() => textareaRef.value?.focus())
}
```

Update the `getMemberState` call sites in the template. In the `CouncilMemberCard` bindings, change `getMemberState(member.id)` to `getMemberState(member.id, activeRound)`.

- [ ] **Step 6: Run dev server to check for compilation errors**

```bash
npm run dev
```

Expected: Server starts without errors. No visible UI changes yet (accordion UI still pending).

- [ ] **Step 7: Commit**

```bash
git add pages/index.vue
git commit -m "feat: multi-round state management on client"
```

---

### Task 3: Client UI — collapsible rounds accordion

**Files:**
- Modify: `pages/index.vue`

- [ ] **Step 1: Replace template rendering for accordion rounds**

Replace the entire template in `pages/index.vue` with the following. Key changes:
- Question input only shows when there's no active round in progress
- Previous rounds render as collapsible sections
- Active round renders expanded with member cards and verdict
- "Ask another question" button at the bottom appends a new round

```vue
<template>
  <div>
    <!-- Question Input (only when not loading) -->
    <div v-if="!isLoading" class="bg-surface rounded-lg border-2 border-charcoal/10 shadow-lg overflow-hidden">
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
          Ask the council
        </button>
      </div>
    </div>

    <!-- Rate Limit -->
    <div v-if="rateLimited" class="mt-6 p-6 bg-surface border border-error rounded-lg text-center card-shadow">
      <p class="text-error font-medium mb-3">Rate limit reached. The council needs a moment to rest.</p>
      <p class="text-muted text-sm mb-4">Deploy your own instance to get higher limits and unlock additional council members.</p>
      <NuxtLink to="/deploy" class="inline-block px-6 py-2 bg-burgundy text-white rounded-lg hover:bg-burgundy/90 transition-colors">
        Deploy your own
      </NuxtLink>
    </div>

    <!-- Previous Rounds (collapsible) -->
    <div v-for="(round, index) in previousRounds" :key="round.id" class="mt-6">
      <div
        @click="toggleRound(round.id)"
        class="bg-surface rounded-lg border border-border card-shadow cursor-pointer hover:border-burgundy/40 transition-colors"
      >
        <div class="p-4 flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <span class="font-display text-sm font-semibold text-charcoal">Round {{ index + 1 }}</span>
            <p class="text-sm text-muted truncate mt-1">{{ round.question }}</p>
          </div>
          <div class="flex items-center gap-3 ml-4">
            <span v-if="round.verdict" class="text-xs text-burgundy truncate max-w-[200px] hidden sm:block">{{ truncateText(round.verdict, 80) }}</span>
            <svg
              :class="['w-5 h-5 text-muted transition-transform', expandedRounds.has(round.id) ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>
      <div v-if="expandedRounds.has(round.id)" class="mt-4">
        <div class="mb-4 p-4 bg-surface rounded-lg border border-border card-shadow">
          <p class="text-xs uppercase tracking-wider text-muted mb-2">Your question</p>
          <p class="text-charcoal leading-relaxed whitespace-pre-wrap">{{ round.question }}</p>
        </div>
        <div class="grid council-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CouncilMemberCard
            v-for="member in activeMembers"
            :key="member.id"
            :member="member"
            :state="getMemberState(member.id, round)"
            :response="round.memberResponses[member.id]"
            :error="round.memberErrors[member.id]"
          />
        </div>
        <JudgeVerdict
          v-if="round.verdict || round.verdictError"
          :verdict="round.verdict"
          :error="round.verdictError"
        />
      </div>
    </div>

    <!-- Active Round -->
    <div v-if="activeRound" class="mt-6">
      <div v-if="hasPreviousRounds" class="flex items-center gap-4 mb-4">
        <div class="flex-1 h-px bg-border"></div>
        <span class="font-display text-sm font-medium text-muted uppercase tracking-wider">Current Round</span>
        <div class="flex-1 h-px bg-border"></div>
      </div>

      <!-- Active question display -->
      <div class="mb-4 p-4 bg-surface rounded-lg border border-border card-shadow">
        <p class="text-xs uppercase tracking-wider text-muted mb-2">Your question</p>
        <p class="text-charcoal leading-relaxed whitespace-pre-wrap">{{ activeRound.question }}</p>
      </div>

      <!-- Council Grid -->
      <div class="grid council-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <CouncilMemberCard
          v-for="member in activeMembers"
          :key="member.id"
          :member="member"
          :state="getMemberState(member.id, activeRound)"
          :response="activeRound.memberResponses[member.id]"
          :error="activeRound.memberErrors[member.id]"
          @retry="retryMember(member.id)"
        />
      </div>

      <!-- Verdict -->
      <JudgeVerdict
        v-if="showVerdict"
        :verdict="activeRound.verdict"
        :is-loading="isLoading && !activeRound.verdict && !activeRound.verdictError"
        :error="activeRound.verdictError"
        @retry="retryJudge"
      />
    </div>

    <!-- Ask Another Question -->
    <div v-if="hasResponded && !isLoading" class="mt-8 text-center">
      <button @click="reset" class="text-burgundy hover:text-burgundy/80 underline underline-offset-4 text-sm">
        Ask another question
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add expandedRounds reactive state and toggle function**

In the script section, add after `const rateLimited = ref(false)`:

```typescript
const expandedRounds = ref<Set<number>>(new Set())
```

Add before `submitQuestion`:

```typescript
const toggleRound = (roundId: number) => {
  const newSet = new Set(expandedRounds.value)
  if (newSet.has(roundId)) {
    newSet.delete(roundId)
  } else {
    newSet.add(roundId)
  }
  expandedRounds.value = newSet
}
```

Add a truncate utility after `toggleRound`:

```typescript
const truncateText = (text: string, maxLen: number): string => {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}
```

- [ ] **Step 3: Update the `limited` template variant**

The existing template has a `limited` variant (lines 79-120) that shows a deploy CTA for locked members. Since the "Previous Rounds" section uses `activeMembers` directly (which is already filtered by limited), we need to adjust the collapsible round rendering to use the same visual. Remove the old `limited` / `self-hosted` template block (which was under the old `Council Grid` section) since the new accordion template replaces it entirely. The old `Council Grid` section at lines 53-121 should all be replaced by the new accordion template.

Note: The deploy CTA card for limited mode is now lost. Let's add it back inside the active round grid, same visual placement. Add the `NuxtLink` deploy CTA inside the `Active Round` grid, after the `v-for` member cards, in limited mode:

Add inside the grid div within the Active Round section (after the `v-for` CouncilMemberCard):

```vue
<NuxtLink
  v-if="limited"
  to="/deploy"
  class="rounded-xl p-6 border-2 border-dashed border-charcoal/20 bg-surface/80 hover:bg-surface hover:border-burgundy/50 hover:shadow-xl scale-in transition-all flex flex-col justify-center items-center text-center min-h-[200px]"
>
  <svg class="w-10 h-10 text-burgundy mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
  <h3 class="font-display text-lg font-semibold text-charcoal mb-2">Deploy your own</h3>
  <p class="text-sm text-muted leading-relaxed">Change the underlying models, remove rate limits, and unlock additional members.</p>
</NuxtLink>
```

- [ ] **Step 4: Run dev server to verify UI compiles**

```bash
npm run dev
```

Expected: Server starts, app shows question input. Submit triggers a round. After response, accordion shows. "Ask another question" creates a new round.

- [ ] **Step 5: Commit**

```bash
git add pages/index.vue
git commit -m "feat: collapsible multi-round accordion UI"
```

---

### Verification

Deploy the app with `npm run dev` and test:

1. Ask a question -> members respond -> judge verdicts shows
2. Click "Ask another question" -> new round starts, old round collapses
3. Expand old round -> previous members and verdict visible
4. Ask third question -> both prior rounds collapsible, current round active
5. Rate limit still works (429 triggers the rate limit message)
