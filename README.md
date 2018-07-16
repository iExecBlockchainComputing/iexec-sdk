![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK V2

[![Build Status](https://drone.iex.ec//api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows developers to interact with iExec decentralized marketplace in order to run off-chain computations.

## Ressources

- The iExec Dapp Store: https://dapps.iex.ec
- The iExec Marketplace: https://market.iex.ec
- The iExec Explorer: https://explorer.iex.ec
- The iExec Pools registry: https://pools.iex.ec
- The RLC faucet: https://faucet.iex.ec
- iExec main documentation: https://docs.iex.ec
- The iExec [JS smart contracts client lib](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) to interact with iExec smart contracts (without the SDK)
- The iExec [JS client lib](https://github.com/iExecBlockchainComputing/iexec-server-js-client) to interact with iExec server (without the SDK)
- [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry), to apply for Dapp Store listing

## Install

All three major OS are supported (linux, OSX, windows).

#### Using Nodejs

Requirements: [![npm version](https://img.shields.io/badge/nodejs-%3E=%206.4.0-brightgreen.svg)](https://nodejs.org/en/) and [Git](https://git-scm.com/).

```bash
npm -g install iexec # install the cli
iexec --version
iexec --help
```

#### Using Docker

Requirements: [Docker](https://docs.docker.com/install/).

```bash
# For Linux users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v $(pwd):/iexec-project -w /iexec-project iexechub/iexec-sdk'"'"'' >> ~/.bashrc && source ~/.bashrc
# For Mac OSX users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v $(pwd):/iexec-project -w /iexec-project iexechub/iexec-sdk'"'"'' >> ~/.bash_profile && source ~/.bash_profile
```

Now run `iexec --version` to check all is working.

## Upgrade

- **Nodejs**: run `npm -g install iexec`
- **Docker**: run `docker pull iexechub/iexec-sdk`

# Tutorials

## Video

- SDK Video series link: https://goo.gl/1AfnSH
- Init project video: https://www.youtube.com/watch?v=afBIv-84C9U
- Deploy app video: https://www.youtube.com/watch?v=EltDUaYU8lQ
- Buy market order and trigger a work video: https://www.youtube.com/watch?v=x7Sy8PcGcMg

## Katacoda

Katacoda is an in-browser terminal that allows you to remotely follow tutorials without the need to install the SDK on your machine: https://www.katacoda.com/sulliwane/scenarios/sdk-v2-tutorial

## Text

### Init project

required steps before following any other workflow.

```bash
iexec init # create all required files
iexec wallet getETH # ask faucet for ETH
iexec wallet getRLC # ask iExec faucet for RLC
iexec account deposit 200 # deposit RLC on your iExec account, so you can buy orders
iexec wallet show
iexec account show
```

### Deploy an app

```bash
iexec app count # check if you have already deployed apps
iexec app init # reset app fields in iexec.json
iexec app deploy # deploy app on Ethereum
iexec app show # show details of deployed app
```

### Buy & Run work using Marketplace

```bash
iexec order init --buy # init work order fields in iexec.json
vi iexec.json # edit iexec.json and customize the buy order fields. Particularly work params field.
iexec orderbook show --category 5 # show orderbook and choose an order ID
iexec order fill <orderID> # fill order using its ID
iexec work show --watch --download # watch progress of the submitted work, and download its result when completed
```

# iExec SDK CLI API

## Help

```bash
iexec --help
iexec --version
```

## init

```bash
iexec init # create all files necessary to get started
```

## wallet

```bash
# OPTIONS
# --chain <chainName>
# --to <address>
# --force
# --hub <address>
# --password <password>
iexec wallet create
iexec wallet getETH
iexec wallet getRLC
iexec wallet show [address] # optional address to show other people's wallet
iexec wallet sendETH <amount> --to <eth_address>
iexec wallet sendRLC <amount> --to <eth_address>
iexec wallet sweep --to <eth_address> # drain all ETH and RLC, sending them back to iExec faucet by default
iexec wallet encrypt --password <password> # save encrypted-wallet.json from wallet.json
iexec wallet decrypt --password <password> # save wallet.json from encrypted-wallet.json
```

## account

```bash
# OPTIONS
# --chain <chainName>
# --force
# --hub <address>
iexec account login
iexec account show [address] # optional address to show other people's account
iexec account deposit <amount>
iexec account withdraw <amount>
```

## app

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --user <address>
iexec app init # init new app
iexec app deploy # deploy new app
iexec app show [address|index] # show app details
iexec app count --user <userAddress> # count user total number of app
```

## dataset

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --user <address>
iexec dataset init # init new app
iexec dataset deploy # deploy new dataset
iexec dataset show [address|index] # show dataset details
iexec dataset count --user <userAddress> # count user total number of dataset
```

## workerpool

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --user <address>
iexec workerpool init # init new workerpool
iexec workerpool deploy # deploy new workerpool
iexec workerpool show [address|index] # show workerpool details
iexec workerpool count --user <userAddress> # count user total number of workerpool
```

## orderbook

```bash
# OPTIONS
# --chain <chainName>
# --category [ID]
# --pool [address]
iexec orderbook show --category 5 # show orderbook for category 5
```

## order

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --sell
# --buy
# --force
iexec order init --buy # init new buy order
iexec order init --sell # init new sell order
iexec order place # place an order at limit price
iexec order show <orderID> # show an order
iexec order fill <orderID> # fill an order at market price and start work execution
iexec order cancel <orderID> # cancel an order
iexec order count # count marketplace total number of order
```

## work

```bash
# OPTIONS
# --chain <chainName>
# --watch
# --download [fileName]
iexec work show [address] --watch --download # show a work, watch its status changes and download it when completed
```

## category

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
iexec category init # init new category
iexec category create # create new category
iexec category show <index> # show category details by index
iexec category count # count hub total number of category
```

## upgrade

```bash
iexec upgrade # check if using latest iExec SDK version
```

## scheduler

```bash
iexec scheduler show # show scheduler details
iexec scheduler api # direct call of scheduler API methods
```

## iexec.json

The `iexec.json` file, located in every iExec project, describes the parameters used when creating a [app|datasetcategory|workerPool], or when submitting a work.

```json
{
  "app": {
    "name": "next-dapp1",
    "price": 1,
    "params": {
      "type": "DOCKER",
      "envvars": "XWDOCKERIMAGE=ericro/face-recognition"
    }
  },
  "dataset": {
    "name": "next-dataset",
    "price": 2,
    "params": {
      "uri": "https://data.provider.com"
    }
  },
  "category": {
    "name": "CAT1",
    "description": "my category N°1",
    "workClockTimeRef": 100
  },
  "workerPool": {
    "description": "Qarnot WorkerPool ",
    "subscriptionLockStakePolicy": 100,
    "subscriptionMinimumStakePolicy": 100,
    "subscriptionMinimumScorePolicy": 100
  }
}
```

## chains.json

The `chains.json` file, located in every iExec project, describes the parameters used when communicating with ethereum nodes and iExec schedulers. They are ordered by chain name, accessible by using the `--chain <chainName>` option for each command of the SDK.

```json
{
  "chains": {
    "development": {
      "host": "localhost",
      "id": "*",
      "server": "https://localhost:443"
    },
    "ropsten": {
      "host": "https://ropsten.infura.io/berv5GTB5cSdOJPPnqOq",
      "id": "3",
      "server": "https://testxw.iex.ec:443"
    },
    "rinkeby": {
      "host": "https://rinkeby.infura.io/berv5GTB5cSdOJPPnqOq",
      "id": "4",
      "server": "https://testxw.iex.ec:443"
    },
    "kovan": {
      "host": "https://kovan.infura.io/berv5GTB5cSdOJPPnqOq",
      "id": "42",
      "server": "https://testxw.iex.ec:443"
    },
    "mainnet": {
      "host": "https://mainnet.infura.io/berv5GTB5cSdOJPPnqOq ",
      "id": "1",
      "server": "https://mainxw.iex.ec:443"
    }
  }
}
```

# iExec Library API

[Work In Progress] Although we'll try to avoid any API change, the Lib API may still evolve a little bit based on beta-tester feedbacks.

iExec SDK can be imported in your code as a library/module, and it's compatible with old JS engines:

- \>= Node v6.4
- \>= Firefox v22
- \>= Chrome v28
- \>= IE 9

## Methods

- [iexec.wallet.checkBalances](#walletcheckbalances)
- [iexec.wallet.getETH](#walletgeteth)
- [iexec.wallet.getRLC](#walletgetrlc)
- [iexec.wallet.sendETH](#walletsendeth)
- [iexec.wallet.sendRLC](#walletsendrlc)
- [iexec.account.auth](#accountauth)
- [iexec.account.deposit](#accountdeposit)
- [iexec.account.withdraw](#accountwithdraw)
- [iexec.hub.createObj](#hubcreateobj)
- [iexec.hub.showObj](#hubshowobj)
- [iexec.hub.countObj](#hubcountobj)

### wallet.checkBalances

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `address` **String** the address to check balances on
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `balances` **Object**
  - `balances.wei` **BN** ether balance in wei
  - `balances.nRLC` **BN** RLC balance in nano RLC

**Example**

```js
// wallet.checkBalances
```

### wallet.getETH

**Parameters**

- `chainName` **String** name of the chain (ropsten|rinkeby|kovan)
- `address` **String** the address to ask ETH for

**Return** (Promise)

- `responses` **Array of String** String response from each faucet api

**Example**

```js
// wallet.getETH
```

### wallet.getRLC

**Parameters**

- `chainName` **String** name of the chain (ropsten|rinkeby|kovan)
- `address` **String** the address to ask ETH for

**Return** (Promise)

- `responses` **Array of String** String response from each faucet api

**Example**

```js
// wallet.getRLC
```

### wallet.sendETH

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `amouont` **String** the amount of nano RLC to send to
- `from` **String** the address the is sending ETH
- `to` **String** the address that is receiving the amount of ETH

**Return** (Promise)

- `txReceipt` **Object** the ethereum transaction receipt

**Example**

```js
// wallet.sendETH
```

### wallet.sendRLC

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `amount` **String** the amount of nano RLC to send to
- `to` **String** the address that will receive the amount of nRLC
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `txReceipt` **Object** the ethereum transaction receipt

**Example**

```js
// wallet.sendRLC
```

### account.auth

**Parameters**

- `amount` **String** the amount of nano RLC to send to
- `scheduler` **Object** an [iexec scheduler](https://github.com/iExecBlockchainComputing/iexec-server-js-client) object
- `ethjs` **Object** [Ethjs](https://github.com/ethjs/ethjs) client

**Return** (Promise)

- `jwtoken` **String** the iExec jwt token

**Example**

```js
// account.auth
```

### account.deposit

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `amount` **String** the amount of nano RLC to deposit in iExec account
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `txReceipt` **Object** the ethereum transaction receipt

**Example**

```js
// account.deposit
```

### account.withdraw

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `amount` **String** the amount of nano RLC to deposit in iExec account
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `txReceipt` **Object** the ethereum transaction receipt

**Example**

```js
// wallet.withdraw
```

### hub.createObj

**Parameters**

- `objName` **String** the object type name (app|workerPool|dataset)

**Return** Below Function:

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `obj` **Object** the object to create
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `events` **Object** the decoded logs from the transaction receipt

**Example**

```js
// hub.createObj
```

### hub.showObj

**Parameters**

- `objName` **String** the object type name (app|workerPool|dataset)

**Return** Below Function:

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `objAdressOrIndex` **String** the object address or index
- `userAddress` **String** the user address to query for
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `obj` **Object** All the properties of the object

**Example**

```js
// hub.showObj
```

### hub.countObj

**Parameters**

- `objName` **String** the object type name (app|workerPool|dataset)

**Return** Below Function:

**Parameters**

- `contracts` **Object** an [iexec contracts](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) object
- `userAddress` **String** the user address to query for
- `options` **Object** [optional] options
  - `options.hub` **String** custom hub address

**Return** (Promise)

- `objCount` **BN** The total count of object

**Example**

```js
// hub.countObj
```
