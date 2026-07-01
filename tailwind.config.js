/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f4ff",
          100: "#eee9ff",
          200: "#ded4ff",
          300: "#c4b3fe",
          400: "#a688fb",
          500: "#8b5cf6",
          600: "#7638e0",
          700: "#6229bb",
          800: "#502398",
          900: "#42217a",
        },
      },
      fontFamily: {
        display: ["'Quicksand'", "system-ui", "sans-serif"],
        body: ["'Be Vietnam Pro'", "system-ui", "sans-serif"],
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
