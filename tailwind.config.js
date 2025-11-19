/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./components/wallet/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pilcrow Rounded"', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-light': 'var(--color-surface-light)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        separator: 'var(--color-separator)',
        neutral: {
          200: '#e5e5e5',
          300: '#d4d4d4',
          600: '#525252',
          700: '#404040',
          800: '#2c2c2e',
          900: '#1c1c1e',
        }
      },
      ringColor: {
        'primary': 'var(--color-primary)',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    }
  },
  plugins: [],
}