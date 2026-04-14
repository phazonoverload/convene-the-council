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
