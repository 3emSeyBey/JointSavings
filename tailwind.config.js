/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '380px',
      },
      minHeight: {
        dvh: '100dvh',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'in': 'fadeIn 0.2s ease-out',
        'slide-in-from-bottom-4': 'slideInFromBottom 0.3s ease-out',
        'slide-in-from-right-4': 'slideInFromRight 0.3s ease-out',
        'zoom-in-95': 'zoomIn 0.2s ease-out',
        'orb-drift': 'orb-drift 28s ease-in-out infinite',
        'orb-drift-reverse': 'orb-drift-reverse 22s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
        'grid-pan': 'grid-pan 60s linear infinite',
        grain: 'grain 0.4s steps(4) infinite',
        'star-twinkle': 'star-twinkle 3s ease-in-out infinite',
        'star-twinkle-slow': 'star-twinkle 6s ease-in-out infinite',
        'shooting-star': 'shooting-star 2.4s ease-out infinite',
        'dog-trot': 'dog-trot 26s linear infinite',
        'dog-trot-reverse': 'dog-trot-reverse 32s linear infinite',
        'float-drift': 'float-drift 14s ease-in-out infinite',
        'float-drift-alt': 'float-drift-alt 11s ease-in-out infinite',
        'paw-fade': 'paw-fade 2.5s ease-in-out infinite',
      },
      keyframes: {
        'orb-drift': {
          '0%, 100%': { transform: 'translate(0,0) rotate(0deg)' },
          '33%': { transform: 'translate(8%, -4%) rotate(120deg)' },
          '66%': { transform: 'translate(-6%, 6%) rotate(240deg)' },
        },
        'orb-drift-reverse': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-10%, -8%) scale(1.08)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.15', transform: 'translate(-50%,-50%) scale(1)' },
          '50%': { opacity: '0.28', transform: 'translate(-50%,-50%) scale(1.06)' },
        },
        'grid-pan': {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '48px 48px, 48px 48px' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '25%': { transform: 'translate(-1%,1%)' },
          '50%': { transform: 'translate(1%,-1%)' },
          '75%': { transform: 'translate(-1%,-1%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'star-twinkle': {
          '0%, 100%': { opacity: '0.12', transform: 'scale(0.65)' },
          '50%': { opacity: '0.95', transform: 'scale(1.15)' },
        },
        'shooting-star': {
          '0%': { opacity: '0', transform: 'translate(0, 0) scaleX(0.2)' },
          '12%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translate(180px, 140px) scaleX(1)' },
        },
        'dog-trot': {
          '0%': { transform: 'translateX(-15vw) translateY(0)' },
          '100%': { transform: 'translateX(115vw) translateY(0)' },
        },
        'dog-trot-reverse': {
          '0%': { transform: 'translateX(115vw) translateY(0)' },
          '100%': { transform: 'translateX(-15vw) translateY(0)' },
        },
        'float-drift': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(-6deg)' },
          '33%': { transform: 'translate(8px, -14px) rotate(4deg)' },
          '66%': { transform: 'translate(-6px, 6px) rotate(-3deg)' },
        },
        'float-drift-alt': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(5deg)' },
          '50%': { transform: 'translate(-10px, -18px) rotate(-5deg)' },
        },
        'paw-fade': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.9)' },
          '50%': { opacity: '0.55', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

