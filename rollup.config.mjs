import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'kernel/boot.js',
  output: {
    file: 'bundle.cjs',
    format: 'cjs',
    inlineDynamicImports: true,
    exports: 'none',
    banner: '/* Roni OS kernel bundle */',
    // Rewrite node: protocol imports → bare requires (CJS compat)
    paths: {
      'node:fs': 'fs', 'node:fs/promises': 'fs/promises',
      'node:path': 'path', 'node:os': 'os', 'node:http': 'http',
      'node:https': 'https', 'node:net': 'net', 'node:stream': 'stream',
      'node:events': 'events', 'node:crypto': 'crypto',
      'node:buffer': 'buffer', 'node:util': 'util', 'node:url': 'url',
      'node:child_process': 'child_process', 'node:process': 'process',
      'node:worker_threads': 'worker_threads', 'node:assert': 'assert',
      'node:zlib': 'zlib', 'node:querystring': 'querystring',
    },
  },

  // Node built-ins only — everything else (ws, etc.) gets bundled in
  external: [
    /^node:/,
    'fs', 'fs/promises', 'path', 'os', 'http', 'https', 'net',
    'stream', 'events', 'crypto', 'buffer', 'util', 'url',
    'child_process', 'process', 'worker_threads', 'assert',
    'zlib', 'querystring', 'tls', 'dns', 'readline', 'tty',
    'v8', 'vm', 'perf_hooks', 'inspector', 'module',
  ],

  plugins: [
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node', 'require', 'default'],
    }),
    commonjs({
      ignoreDynamicRequires: true,
    }),
    json(),
  ],

  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'EVAL') return;
    if (warning.message?.includes('bufferutil')) return;
    if (warning.message?.includes('utf-8-validate')) return;
    warn(warning);
  },
};
