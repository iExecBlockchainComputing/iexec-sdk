/* eslint-disable import/no-extraneous-dependencies */
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
  },
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs(),
  ],
};
