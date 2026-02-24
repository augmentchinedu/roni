// rollup.config.mjs
export default {
  input: "index.js", // your entry file
  output: {
    file: "bundle.js", // the output file for SEA
    format: "esm", // keep it as ESM
    sourcemap: false,
  },
};
