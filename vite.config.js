import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

import { isToAuthenticate } from "./scripts";

const DIST_DIR = path.resolve("clients");

// Use env variable PROJECT to set output folder
const outDir = process.env.PROJECT
  ? path.join(DIST_DIR, JSON.parse(process.env.PROJECT).id)
  : path.join(DIST_DIR, "default");

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  root: path.resolve("."), // root is project root
  define: {
    PROJECT: JSON.parse(process.env.PROJECT) || { id: "default-app" },
    AUTH: isToAuthenticate(),
  },
  server: {
    strictPort: true,
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve("."),
    },
  },
  publicDir: "public",
  build: {
    outDir,
    emptyOutDir: true,
  },
}));
