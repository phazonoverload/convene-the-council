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
