/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metro: {
          yellow: '#FFC72C',
          blue: '#0055A5',
          violet: '#8A2BE2',
          red: '#E31B23',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 15px rgba(255, 199, 44, 0.6)',
        'glow-blue': '0 0 15px rgba(0, 85, 165, 0.6)',
        'glow-violet': '0 0 15px rgba(138, 43, 226, 0.6)',
        'glow-red': '0 0 15px rgba(227, 27, 35, 0.6)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.6)',
      }
    },
  },
  plugins: [],
}
