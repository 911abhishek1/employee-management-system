/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf6ef',
          100: '#cfe9da',
          200: '#a3d4b7',
          300: '#6fba91',
          400: '#3f9d6d',
          500: '#1f7f52',
          600: '#0f6b43',
          700: '#00693E',
          800: '#054f31',
          900: '#033a24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
