import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "kernel/boot.js",
  output: {
    file: "bundle.cjs",
    format: "cjs",
    inlineDynamicImports: true,
    exports: "none",
    banner: "/* Roni OS kernel bundle */",
  },
  plugins: [
    nodeResolve({ preferBuiltins: true, exportConditions: ["node"] }),
    commonjs(),
    json(),
  ],
  external: [/^node:/, "ws", "@puppeteer/browsers"],
  onwarn(warning, warn) {
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    if (warning.code === "THIS_IS_UNDEFINED") return;
    warn(warning);
  },
};
