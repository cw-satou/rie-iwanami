import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: "#FDF0F3",
          100: "#F5D5DD",
          200: "#F0B8C8",
          300: "#E8A0B4",
          400: "#D48BA0",
          500: "#C76B8A",
          600: "#a04868",
          700: "#7a3050",
          800: "#5a2040",
          900: "#3a1228",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "sans-serif"],
      },
      maxWidth: {
        app: "430px",
      },
    },
  },
  plugins: [],
};
export default config;
