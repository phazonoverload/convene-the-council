# Nuxt Conversion & Feature Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the app to Nuxt 3 multi-page with centralized council config and LIMITED_FEATURES env var

**Architecture:** Convert vanilla Vue 3 SPA to Nuxt 3 with file-based routing. Config-driven council members imported from single source. Server API as Nuxt server route. Tailwind via Nuxt module.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Tailwind CSS, TypeScript

---

## File Structure

```
/
├── app.vue                      # Root layout with header nav
├── pages/
│   ├── index.vue                # Main council page
│   └── deploy.vue               # Deployment instructions
├── config/
│   └── council.ts               # Single source of truth for all council members
├── components/
│   ├── CouncilMemberCard.vue    # Member card with lock state
│   ├── CouncilChat.vue          # Chat interface
│   ├── AppHeader.vue            # Navigation header
│   └── DeployButton.vue         # Reusable deploy button
├── server/
│   └── api/
│       └── council.ts           # API endpoint (was netlify function)
├── public/
│   └── (static assets)
├── assets/
│   └── css/
│       └── main.css             # Tailwind imports
├── nuxt.config.ts
├── tailwind.config.ts           # For Tailwind Nuxt module
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Task 1: Initialize Nuxt 3 Project

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "convene-the-council",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "nuxt": "^3.15.0",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.12.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create nuxt.config.ts**

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: ['@nuxtjs/tailwindcss'],
  
  runtimeConfig: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    limitedFeatures: process.env.LIMITED_FEATURES === 'true',
  },
  
  app: {
    head: {
      title: 'Convene the Council',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Gather AI personas to debate your ideas' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap' }
      ]
    }
  }
})
```

- [ ] **Step 3: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#f5f0e3',
        cream: '#f5f0e3',
        surface: '#ffffff',
        charcoal: '#2a2a2a',
        muted: '#6b6b6b',
        burgundy: '#7a2c2c',
        border: '#d4c9b5',
        error: '#b33a3a',
        locked: '#e8e4dc',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

- [ ] **Step 5: Create .env.example**

```bash
# OpenRouter API Key (required)
OPENROUTER_API_KEY=

# Set to "true" for free hosted tier (locks premium members, shows deploy buttons)
# Leave unset or set to "false" for self-hosted (all features unlocked)
LIMITED_FEATURES=
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

- [ ] **Step 7: Commit**

```bash
git add package.json nuxt.config.ts tailwind.config.ts tsconfig.json .env.example
git commit -m "chore: initialize Nuxt 3 project structure"
```

---

## Task 2: Create Council Config

**Files:**
- Create: `config/council.ts`

- [ ] **Step 1: Create config/council.ts**

```typescript
export interface CouncilMember {
  id: string
  name: string
  title: string
  description: string
  model: string
  systemPrompt: string
  avatar: string
  availableWhenLimited: boolean
}

