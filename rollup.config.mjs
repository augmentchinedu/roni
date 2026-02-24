import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs',      // SEA blob must be CJS
    inlineDynamicImports: true,
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
  ],
  external: [           // Node built-ins — SEA provides these
    'http', 'https', 'net', 'fs', 'path', 'os',
    'stream', 'crypto', 'buffer', 'events', 'util',
    'url', 'querystring', 'zlib', 'child_process',
  ],
};