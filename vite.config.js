// vite.config.js
import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { isToAuthenticate } from "./scripts";

const DIST_DIR = path.resolve("clients");
const outDir = process.env.PROJECT
  ? path.join(DIST_DIR, JSON.parse(process.env.PROJECT).id)
  : path.join(DIST_DIR, "default");

export default defineConfig(() => ({
  plugins: [vue(), UnoCSS()],
  root: path.resolve("."),
  define: {
    PROJECT: JSON.parse(process.env.PROJECT) || { id: "default-app" },
    AUTH: isToAuthenticate(),
  },
  server: {
    strictPort: true,
    port: Number(process.env.PORT) || 5173,
    proxy: {
      "/graphql": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Proxying GraphQL request:", req.method, req.url);
          });
        },
      },
    },
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
