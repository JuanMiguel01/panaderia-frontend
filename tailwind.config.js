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
        cream: {
          100: '#FFF7ED',
          200: '#FFEACC',
        },
        brown: {
          400: '#A1887F',
          500: '#8D6E63',
          600: '#795548',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
        },
        accent: {
          200: '#FFCC80',
          500: '#FFA726',
          600: '#FB8C00',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}