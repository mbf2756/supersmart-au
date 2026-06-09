import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1E3C',
          mid: '#1A3057',
          light: '#243D6B',
        },
        teal: {
          DEFAULT: '#00D4AA',
          dim: '#00A888',
        },
        surface: {
          DEFAULT: '#F5F4F0',
          2: '#ECEAE4',
        },
        slate: {
          DEFAULT: '#8A9BB5',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}

export default config
