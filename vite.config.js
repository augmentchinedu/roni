// vite.config.js
import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { isToAuthenticate } from "./scripts";

const DIST_DIR = path.resolve("clients");
const outDir = process.env.PROJECT
  ? path.join(DIST_DIR, JSON.parse(process.env.PROJECT).package)
  : path.join(DIST_DIR, "default");

export default defineConfig(() => ({
  plugins: [vue(), UnoCSS()],
  root: path.resolve("."),
  define: {
    PROJECT: JSON.parse(process.env.PROJECT) || { package: "default-app" },
    AUTH: isToAuthenticate(),
    "import.meta.env.PRODUCTION_GRAPHQL_ENDPOINT": JSON.stringify(
      process.env.PRODUCTION_GRAPHQL_ENDPOINT
    ),
    "import.meta.env.DEVELOPMENT_GRAPHQL_ENDPOINT": JSON.stringify(
      process.env.DEVELOPMENT_GRAPHQL_ENDPOINT
    ),
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
