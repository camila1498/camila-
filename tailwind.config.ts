import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        violeta: "var(--violeta)",
        "violeta-deep": "var(--violeta-deep)",
        amarillo: "var(--amarillo)",
        magenta: "var(--magenta)",
        lavanda: "var(--lavanda)",
        ink: "var(--ink)",
        paper: "var(--paper)",
      },
      fontFamily: {
        display: ["var(--font-museo)", "cursive"],
        sans: ["var(--font-be-vietnam)", "sans-serif"],
      },
      maxWidth: {
        wrap: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