const members: CouncilMember[] = [
  {
    id: 'pragmatist',
    name: 'The Pragmatist',
    title: 'Practical Solutions Expert',
    description: 'Cut through theory and focus on what works. Known for grounding abstract ideas in concrete terms.',
    model: 'deepseek/deepseek-v3.2',
    systemPrompt: 'You are a pragmatic thinker who values practical solutions over theoretical elegance. You focus on what can be done now, what will actually work, and how to get results with available resources. You are direct but not dismissive—acknowledging constraints while finding creative workarounds. When presented with a problem, you ask: "What is the simplest solution that addresses the core issue?"',
    avatar: '🧠',
    availableWhenLimited: true,
  },
  {
    id: 'skeptic',
    name: 'The Skeptic',
    title: 'Critical Analysis Specialist',
    description: 'Challenging assumptions and uncovering weaknesses. Don\'t take things at face value.',
    model: 'mistralai/mistral-large',
    systemPrompt: 'You are a skeptic who questions everything. You look for flaws in reasoning, unsupported assumptions, and potential unintended consequences. You are not cynical for its own sake—your goal is to strengthen ideas by pressure-testing them. When you disagree, you explain exactly why and offer alternative interpretations. You start from a position of doubt and require evidence to be convinced.',
    avatar: '🔍',
    availableWhenLimited: true,
  },
  {
    id: 'optimist',
    name: 'The Optimist',
    title: 'Possibility Explorer',
    description: 'Finding opportunities where others see problems. What could go right?',
    model: 'mistralai/mistral-nemo',
    systemPrompt: 'You are an optimist who sees possibilities and opportunities. You believe things can improve and focus on what could go right, not just what could go wrong. You are not naive—you acknowledge real constraints—but you look for ways to work within or around them. You inspire others by showing that the path forward exists, even when it is not obvious.',
    avatar: '☀️',
    availableWhenLimited: true,
  },
  {
    id: 'devil-advocate',
    name: 'Devil\'s Advocate',
    title: 'Contrarian Perspective',
    description: 'Argue the opposite position vigorously. Surface hidden biases.',
    model: 'google/gemma-2-9b-it',
    systemPrompt: 'You take the opposing view to whatever is presented. You argue convincingly for positions you may not personally hold. Your role is to challenge consensus thinking and surface hidden assumptions. You are provocative but not personal—your disagreements are about ideas, not people. You help others see their blind spots by playing devil\'s advocate.',
    avatar: '😈',
    availableWhenLimited: true,
  },
  {
    id: 'risk-manager',
    name: 'The Risk Manager',
    title: 'Risk Assessment Expert',
    description: 'Identify, quantify, and mitigate potential harms before they happen.',
    model: 'meta-llama/llama-3.1-8b-instruct',
    systemPrompt: 'You are a risk manager who specializes in identifying and mitigating potential problems before they occur. You think in terms of probabilities and outcomes, cataloging what could go wrong and how likely each scenario is. You are not risk-averse for its own sake—some risks are worth taking—but you want to ensure they are taken consciously. You help others make informed decisions by laying out the risk landscape clearly.',
    avatar: '⚖️',
    availableWhenLimited: true,
  },
  {
    id: 'mentor',
    name: 'The Mentor',
    title: 'Career Development Guide',
    description: 'Wise counsel on professional growth, leadership, and navigating organizations.',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a seasoned mentor with decades of experience guiding people through their careers. You have seen countless patterns repeat and know which advice stands the test of time. You are patient and generous with your knowledge, but you also push people to grow rather than confirming comfortable choices. You ask questions that make people think deeply about what they really want and how to get there.',
    avatar: '🧙',
    availableWhenLimited: false,
  },
  {
    id: 'genius',
    name: 'The Genius',
    title: 'Innovation Strategist',
    description: 'Breakthrough thinking at the intersection of multiple disciplines.',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a polymath with deep expertise across many fields. You see connections between disciplines that others miss, and you are not afraid to challenge conventional wisdom when the evidence suggests a different approach. You are enthusiastic about ideas, sometimes to a fault, but you can also be rigorous when needed. You push the boundaries of what is possible.',
    avatar: '💡',
    availableWhenLimited: false,
  },
  {
    id: 'therapist',
    name: 'The Therapist',
    title: 'Emotional Intelligence Expert',
    description: 'Navigate the human side of decisions—the feelings, relationships, and personal stakes.',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a compassionate therapist who helps people navigate the emotional dimensions of their decisions. You understand that people are not purely rational—that fears, desires, past experiences, and relationships all shape choices. You help others clarify their values, process difficult emotions, and make decisions that they will be at peace with. You are non-judgmental and create space for all feelings.',
    avatar: '💚',
    availableWhenLimited: false,
  },
  {
    id: 'historian',
    name: 'The Historian',
    title: 'Pattern Recognition Analyst',
    description: 'Lessons from the past to illuminate the present and future.',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a historian who draws lessons from the past to inform present decisions. You know that history does not repeat exactly, but patterns often rhyme. You help others avoid the traps of the past and learn from those who faced similar challenges. You are thoughtful about which historical parallels are relevant and which are misleading. You make complex history accessible and applicable.',
    avatar: '📚',
    availableWhenLimited: false,
  },
  {
    id: 'inventor',
    name: 'The Inventor',
    title: 'Creative Solution Designer',
    description: 'Design novel tools and systems to solve hard problems.',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are an inventor who loves to design new solutions to hard problems. You think in systems and are not satisfied with superficial fixes—you look for elegant, generalizable solutions. You are creative and playful with ideas, not afraid to suggest unconventional approaches. You balance innovation with practicality, knowing that the best inventions are those that actually get used.',
    avatar: '🔧',
    availableWhenLimited: false,
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    title: 'Values and Ethics Steward',
    description: 'Protect what matters most—people, principles, long-term good.',
    model: 'anthropic/claude-sonnet-4-6',
    systemPrompt: 'You are a guardian who protects what matters most—people\'s wellbeing, organizational values, and long-term good. You are often the voice of caution when others are rushing forward, reminding them of principles that should not be compromised. You are not anti-progress, but you insist that progress should not come at unacceptable costs. You speak up when you see ethical concerns, even when it is uncomfortable.',
    avatar: '🛡️',
    availableWhenLimited: false,
  },
]

