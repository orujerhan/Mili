/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080A0F',
          900: '#0F1117',
          850: '#12151E',
          800: '#171B26',
          700: '#1E2433',
          600: '#2A3143'
        },
        accent: {
          // Primary / secondary follow the user's accent theme (CSS vars set at runtime).
          cyan: 'rgb(var(--accent-1) / <alpha-value>)',
          violet: 'rgb(var(--accent-2) / <alpha-value>)',
          teal: '#0F766E',
          pink: '#DB2777',
          amber: '#B45309'
        }
      },
      fontFamily: {
        display: [
          'Segoe UI Variable Display',
          'Segoe UI',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        code: ['Cascadia Code', 'Consolas', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        island: '0 18px 38px -18px rgba(20, 22, 32, 0.26)',
        widget: '0 24px 70px -20px rgba(20, 22, 32, 0.32), 0 0 0 1px rgba(255,255,255,0.6)',
        glow: '0 0 28px -10px rgb(var(--accent-1) / 0.5)',
        'glow-violet': '0 0 28px -10px rgb(var(--accent-2) / 0.5)'
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-5px) rotate(-1.2deg)' }
        },
        bouncey: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '25%': { transform: 'translateY(-6px) scale(1.03)' },
          '50%': { transform: 'translateY(0) scale(1)' },
          '75%': { transform: 'translateY(-3px) scale(1.02)' }
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.06)' }
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        driftUp: {
          '0%': { opacity: '0', transform: 'translate(0, 6px) scale(0.9)' },
          '30%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translate(10px, -26px) scale(1.1)' }
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '60%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideOver: {
          '0%': { opacity: '0', transform: 'translateX(22px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        confetti: {
          '0%': { opacity: '0', transform: 'translateY(0) rotate(0deg)' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(38px) rotate(140deg)' }
        }
      },
      animation: {
        floaty: 'floaty 4.5s ease-in-out infinite',
        bouncey: 'bouncey 1.05s ease-in-out infinite',
        breathe: 'breathe 3.2s ease-in-out infinite',
        rise: 'rise 0.4s cubic-bezier(0.22,1,0.36,1) both',
        driftUp: 'driftUp 2.4s ease-out infinite',
        pop: 'pop 0.34s cubic-bezier(0.22,1,0.36,1) both',
        slideOver: 'slideOver 0.3s cubic-bezier(0.22,1,0.36,1) both',
        confetti: 'confetti 1.2s ease-out forwards'
      }
    }
  },
  plugins: []
}
