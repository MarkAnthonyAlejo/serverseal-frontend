/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0a0a",
        surface: "#111111",
        subtle: "#2a2a2a",
        "accent-primary": "#e8ff00",
        "accent-burn": "#ff4c00",
        "text-primary": "#f0f0f0",
        "text-muted": "#666666",
        "status-ok": "#00ff88",
        "status-warn": "#ff9900",
        "status-danger": "#ff3333",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "cursive"],
        mono: ['"IBM Plex Mono"', "monospace"],
        sans: ['"IBM Plex Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
