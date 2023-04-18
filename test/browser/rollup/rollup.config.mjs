/* eslint-disable import/no-extraneous-dependencies */
import inject from '@rollup/plugin-inject';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
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
    commonjs(), // after @rollup/plugin-node-resolve
    nodePolyfills(),
    inject({
      Buffer: ['buffer', 'Buffer'],
      process: ['process', 'browser'],
    }),
  ],
};
