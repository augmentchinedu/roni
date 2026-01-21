import path from "path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { init } from "./core";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), init()],
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
});
