import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f2",
          100: "#fde3e3",
          200: "#fbcaca",
          300: "#f7a6a6",
          400: "#ef7575",
          500: "#e04949",
          600: "#c92a2a",
          700: "#a20e0e",
          800: "#8a0303",
          900: "#6f0505",
        },
      },
      boxShadow: {
        float: "0 10px 30px -12px rgba(49, 140, 146, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
