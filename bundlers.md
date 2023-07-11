[< Back to quick-start](./docs/README.md#quick-start)

# Bundlers integration

- [parcel](#parcel)
- [rollup](#rollup)
- [vite](#vite)
- [webpack](#webpack)

## parcel

Supports of `exports` map is provided under a flag, therefor packages relying only on this mechanism will not be resolved unless the flag is activated.

To activate the `exports` map resolution you must add this configuration in your `package.json`

```json
{
  "@parcel/resolver-default": {
    "packageExports": true
  }
}
```

## rollup

`rollup` does not provides much auto-configuration, fortunately there are plugins to do what we need to achieve.

- commonjs interoperability => `@rollup/plugin-commonjs`
- modules resolution => `@rollup/plugin-node-resolve`

Here are the steps to follow:

- Install the following dev-dependencies:

```bash
npm i --save-dev @rollup/plugin-commonjs @rollup/plugin-node-resolve
```

- Configure `rollup.config.mjs`:

```js
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
```

## vite

Bundling `iexec` with `vite` should run out of the box.

## webpack

Bundling `iexec` with `webpack@5` should run out of the box.

[< Back to quick-start](./docs/README.md#quick-start)
