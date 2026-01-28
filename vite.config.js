// vite.config.js
import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { isToAuthenticate } from "./scripts";

const pkg = process.env.PACKAGE;
const username = process.env.USERNAME;

const DIST_DIR = path.resolve("clients");
const outDir = path.join(DIST_DIR, pkg);

export default defineConfig(() => ({
  plugins: [vue(), UnoCSS()],
  root: path.resolve("."),
  define: {
    define: {
      __PKG__: pkg,
      "import.meta.env.VITE_USERNAME": username,
      "import.meta.env.PRODUCTION_GRAPHQL_ENDPOINT": JSON.stringify(
        process.env.PRODUCTION_GRAPHQL_ENDPOINT
      ),
      "import.meta.env.DEVELOPMENT_GRAPHQL_ENDPOINT": JSON.stringify(
        process.env.DEVELOPMENT_GRAPHQL_ENDPOINT
      ),
    },
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
