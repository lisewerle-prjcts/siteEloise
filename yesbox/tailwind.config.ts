import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        magenta: '#D63E7A',
        cream: '#FAF6F0',
        'soft-black': '#1A1A1A',
        'gray-border': '#E8E2DA',
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'stripe-pattern': `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 8px,
          rgba(255,255,255,0.15) 8px,
          rgba(255,255,255,0.15) 16px
        )`,
      },
    },
  },
  plugins: [],
}

export default config
