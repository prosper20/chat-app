/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          600: '#27BBA5',
        },
      },
    },
  },
  plugins: [],
  darkMode: "class"
}

