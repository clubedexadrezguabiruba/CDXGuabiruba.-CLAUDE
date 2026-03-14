import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "brand-cyan": "#00D4AA",
        "brand-teal": "#0A8F7F",
        "deep-navy": "#0F1A2E",
        "dark-base": "#060F18",
        "gold": "#C9A84C",
        "gold-light": "#E8D48B",
        "warm-stone": "#F5F0E8",
        "warm-ivory": "#FAF8F3",
      },
      fontFamily: {
        heading: ["var(--font-cinzel)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 212, 170, 0.15)",
        "glow-gold": "0 0 20px rgba(201, 168, 76, 0.15)",
      },
      keyframes: {
        "scale-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "item-shake": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "15%": { transform: "translateX(-6px) rotate(-2deg)" },
          "30%": { transform: "translateX(6px) rotate(2deg)" },
          "45%": { transform: "translateX(-5px) rotate(-1.5deg)" },
          "60%": { transform: "translateX(5px) rotate(1.5deg)" },
          "75%": { transform: "translateX(-3px) rotate(-1deg)" },
          "90%": { transform: "translateX(3px) rotate(1deg)" },
        },
        "item-shatter": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "30%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },
        "fragment-fly": {
          "0%": { transform: "translate(0,0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(var(--fx),var(--fy)) rotate(var(--fr))", opacity: "0" },
        },
        "xp-reveal": {
          "0%": { transform: "scale(0) translateY(20px)", opacity: "0" },
          "50%": { transform: "scale(1.12) translateY(-4px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "egg-tremble": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-3deg)" },
          "40%": { transform: "rotate(3deg)" },
          "60%": { transform: "rotate(-2deg)" },
          "80%": { transform: "rotate(2deg)" },
        },
        "egg-hatch-tremble": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "10%": { transform: "rotate(-5deg) scale(1.02)" },
          "20%": { transform: "rotate(5deg) scale(1.02)" },
          "30%": { transform: "rotate(-4deg) scale(1.01)" },
          "40%": { transform: "rotate(4deg) scale(1.01)" },
          "50%": { transform: "rotate(-3deg) scale(1)" },
          "60%": { transform: "rotate(3deg) scale(1)" },
          "70%": { transform: "rotate(-2deg) scale(1)" },
          "80%": { transform: "rotate(2deg) scale(1)" },
          "90%": { transform: "rotate(-1deg) scale(1)" },
        },
        "egg-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 4px rgba(251,191,36,0.3))" },
          "50%": { filter: "drop-shadow(0 0 16px rgba(251,191,36,0.7))" },
        },
      },
      animation: {
        "scale-in": "scale-in 0.4s ease-out forwards",
        "item-shake": "item-shake 0.35s ease-in-out",
        "item-shatter": "item-shatter 0.55s ease-in forwards",
        "fragment-fly": "fragment-fly 0.7s ease-out forwards",
        "xp-reveal": "xp-reveal 0.5s ease-out forwards",
        "egg-tremble": "egg-tremble 0.6s ease-in-out infinite",
        "egg-hatch-tremble": "egg-hatch-tremble 0.5s ease-in-out infinite",
        "egg-glow": "egg-glow 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
