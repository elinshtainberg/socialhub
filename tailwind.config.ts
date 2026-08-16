import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Limestone environment — warm-neutral stone, not gray, not beige
        void: "#ECEAE6", deep: "#E4E1DC", ground: "#D8D4CE",
        surface: "#FEFDFB", lift: "#FAF9F7", raise: "#F5F3EF",
        // Typography — near-black with faint warmth
        "t-1": "#100F0C", "t-2": "#36342F", "t-3": "#5C5A54", "t-4": "#98948C",
        // Accent — warm near-black
        accent: "#36342F", "accent-soft": "#D8D4CE",
        // Legacy aliases
        warm: "#EAEAE8", "warm-2": "#E2E2E0",
        base: "#EAEAE8", card: "#FFFFFF", "card-hover": "#F4F4F2",
        border: "rgba(0,0,0,0.08)",
        brand: "#111110", "brand-light": "#383837",
        "t-primary": "#111110", "t-secondary": "#5E5E5C", "t-muted": "#9A9A98",
        cream: "#EAEAE8", ink: "#111110",
        // Semantic — color carries meaning
        soft: {
          urgent: "rgba(194,74,26,0.09)", urgentDark: "#C24A1A",
          green:  "rgba(26,102,54,0.09)",  greenDark:  "#1A6636",
          orange: "rgba(194,74,26,0.09)",  orangeDark: "#C24A1A",
          purple: "#E8E8E6", purpleDark: "#5E5E5C",
          pink:   "#EAEAE8", pinkDark:   "#9A9A98",
          blue:   "#E8E8E6", blueDark:   "#5E5E5C",
          gray:   "#E8E8E6", grayDark:   "#5E5E5C",
        },
      },
      borderRadius: { "3xl": "1.5rem", xl2: "1rem" },
      fontFamily: { sans: ["Heebo","Assistant","Arial","sans-serif"] },
      boxShadow: {
        float:      "0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        "float-sm": "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        soft:       "0 4px 20px rgba(0,0,0,0.10)",
        softer:     "0 2px 8px rgba(0,0,0,0.07)",
        card:       "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        "card-lg":  "0 4px 20px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.05)",
        accent:     "0 0 0 3px rgba(0,0,0,0.08)",
        btn:        "0 1px 3px rgba(0,0,0,0.24), 0 1px 1px rgba(0,0,0,0.14)",
        glow:       "0 0 20px rgba(0,0,0,0.10)",
        "glow-sm":  "0 0 10px rgba(0,0,0,0.08)",
        "glow-btn": "0 2px 8px rgba(0,0,0,0.22)",
        "day-sel":  "0 0 0 1px rgba(0,0,0,0.20)",
      },
    },
  },
  plugins: [],
};
export default config;
