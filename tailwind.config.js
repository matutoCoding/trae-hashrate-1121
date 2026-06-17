/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#FFF5F0',
          100: '#FFE6D9',
          200: '#FFC9B0',
          300: '#FFA880',
          400: '#FF8A55',
          500: '#FF6B35',
          600: '#E55A2B',
          700: '#CC4D24',
          800: '#B3401E',
          900: '#993418',
        },
        secondary: {
          50: '#E8F1F2',
          100: '#C5DADD',
          200: '#9FC2C7',
          300: '#7AAAB1',
          400: '#55929B',
          500: '#1A535C',
          600: '#16474E',
          700: '#123B41',
          800: '#0E2F33',
          900: '#0A2326',
        },
        accent: {
          50: '#FFFBEA',
          100: '#FFF4C4',
          200: '#FFE880',
          300: '#FFDC3D',
          400: '#FFD93D',
          500: '#FFD93D',
          600: '#E6C136',
          700: '#CCA930',
          800: '#B3912A',
          900: '#997924',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
