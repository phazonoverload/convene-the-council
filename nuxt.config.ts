export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: ['@nuxtjs/tailwindcss'],
  
  runtimeConfig: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    maxTokensPerMember: Number(process.env.MAX_TOKENS_PER_MEMBER || 200),
    maxTokensJudge: Number(process.env.MAX_TOKENS_JUDGE || 400),
    rateLimit: Number(process.env.RATE_LIMIT || 5),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 24 * 60 * 60 * 1000),
    public: {
      limitedFeatures: process.env.LIMITED_FEATURES === 'true',
    },
  },
  
  nitro: {
    preset: 'netlify',
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
