/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight navy palette
        midnight: {
          50: '#e8eef6',
          100: '#c5d2e3',
          200: '#98aece',
          300: '#6b89b8',
          400: '#4d6fa0',
          500: '#365685',
          600: '#2a4670',
          700: '#1f3556',
          800: '#152543',
          900: '#0d1a33',
          950: '#070f1f',
        },
        // Teal accent
        teal: {
          50: '#e6fbf7',
          100: '#b3f3e8',
          200: '#80ebd9',
          300: '#4de3ca',
          400: '#1adbaf',
          500: '#00b894',
          600: '#00997a',
          700: '#007a61',
          800: '#005b48',
          900: '#003c30',
        },
        // Violet accent
        violet: {
          50: '#f3eefe',
          100: '#e3d6fd',
          200: '#d3adfb',
          300: '#c084f8',
          400: '#a85bf0',
          500: '#8b35e3',
          600: '#7222c9',
          700: '#5a1aa0',
          800: '#421277',
          900: '#2b0a4e',
        },
        // Semantic colors
        success: '#00b894',
        warning: '#f0a020',
        danger: '#e23856',
        info: '#3b9dff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
