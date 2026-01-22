import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const DIST_DIR = path.resolve("clients");

// Use env variable PROJECT to set output folder
const outDir = process.env.PROJECT
  ? path.join(DIST_DIR, process.env.PROJECT)
  : path.join(DIST_DIR, "default");

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  root: path.resolve("./"), // root is project root
  define: {
    __APP_NAME__: JSON.stringify(process.env.APP_NAME || "default-app"),
  },
  server: {
    strictPort: true,
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  publicDir: "public",
  build: {
    outDir,
    emptyOutDir: true,
  },
}));
