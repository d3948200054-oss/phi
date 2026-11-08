/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#f8fafc',
          dark: '#0b0f19',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#111827',
          raised: '#f1f5f9',
          'raised-dark': '#1e293b',
        },
        border: {
          DEFAULT: '#e2e8f0',
          dark: '#1e293b',
        },
        content: {
          primary: '#0f172a',
          'primary-dark': '#f8fafc',
          secondary: '#64748b',
          'secondary-dark': '#94a3b8',
        },
        brand: {
          DEFAULT: '#1a2744', // Deep Navy
          hover: '#0f1a35',
          light: '#e8edf8',
          dark: '#3b5bdb',
          'dark-hover': '#4c6ef5',
        },
        navy: {
          50: '#e8edf8',
          100: '#c5d0ea',
          200: '#9fb0d8',
          300: '#7a90c6',
          400: '#5570b4',
          500: '#3050a2',
          600: '#1a2744',
          700: '#14203a',
          800: '#0f1a2f',
          900: '#0a1224',
        },
        titanium: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b0f19',
        },
        accent: {
          DEFAULT: '#f59e0b', // Gold/Amber
          hover: '#d97706',
          light: '#fef3c7',
          dark: '#fbbf24',
          'dark-hover': '#f59e0b',
        },
        status: {
          teal: '#0d9488',
          'teal-dark': '#2dd4bf',
          amber: '#d97706',
          'amber-dark': '#fbbf24',
          rose: '#e11d48',
          'rose-dark': '#fb7185',
          sky: '#0284c7',
          'sky-dark': '#38bdf8',
        }
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      }
    },
  },
  plugins: [],
}