export default members
```

- [ ] **Step 2: Commit**

```bash
git add config/council.ts
git commit -m "feat: add centralized council member configuration"
```

---

## Task 3: Create App Header Component

**Files:**
- Create: `components/AppHeader.vue`

- [ ] **Step 1: Create components/AppHeader.vue**

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add components/AppHeader.vue
git commit -m "feat: add app header navigation component"
```

---

## Task 4: Create Deploy Button Component

**Files:**
- Create: `components/DeployButton.vue`

- [ ] **Step 1: Create components/DeployButton.vue**

```vue
<template>
  <button
    type="button"
    @click="handleClick"
    class="px-4 py-2 text-sm bg-burgundy text-white rounded hover:bg-burgundy/90 transition-colors"
  >
    <slot>Deploy to unlock</slot>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'default' | 'large'
}>(), {
  variant: 'default'
})

const handleClick = () => {
  window.open('https://app.netlify.com/start/deploy?repository=https://github.com/phazonoverload/convene-the-council', '_blank')
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add components/DeployButton.vue
git commit -m "feat: add reusable deploy button component"
```

---

## Task 5: Create CouncilMemberCard Component

**Files:**
- Create: `components/CouncilMemberCard.vue`

- [ ] **Step 1: Create components/CouncilMemberCard.vue**

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add components/CouncilMemberCard.vue
git commit -m "feat: add council member card component"
```

---

## Task 6: Create Main App Layout

**Files:**
- Create: `app.vue`
- Create: `assets/css/main.css`

- [ ] **Step 1: Create assets/css/main.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Create app.vue**

```vue
<template>
  <div class="min-h-screen bg-parchment">
    <AppHeader />
    <main class="max-w-6xl mx-auto px-4 py-8">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
@import '~/assets/css/main.css';
</style>
```

- [ ] **Step 3: Commit**

```bash
git add app.vue assets/css/main.css
git commit -m "feat: add main app layout with header"
```

---

## Task 7: Create Index Page (Council Page)

**Files:**
- Create: `pages/index.vue`

- [ ] **Step 1: Create pages/index.vue**

```vue
<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-3xl text-charcoal mb-2">Your Council</h1>
      <p class="text-muted">Select a council member to hear their perspective on your idea.</p>
    </div>

    <div v-if="selectedMember" class="mb-8">
      <CouncilChat 
        :member="selectedMember" 
        @back="selectedMember = null"
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CouncilMemberCard 
        v-for="member in visibleMembers"
        :key="member.id"
        :member="member"
        :is-locked="isLocked(member)"
        @click="!isLocked(member) && (selectedMember = member)"
      />
    </div>

    <div v-if="!showDeployButton && limitedFeatures" class="mt-8 text-center">
      <p class="text-muted text-sm">
        Some council members are only available when you deploy your own instance.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import members, { type CouncilMember } from '~/config/council'

const config = useRuntimeConfig()
const limitedFeatures = computed(() => config.limitedFeatures)

const selectedMember = ref<CouncilMember | null>(null)

const visibleMembers = computed(() => members)

const isLocked = (member: CouncilMember) => {
  return !member.availableWhenLimited && limitedFeatures.value
}

