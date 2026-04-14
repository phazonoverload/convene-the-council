<template>
  <div class="min-h-screen bg-parchment font-serif text-charcoal flex flex-col">
    <AppHeader />
    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<style>
@import '~/assets/css/main.css';
</style>
