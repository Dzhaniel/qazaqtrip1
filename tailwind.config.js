/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#EFFAFB',
          100: '#D8F2F5',
          200: '#B4E4EA',
          300: '#7ED0DC',
          400: '#3FBACB',
          500: '#1BA3B8',
          600: '#0E7C8F',
          700: '#0D6575',
          800: '#0E525F',
          900: '#103F4A',
        },
        gold: {
          100: '#FBF1DC',
          200: '#F5E0AE',
          300: '#EFCB7B',
          400: '#E8B84E',
          500: '#E0A526',
          600: '#C08A1C',
          700: '#9A6E16',
        },
        navy: {
          50: '#EEF3F6',
          100: '#D8E2E9',
          200: '#AFC1CF',
          300: '#7E9AAE',
          400: '#4E7389',
          500: '#2C4F63',
          600: '#1B3A4C',
          700: '#14303F',
          800: '#0F2A3D',
          900: '#0A1E2C',
          950: '#061420',
        },
        cream: {
          0: '#FFFDF8',
          50: '#FDFBF7',
          100: '#FBF7EF',
          200: '#F5EDDD',
          300: '#EBDFC6',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 8px 28px -10px rgba(15, 42, 61, 0.16)',
        lift: '0 18px 44px -14px rgba(15, 42, 61, 0.28)',
        pin: '0 4px 14px -2px rgba(15, 42, 61, 0.35)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
