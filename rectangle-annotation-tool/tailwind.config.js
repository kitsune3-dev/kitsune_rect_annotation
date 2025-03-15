/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF50',
          hover: '#45a049',
        },
        secondary: {
          DEFAULT: '#757575',
          hover: '#616161',
        },
        danger: {
          DEFAULT: '#f44336',
          hover: '#d32f2f',
        },
        info: {
          DEFAULT: '#2196F3',
          hover: '#1976D2',
        },
      },
    },
  },
  plugins: [],
}