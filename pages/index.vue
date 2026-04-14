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

    <div v-if="showDeployButton && limitedFeatures" class="mt-8 text-center">
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
