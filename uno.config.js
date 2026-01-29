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

  /* ===============================
     GLOBAL BASE + RESET (CORRECT PLACE)
     =============================== */
  preflights: [
    {
      getCSS: () => `
        /* Reset browser defaults */
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        :root {
          /* Colors */
          --primary-50: #eef2ff;
          --primary-100: #e0e7ff;
          --primary-500: #6366f1;
          --primary-600: #4f46e5;
          --primary-700: #4338ca;

          --surface-0: #ffffff;
          --surface-50: #f9fafb;
          --surface-100: #f3f4f6;
          --surface-200: #e5e7eb;
          --surface-700: #374151;
          --surface-900: #111827;

          --text-color: #111827;
          --text-muted: #6b7280;
          --border-color: #e5e7eb;

          /* Radius */
          --radius-sm: 6px;
          --radius-md: 8px;

          /* Shadows */
          --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
          --shadow-md: 0 4px 12px rgba(0,0,0,.1);

          /* Font */
          --font-family: Inter, system-ui, sans-serif;
          font-size: 16px;      
        }

          
        html {
          -webkit-text-size-adjust: 100%;
        }
            
        body {
          font-family: var(--font-family);
          color: var(--text-color);
          background: var(--surface-0);
          font-family: system-ui, -apple-system, BlinkMacSystemFont,
                       "Segoe UI", Roboto, Inter, Arial, sans-serif;
          font-size: 1rem;          /* 16px */
          line-height: 1.5;
        }
      `,
    },
  ],

  /* ===============================
     PRIMEVUE-LIKE SEMANTIC CLASSES
     =============================== */
  shortcuts: {
    "p-button": `
      inline-flex items-center justify-center gap-2
      px-4 py-2
      rounded-[var(--radius-md)]
      font-medium
      transition
      bg-[var(--primary-600)]
      text-white
      hover:bg-[var(--primary-700)]
      shadow-[var(--shadow-sm)]
    `,

    "p-button-secondary": `
      bg-[var(--surface-100)]
      text-[var(--text-color)]
      hover:bg-[var(--surface-200)]
    `,

    "p-card": `
      bg-[var(--surface-0)]
      rounded-[var(--radius-md)]
      shadow-[var(--shadow-md)]
      p-4
    `,

    "p-input": `
      w-full
      px-3 py-2
      border border-[var(--border-color)]
      rounded-[var(--radius-sm)]
      focus:outline-none
      focus:border-[var(--primary-600)]
    `,
  },
});
