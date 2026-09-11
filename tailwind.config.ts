import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./engine/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cinema: {
          950: "#050608",
          900: "#090b0e",
          850: "#0f1217",
          800: "#151921",
          700: "#222733",
          600: "#363d4e",
          500: "#545e75",
          400: "#8692aa",
          300: "#b5bece",
          200: "#dde2eb",
          100: "#f3f5f8",
          gold: "#e5b869",
          amber: "#d97706",
          crimson: "#e11d48",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        screenplay: ["Courier Prime", "Courier New", "Courier", "monospace"],
        cinema: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      aspectRatio: {
        "cinema": "2.39 / 1",
        "widescreen": "16 / 9",
        "classic": "4 / 3",
      },
      animation: {
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
        "grain": "grain 8s steps(10) infinite",
        "fade-in": "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "letterbox-in": "letterboxIn 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "0.9" },
          "50%": { opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        letterboxIn: {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
