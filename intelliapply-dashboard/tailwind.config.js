/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        // We add the Inter font family here for consistency across the app
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
        },
    },
  },
  plugins: [],
}
