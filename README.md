![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK

[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows easy interactions with iExec decentralized marketplace in order to run off-chain computations.

## [Library](./docs/README.md)

The iExec javascript SDK can be imported in your frontend or backend JS project.

install

```sh
npm install iexec
```

import

```js
import { IExec } from 'iexec';
```

Check the [documentation](./docs/README.md)

## [CLI](./CLI.md)

The iExec SDK comes with a command line interface enabling interactions with the decentralized marketplace from a terminal.

install

```sh
npm install -g iexec

# check commands
iexec help
```

Check the [documentation](./CLI.md)

## Contributing

### Install

```sh
npm ci
npm run codegen
```

### Build

```sh
npm run build
```

### Test

Tests run on a local dockerized stack, the test stack must be started prior to running tests

```sh
# once before testing
npm run start-test-stack
```

> -After some times the test stack may become desynchronized, run `npm run start-test-stack` to refresh it.
>
> `npm run stop-test-stack` will teardown the test stack

Run tests when the stack is up

```sh
npm run test
```

> Some tests relies on RPC API providers, to have them running smoothly you can provide the following envs
>
> - ALCHEMY_API_KEY (obtained from <https://alchemy.com>)
> - ETHERSCAN_API_KEY (obtained from <https://etherscan.io>)
> - INFURA_PROJECT_ID (obtained from <https://infura.io>)

## Changelog

Find changes in the [CHANGELOG](./CHANGELOG.md)

## Resources

- [iExec main documentation](https://docs.iex.ec/for-developers/)
- [The iExec Explorer](https://explorer.iex.ec)
