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