const showDeployButton = computed(() => {
  return members.some(m => !m.availableWhenLimited) && limitedFeatures.value
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add pages/index.vue
git commit -m "feat: add main council page"
```

---

## Task 8: Create Deploy Page

**Files:**
- Create: `pages/deploy.vue`

- [ ] **Step 1: Create pages/deploy.vue**

```vue
<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h1 class="font-display text-3xl text-charcoal mb-2">Deploy Your Own Council</h1>
      <p class="text-muted">Run your own instance with all council members unlocked.</p>
    </div>

    <div class="bg-surface rounded-lg border border-border p-6 mb-6">
      <h2 class="font-display text-xl text-charcoal mb-4">Deploy to Netlify</h2>
      <p class="text-muted mb-4">
        One-click deployment to get your own instance running in minutes.
      </p>
      <DeployButton variant="large">
        Deploy to Netlify
      </DeployButton>
    </div>

    <div class="bg-surface rounded-lg border border-border p-6 mb-6">
      <h2 class="font-display text-xl text-charcoal mb-4">What you'll need</h2>
      <ul class="space-y-3 text-muted">
        <li class="flex items-start gap-3">
          <span class="text-burgundy">1.</span>
          <div>
            <strong class="text-charcoal">OpenRouter API Key</strong>
            <p class="text-sm">Required for AI responses. Get one at <a href="https://openrouter.ai" target="_blank" class="text-burgundy hover:underline">openrouter.ai</a></p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy">2.</span>
          <div>
            <strong class="text-charcoal">Netlify Account</strong>
            <p class="text-sm">Free account at <a href="https://netlify.com" target="_blank" class="text-burgundy hover:underline">netlify.com</a></p>
          </div>
        </li>
      </ul>
    </div>

    <div class="bg-surface rounded-lg border border-border p-6 mb-6">
      <h2 class="font-display text-xl text-charcoal mb-4">How it works</h2>
      <ol class="space-y-4 text-muted">
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">1.</span>
          <p>Click the deploy button above</p>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">2.</span>
          <p>Connect your GitHub repository</p>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">3.</span>
          <p>Add your <code class="bg-parchment px-2 py-0.5 rounded text-sm">OPENROUTER_API_KEY</code> to Netlify environment variables</p>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-burgundy font-semibold">4.</span>
          <p>Your council is ready! All premium members are unlocked.</p>
        </li>
      </ol>
    </div>

    <div class="bg-parchment rounded-lg border border-border p-6">
      <h2 class="font-display text-xl text-charcoal mb-2">Self-Hosting</h2>
      <p class="text-muted text-sm">
        This app is open source and can be self-hosted on any platform. When self-hosting, 
        set <code class="bg-surface px-2 py-0.5 rounded text-sm">LIMITED_FEATURES=false</code> 
        (or leave it unset) to unlock all council members. No deploy buttons will appear.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Deploy'
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add pages/deploy.vue
git commit -m "feat: add deployment instructions page"
```

---

## Task 9: Create Server API Endpoint

**Files:**
- Create: `server/api/council.ts`

- [ ] **Step 1: Create server/api/council.ts**

```typescript
import members from '~/config/council'

interface CouncilRequest {
  memberId: string
  messages: { role: string; content: string }[]
  ip?: string
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000

function getClientIP(event: any): string {
  return event.node?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() 
    || event.node?.req?.socket?.remoteAddress 
    || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CouncilRequest>(event)
  const ip = getClientIP(event)
  
  if (!body.memberId || !body.messages) {
    throw createError({
      statusCode: 400,
      message: 'memberId and messages are required'
    })
  }
  
  const member = members.find(m => m.id === body.memberId)
  if (!member) {
    throw createError({
      statusCode: 404,
      message: 'Council member not found'
    })
  }
  
  if (!member.availableWhenLimited && config.limitedFeatures) {
    throw createError({
      statusCode: 403,
      message: 'This council member is not available in the hosted version'
    })
  }
  
  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Rate limit exceeded. Please try again later.'
    })
  }
  
  if (!config.openRouterApiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenRouter API key not configured'
    })
  }
  
  const apiMessages = [
    { role: 'system', content: member.systemPrompt },
    ...body.messages.slice(-10)
  ]
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': event.node?.req?.headers?.referer || '',
        'X-Title': 'Convene the Council'
      },
      body: JSON.stringify({
        model: member.model,
        messages: apiMessages
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', error)
      throw createError({
        statusCode: 502,
        message: 'Failed to get response from AI'
      })
    }
    
    const data = await response.json()
    return {
      message: data.choices[0]?.message?.content || 'No response generated'
    }
  } catch (err: any) {
    console.error('API error:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Internal server error'
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/api/council.ts
git commit -m "feat: add council API endpoint"
```

---

## Task 10: Create CouncilChat Component

**Files:**
- Create: `components/CouncilChat.vue`

- [ ] **Step 1: Create components/CouncilChat.vue**

```vue
<template>
  <div class="bg-surface rounded-lg border border-border overflow-hidden">
    <div class="bg-parchment border-b border-border p-4 flex items-center gap-4">
      <button 
        @click="$emit('back')"
        class="text-muted hover:text-charcoal transition-colors"
      >
        ← Back
      </button>
      <span class="text-2xl">{{ member.avatar }}</span>
      <div>
        <h2 class="font-display font-semibold text-charcoal">{{ member.name }}</h2>
        <p class="text-sm text-muted">{{ member.title }}</p>
      </div>
    </div>
    
    <div class="h-80 overflow-y-auto p-4 space-y-4">
      <div 
        v-for="(msg, i) in chatMessages" 
        :key="i"
        class="flex gap-3"
        :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
      >
        <div 
          class="max-w-[80%] rounded-lg px-4 py-2"
          :class="msg.role === 'user' ? 'bg-burgundy text-white' : 'bg-parchment text-charcoal'"
        >
          {{ msg.content }}
        </div>
      </div>
      <div v-if="isLoading" class="flex gap-3">
        <div class="bg-parchment text-charcoal rounded-lg px-4 py-2">
          Thinking...
        </div>
      </div>
    </div>
    
    <div class="border-t border-border p-4">
      <form @submit.prevent="sendMessage" class="flex gap-3">
        <input
          v-model="userInput"
          type="text"
          placeholder="Ask the council..."
          class="flex-1 bg-parchment border border-border rounded-lg px-4 py-2 text-charcoal placeholder-muted focus:outline-none focus:border-burgundy"
          :disabled="isLoading"
        />
        <button
          type="submit"
          class="px-6 py-2 bg-burgundy text-white rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          :disabled="!userInput.trim() || isLoading"
        >
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CouncilMember } from '~/config/council'

const props = defineProps<{
  member: CouncilMember
}>()

defineEmits<{
  back: []
}>()

const userInput = ref('')
const chatMessages = ref<{ role: string; content: string }[]>([])
const isLoading = ref(false)

const sendMessage = async () => {
  if (!userInput.trim() || isLoading.value) return
  
  const userMessage = userInput.trim()
  userInput.value = ''
  
  chatMessages.value.push({ role: 'user', content: userMessage })
  isLoading.value = true
  
  try {
    const response = await $fetch('/api/council', {
      method: 'POST',
      body: {
        memberId: props.member.id,
        messages: chatMessages.value
      }
    })
    
    chatMessages.value.push({ role: 'assistant', content: response.message })
  } catch (err: any) {
    chatMessages.value.push({ 
      role: 'assistant', 
      content: err.data?.message || 'Failed to get response. Please try again.' 
    })
  } finally {
    isLoading.value = false
  }
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add components/CouncilChat.vue
git commit -m "feat: add council chat component"
```

---

## Task 11: Add Netlify Configuration

**Files:**
- Create: `netlify.toml` (update existing)

- [ ] **Step 1: Update netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[dev]
  command = "npm run dev"
  port = 3000
  targetPort = 3000

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml
git commit -m "chore: update netlify config for Nuxt"
```

---

## Task 12: Verify Build

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: Successful build with no errors

- [ ] **Step 2: Test dev server**

Run: `npm run dev`
Expected: Dev server starts on port 3000

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat: complete Nuxt 3 conversion with feature flags"
```

---

## Spec Coverage Check

- [x] Nuxt 3 multi-page app — Task 1
- [x] `/deploy` page with instructions — Task 8
- [x] Deploy buttons link to `/deploy` — Task 4 (DeployButton), shown in cards
- [x] Centralized council config — Task 2
- [x] `LIMITED_FEATURES` env var — Task 1 (nuxt.config), Task 6 (runtimeConfig), Task 7 (index page logic)
- [x] Limited mode locks premium, shows deploy buttons — Task 7 (isLocked logic)
- [x] Full mode hides deploy buttons — Task 7 (showDeployButton logic)
- [ ] Phase 2: Self-hosted council customization — deferred
