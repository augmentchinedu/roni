import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// ── Compositor embed plugin ───────────────────────────────────────────────────
// Intercepts the virtual module 'roni:compositor' and returns all files
// from compositor/dist/ as a hardcoded Buffer map — no fs access at runtime.

function compositorEmbedPlugin() {
  const VIRTUAL_ID = "roni:compositor";

  function walk(dir, files = []) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, files);
      else files.push(full);
    }
    return files;
  }

  return {
    name: "roni-compositor-embed",

    resolveId(id) {
      if (id === VIRTUAL_ID) return "\0" + VIRTUAL_ID;
      return null;
    },

    load(id) {
      if (id !== "\0" + VIRTUAL_ID) return null;

      const distDir = join(process.cwd(), "compositor", "dist");

      // Dev mode / missing dist — return empty map, server falls back to disk
      try {
        statSync(distDir);
      } catch {
        console.warn("[embed] compositor/dist not found — embedding empty map");
        return "export const compositorFiles = null;";
      }

      const files = walk(distDir);
      if (files.length === 0) {
        console.warn("[embed] compositor/dist is empty");
        return "export const compositorFiles = null;";
      }

      const entries = files.map((f) => {
        const rel = "/" + relative(distDir, f).replace(/\\/g, "/");
        const data = readFileSync(f).toString("base64");
        return `  ${JSON.stringify(rel)}: Buffer.from(${JSON.stringify(
          data
        )}, 'base64')`;
      });

      console.log(`[embed] Embedded ${files.length} compositor files`);

      return [
        "export const compositorFiles = {",
        entries.join(",\n"),
        "};",
      ].join("\n");
    },
  };
}

// ── Rollup config ─────────────────────────────────────────────────────────────

export default {
  input: "kernel/boot.js",
  output: {
    file: "bundle.cjs",
    format: "cjs",
    inlineDynamicImports: true,
    exports: "none",
    banner: "/* Roni OS kernel bundle */",
    paths: {
      "node:fs": "fs",
      "node:fs/promises": "fs/promises",
      "node:path": "path",
      "node:os": "os",
      "node:http": "http",
      "node:https": "https",
      "node:net": "net",
      "node:stream": "stream",
      "node:events": "events",
      "node:crypto": "crypto",
      "node:buffer": "buffer",
      "node:util": "util",
      "node:url": "url",
      "node:child_process": "child_process",
      "node:process": "process",
      "node:worker_threads": "worker_threads",
      "node:assert": "assert",
      "node:zlib": "zlib",
      "node:querystring": "querystring",
    },
  },

  external: [
    /^node:/,
    "fs",
    "fs/promises",
    "path",
    "os",
    "http",
    "https",
    "net",
    "stream",
    "events",
    "crypto",
    "buffer",
    "util",
    "url",
    "child_process",
    "process",
    "worker_threads",
    "assert",
    "zlib",
    "querystring",
    "tls",
    "dns",
    "readline",
    "tty",
    "v8",
    "vm",
    "perf_hooks",
    "inspector",
    "module",
    "node-systray",
  ],

  plugins: [
    compositorEmbedPlugin(),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ["node", "require", "default"],
    }),
    commonjs({ ignoreDynamicRequires: true }),
    json(),
  ],

  onwarn(warning, warn) {
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    if (warning.code === "THIS_IS_UNDEFINED") return;
    if (warning.code === "EVAL") return;
    if (warning.message?.includes("bufferutil")) return;
    if (warning.message?.includes("utf-8-validate")) return;
    warn(warning);
  },
};
