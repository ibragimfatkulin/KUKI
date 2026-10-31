import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F3",
        accent: "#F47B45",
        pine: "#294A3A",
        ink: "#242424",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      boxShadow: {
        card: "0 24px 70px rgba(41, 74, 58, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
