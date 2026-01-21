import { defineConfig, mergeConfig } from "vite";
import rootConfig from "../../vite.config.js";
import path from "path";

export default mergeConfig(
  rootConfig,
  defineConfig({
    root: path.resolve("../../"),
    server: {
      port: Number(process.env.PORT),
      strictPort: true,
    },
  })
);
