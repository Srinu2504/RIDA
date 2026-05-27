import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          bg: "#f2ede3",
          surface: "#faf6ef",
          border: "#e0d8c8",
          divider: "#ece5d8",
          input: "#f2ede3",
        },
        green: {
          primary: "#2d6a4f",
          light: "#d8ede0",
          pale: "#eaf2ec",
          muted: "#6b8c75",
        },
        text: {
          dark: "#1a2e1e",
          mid: "#3a3028",
          muted: "#a09070",
          faint: "#b8a888",
        },
        accent: {
          amber: "#f9a825",
        },
        /* legacy aliases for shadcn components */
        primary: "#2d6a4f",
        background: "#f2ede3",
        surface: "#faf6ef",
        foreground: "#1a2e1e",
        border: "#e0d8c8",
        input: "#f2ede3",
        ring: "#2d6a4f",
        muted: {
          DEFAULT: "#ece5d8",
          foreground: "#a09070",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        pill: "20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
