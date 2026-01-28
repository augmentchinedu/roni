// vite.config.js
import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { isToAuthenticate } from "./scripts";

const pkg = process.env.PACKAGE;
const username = process.env.USERNAME;
console.log(username, pkg);

const DIST_DIR = path.resolve("clients");
const outDir = path.join(DIST_DIR, pkg);

export default defineConfig(() => ({
  plugins: [vue(), UnoCSS()],
  root: path.resolve("."),
  define: {
    __PKG__: JSON.stringify(pkg),
    __USERNAME__: JSON.stringify(username),
  },
  server: {
    strictPort: true,
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      "package-pages": path.resolve(__dirname, `packages/${pkg}/pages`),
      "global-pages": path.resolve(__dirname, `pages`),
    },
  },
  publicDir: "public",
  build: {
    outDir,
    emptyOutDir: true,
  },
}));
