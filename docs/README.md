iexec / [Exports](modules.md)

[< Back home](../README.md)

# iExec SDK Library API

[![Build Status](https://drone.iex.ec/api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE)

Use the iExec decentralized marketplace for off-chain computing in your dapp.

## Content

- [Install](#install)
- [Quick start](#quick-start)
- [API](#api)
  - [IExecModules](#iexecmodules)
  - [utils](#utils)
  - [errors](#errors)
- [Live demos](#live-demos)

---

# Install

Install iexec sdk

```bash
npm install iexec
```

---

# Quick start

## Front-end integration

```js
import { IExec } from 'iexec';

// connect injected provider
const iexec = new IExec({ ethProvider: window.ethereum });
```

[Read more about popular bundlers integration](../bundlers.md)

## Back-end integration

```js
import { IExec, utils } from 'iexec';

const { PRIVATE_KEY } = process.env;

const ethProvider = utils.getSignerFromPrivateKey(
  'http://localhost:8545', // blockchain node URL
  PRIVATE_KEY,
);
const iexec = new IExec({
  ethProvider,
});
```

---

# API

## IExecModules

IExec SDK is split into [IExecModule](./classes/IExecModule.md)s, each providing a set of methods relatives to a specific field.

Additionally the [IExec](./classes/IExec.md) module exposes all the following listed modules under the corresponding namespace.

- [IExecAccountModule](./classes/IExecAccountModule.md) exposes **account** methods
- [IExecAppModule](./classes/IExecAppModule.md) exposes **app** methods
- [IExecDatasetModule](./classes/IExecDatasetModule.md) exposes **dataset** methods
- [IExecDealModule](./classes/IExecDealModule.md) exposes **deal** methods
- [IExecENSModule](./classes/IExecENSModule.md) exposes **ENS** methods
- [IExecHubModule](./classes/IExecHubModule.md) exposes **hub** methods
- [IExecNetworkModule](./classes/IExecNetworkModule.md) exposes **network** methods
- [IExecOrderModule](./classes/IExecOrderModule.md) exposes **order** methods
- [IExecOrderbookModule](./classes/IExecOrderbookModule.md) exposes **orderbook** methods
- [IExecResultModule](./classes/IExecResultModule.md) exposes **result** methods
- [IExecSecretsModule](./classes/IExecSecretsModule.md) exposes **secrets** methods
- [IExecStorageModule](./classes/IExecStorageModule.md) exposes **storage** methods
- [IExecTaskModule](./classes/IExecTaskModule.md) exposes **task** methods
- [IExecWalletModule](./classes/IExecWalletModule.md) exposes **wallet** methods
- [IExecWorkerpoolModule](./classes/IExecWorkerpoolModule.md) exposes **workerpool** methods

### Imports

As your app won't probably use all the features, you may want to import only the modules you need.

Each module is available as an independent package under `iexec/MODULE_NAME` and is exported in the umbrella package.

_example:_

- import from module package

```js
import IExecWalletModule from 'iexec/IExecWalletModule';
```

- import from umbrella

```js
import { IExecWalletModule } from 'iexec';
```

### Usage

[IExecModule](./classes/IExecModule.md)s are instantiated with an [IExecConfig](./classes/IExecConfig.md) providing the configuration to access to a specific instance of the iExec platform.

Once created, an [IExecConfig](./classes/IExecConfig.md) can be shared with any [IExecModule](./classes/IExecModule.md).

_example:_

- standard usage

```js
import IExecConfig from 'iexec/IExecConfig';

import IExecWalletModule from 'iexec/IExecWalletModule';
import IExecAccountModule from 'iexec/IExecAccountModule';

// create the config once for the target iExec instance
const config = new IExecConfig({ ethProvider: window.ethereum });

// share it with all the modules
const wallet = IExecWalletModule.fromConfig(config);
const account = IExecAccountModule.fromConfig(config);
```

- reuse instantiated module configuration

```js
import IExecWalletModule from 'iexec/IExecWalletModule';
// some IExecModule instance
import iexecModule from './my-module';

// IExecModules expose their IExecConfig under config
const wallet = IExecWalletModule.fromConfig(iexecModule.config);
```

- quick instantiation (shorter but not recommended)

```js
import IExecWalletModule from 'iexec/IExecWalletModule';

// the IExecConfig step can be skipped
const wallet = new IExecWalletModule({ ethProvider: window.ethereum });
```

## utils

The [utils](./modules/utils.md) namespace exposes some utility methods.

_example_:

```js
import utils from 'iexec/utils';
```

Or

```js
import { utils } from 'iexec';
```

## errors

The [errors](./modules/errors.md) namespace exposes the errors thrown by the library, use them if you want specific error handling.

_example_:

```js
import errors from 'iexec/errors';
```

Or

```js
import { errors } from 'iexec';
```

---

# Live demos

- [Buy computation](https://codesandbox.io/p/github/iExecBlockchainComputing/iexec-sdk-sandbox-buy-computation/main?file=%252Fsrc%252Findex.js)
- [Deploy and sell application](https://codesandbox.io/p/github/iExecBlockchainComputing/iexec-sdk-sandbox-deploy-and-sell-application/main?file=%2Fsrc%2Findex.js)
- [Deploy and sell dataset](https://codesandbox.io/p/github/iExecBlockchainComputing/iexec-sdk-sandbox-deploy-and-sell-dataset/main?file=%2Fsrc%2Findex.js)

---

[< Back home](../README.md)
