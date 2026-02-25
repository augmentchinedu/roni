import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'kernel/boot.js',
  output: {
    file: 'bundle.cjs',      // .cjs extension bypasses "type": "module"
    format: 'cjs',
    inlineDynamicImports: true,
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
  ],
  external: [
    'http', 'https', 'net', 'fs', 'path', 'os',
    'stream', 'crypto', 'buffer', 'events', 'util',
    'url', 'querystring', 'zlib', 'child_process',
  ],
};