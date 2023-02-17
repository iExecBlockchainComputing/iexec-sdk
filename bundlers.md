[< Back to quick-start](./docs/README.md#quick-start)

# Bundlers integration

- [parcel](#parcel)
- [webpack](#webpack)
- [create-react-app / react-scripts](#create-react-app)

## parcel

`parcel` auto-detects required NodeJS builtins and and automatically polyfills them, you should not need to do anything to add polyfills.

Package [`exports` map is not supported yet](https://github.com/parcel-bundler/parcel/pull/8807), therefor packages relying only on this mechanism will not be resolved.

To solve this you must provide resolution `alias` in your `package.json`

```json
{
  "alias": {
    "@multiformats/multiaddr": "@multiformats/multiaddr/dist/src/index.js"
  }
}
```

## webpack

`webpack` >= 5 no longer provides polyfills for NodeJS, you must include them in your configuration.

Here is the steps to follow:

- Install the following dev-dependencies:

```bash
npm i --save-dev assert buffer constants-browserify crypto-browserify process stream-browserify
```

- Configure `webpack.config.js`

```js
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    fallback: {
      assert: require.resolve('assert/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'), // required for crypto-browserify
      constants: require.resolve('constants-browserify'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
```

## create-react-app

`create-react-app` >= 5 which relies on `webpack` >= 5 requires to customize the configuration to include NodeJS polyfills.

Since `react-scripts` enforce the `webpack` configuration and ejecting is not an option, you will need to use `react-app-rewired` to override the configuration.

Here is the steps to follow:

- Install the following dev-dependencies:

```bash
npm install --save-dev react-app-rewired assert buffer constants-browserify crypto-browserify process stream-browserify
```

- Create the following `config-overrides.js` at the root of your project:

```js
const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    constants: require.resolve('constants-browserify'),
    assert: require.resolve('assert/'),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);
  return config;
};
```

- Use `react-app-rewired` instead of `react-scripts` in your `package.json` scripts:

```json
{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test",
    "eject": "react-scripts eject"
  }
}
```

[< Back to quick-start](./docs/README.md#quick-start)
