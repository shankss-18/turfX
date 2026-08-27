/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        surface: {
          DEFAULT: '#f8f9fa',
          lowest: '#ffffff',
          low: '#f3f4f5',
          container: '#edeeef',
          high: '#e7e8e9',
          highest: '#e1e3e4',
        },
        'on-surface': {
          DEFAULT: '#191c1d',
          variant: '#464555',
        },
        outline: {
          DEFAULT: '#777587',
          variant: '#c7c4d8',
        },
        primary: {
          DEFAULT: '#3525cd',
          container: '#4f46e5',
          hover: '#2d1eb3',
          light: '#eef2ff',
          'on-container': '#dad7ff',
        },
        'on-primary': '#ffffff',
        secondary: {
          DEFAULT: '#006c49',
          container: '#6cf8bb',
          emerald: '#10b981',
          'on-container': '#00714d',
        },
        'on-secondary': '#ffffff',
        tertiary: {
          DEFAULT: '#684000',
          container: '#885500',
          orange: '#f97316',
          'on-container': '#ffd4a4',
        },
        'on-tertiary': '#ffffff',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        'on-error': '#ffffff',
      },
      fontFamily: {
        headline: ['Montserrat', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'surface-1': '0px 2px 4px rgba(0, 0, 0, 0.05)',
        'surface-2': '0px 10px 15px -3px rgba(0, 0, 0, 0.08), 0px 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'primary-glow': '0px 0px 0px 3px rgba(79, 70, 229, 0.25)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '12px',
        'DEFAULT': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
}
