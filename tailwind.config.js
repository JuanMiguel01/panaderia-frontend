// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#fffcf5', 100: '#FFF7ED', 200: '#FFEACC' },
        brown: {
          50:  '#fdf8f3',
          100: '#f5ece0',
          200: '#e8d5bb',
          400: '#c19a6b',
          500: '#a07850',
          600: '#7d5a38',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans:    ["'DM Sans'", 'system-ui', 'sans-serif'],
        display: ["'Playfair Display'", 'Georgia', 'serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(180,83,9,0.08)',
        'warm':    '0 4px 6px -1px rgba(180,83,9,0.1), 0 2px 4px -1px rgba(180,83,9,0.06)',
        'warm-lg': '0 10px 15px -3px rgba(180,83,9,0.1), 0 4px 6px -2px rgba(180,83,9,0.05)',
        'warm-xl': '0 20px 25px -5px rgba(180,83,9,0.1), 0 10px 10px -5px rgba(180,83,9,0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'modal-in':    'modal-in 0.2s ease-out',
        'slide-up':    'slide-up 0.3s ease-out',
        'loading-bar': 'loading-bar 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}