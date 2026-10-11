/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FAFAF7",
          dark: "#0B0F19",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F4F0",
          subtle: "#F8F8F5",
          dark: "#141A29",
          'dark-muted': "#1A2236",
          'dark-subtle': "#111624",
        },
        ink: {
          DEFAULT: "#20243A",
          light: "#3A3F58",
          muted: "#687386",
          faint: "#9DA6B8",
          dark: "#F3F4F6",
          'dark-muted': "#94A3B8",
          'dark-faint': "#64748B",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },
        lavender: {
          DEFAULT: "#E9DFFF",
          light: "#F4EFFF",
          dark: "#7C3AED",
        },
        mint: {
          DEFAULT: "#D5F3E6",
          light: "#EAF9F2",
          dark: "#059669",
        },
        sky: {
          DEFAULT: "#DCEEFF",
          light: "#EDF6FF",
          dark: "#0284C7",
        },
        peach: {
          DEFAULT: "#FFE4D6",
          light: "#FFF1EB",
          dark: "#EA580C",
        },
        border: {
          DEFAULT: "#E8EAF0",
          darker: "#D2D6E0",
          dark: "#263048",
          'dark-subtle': "#1E273D",
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(32, 36, 58, 0.05), 0 1px 4px -1px rgba(32, 36, 58, 0.03)',
        'card-hover': '0 12px 24px -6px rgba(32, 36, 58, 0.08), 0 4px 8px -2px rgba(32, 36, 58, 0.04)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'float': '0 20px 35px -8px rgba(32, 36, 58, 0.12), 0 8px 16px -4px rgba(32, 36, 58, 0.06)',
        'float-dark': '0 25px 40px -10px rgba(0, 0, 0, 0.65)',
        'modal': '0 25px 50px -12px rgba(32, 36, 58, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
