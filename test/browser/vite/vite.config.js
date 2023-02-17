/* eslint-disable import/no-extraneous-dependencies */
// esbuild plugins (dev)
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
// rollup plugins (build)
import inject from '@rollup/plugin-inject';

export default {
  resolve: {
    alias: {
      buffer: 'buffer/',
      assert: 'node_modules/assert/build/assert.js',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  build: {
    // sourcemap: true,
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'],
          process: ['process', 'browser'],
        }),
      ],
    },
  },
};
