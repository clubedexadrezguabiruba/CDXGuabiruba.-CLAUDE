import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
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
      },
      animation: {
        "scale-in": "scale-in 0.4s ease-out forwards",
        "item-shake": "item-shake 0.35s ease-in-out",
        "item-shatter": "item-shatter 0.55s ease-in forwards",
        "fragment-fly": "fragment-fly 0.7s ease-out forwards",
        "xp-reveal": "xp-reveal 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
