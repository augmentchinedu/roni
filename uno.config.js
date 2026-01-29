import { defineConfig } from "unocss";
import presetWind4 from "@unocss/preset-wind4";
import presetIcons from "@unocss/preset-icons";
import presetAttributify from "@unocss/preset-attributify";

export default defineConfig({
  presets: [
    presetWind4({
      preflight: true,
    }),
    presetIcons(),
    presetAttributify(),
  ],
  theme: {
    fontSize: {
      xs: "clamp(0.7rem, 0.65rem + 0.2vw, 0.8rem)",
      sm: "clamp(0.85rem, 0.8rem + 0.3vw, 0.95rem)",
      base: "clamp(1rem, 0.95rem + 0.4vw, 1.15rem)",

      lg: "clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem)",
      xl: "clamp(1.5rem, 1.3rem + 1vw, 1.875rem)",
      "2xl": "clamp(1.875rem, 1.6rem + 1.5vw, 2.4rem)",
      "3xl": "clamp(2.25rem, 2rem + 2vw, 3rem)",
      "4xl": "clamp(2.75rem, 2.3rem + 3vw, 3.75rem)",
    },
  },
  /* ===============================
     GLOBAL BASE + RESET (CORRECT PLACE)
     =============================== */
  preflights: [
    {
      getCSS: () => `
    
          
      `,
    },
  ],
});
