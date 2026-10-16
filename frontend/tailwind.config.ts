import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { navy: { 900: "#0B1B3A", 700: "#1E3358", 500: "#4B5B78" }, brand: { 50: "#ECFEFF", 500: "#0891B2", 600: "#0E7490", 700: "#155E75" } },
      boxShadow: { card: "0 1px 2px rgba(11,27,58,.06), 0 8px 24px rgba(11,27,58,.06)" },
    },
  },
  plugins: [],
};
export default config;
