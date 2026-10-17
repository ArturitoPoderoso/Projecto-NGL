/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      colors: {
        ngl: {
          orange: '#f55f15',
          orangeDark: '#e04f08',
          cardHeader: '#f55f15',
          cardBody: '#261e1b',
          cardText: '#c7c2be',
          bgDark: '#0e0d0b',
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-2px)' },
          '50%': { transform: 'translateY(2px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
