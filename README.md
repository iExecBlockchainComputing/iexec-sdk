![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK V3

[![Build Status](https://drone.iex.ec//api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows easy interactions with iExec decentralized marketplace in order to run off-chain computations.

## Resources

- The iExec Dapp Store: https://dapps.iex.ec
- The iExec Marketplace: https://market.iex.ec
- The iExec Explorer: https://explorer.iex.ec
- The iExec Workerpool registry: https://pools.iex.ec
- The RLC faucet: https://faucet.iex.ec
- iExec main documentation: https://docs.iex.ec
- The iExec [JS smart contracts client lib](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) to interact with iExec smart contracts (without the SDK)
- [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry), to apply for Dapp Store listing

## Install

All three major OS are supported (linux, OSX, windows).

#### Using Nodejs

Requirements: [![npm version](https://img.shields.io/badge/nodejs-%3E=%208.0.0-brightgreen.svg)](https://nodejs.org/en/) and [Git](https://git-scm.com/).

```bash
npm -g install iexec # install the cli
iexec --version
iexec --help
```

#### Using Docker

Requirements: [Docker](https://docs.docker.com/install/).

```bash
# For Linux users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v /tmp:/tmp -v $(pwd):/iexec-project -v /home/$(whoami)/.ethereum/keystore:/home/node/.ethereum/keystore -w /iexec-project iexechub/iexec-sdk:next'"'"'' >> ~/.bash_aliases && source ~/.bashrc
# For Mac OSX users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v /tmp:/tmp -v $(pwd):/iexec-project -v /Users/$(whoami)/Library/Ethereum/keystore:/home/node/.ethereum/keystore -w /iexec-project iexechub/iexec-sdk:next'"'"'' >> ~/.bash_profile && source ~/.bash_profile
```

Now run `iexec --version` to check all is working.

## Upgrade

- **Nodejs**: run `npm -g install iexec`
- **Docker**: run `docker pull iexechub/iexec-sdk`

# Tutorials

### Init project

required steps before following any other workflow.

```bash
iexec init # create all required files
```

**You may get this error:**

```bash
failed with Error: Hub address missing
```

Simply edit `chain.json` file to set the `hub` address:

```json
"kovan": {
  "host": "http://localhost:8545/",
  "id": "42",
  "hub": "0x36D32A8b943D7a9BB797D250970C6961CEB4afFa"
},
```

**Here are the last deployed hub address:**

- kovan (PoCo v3.0.26): `"hub": "0x36D32A8b943D7a9BB797D250970C6961CEB4afFa"`

```
iexec wallet getETH # ask faucet for ETH, this may require manual action
iexec wallet getRLC # ask iExec faucet for RLC
iexec wallet show
```

### SDK CLI for Dapp developpers

First go through [Init project](#init-project)

#### Deploy an app

```bash
iexec app count # check if you have already deployed apps
iexec app init # reset app fields in iexec.json
iexec app deploy # deploy app on Ethereum and get an address
iexec app show # show details of deployed app
```

#### Sell your app on the Marketplace

```bash
iexec orderbook app <address> # check if you have valid sell orders for your app on the marketplace
iexec order init --app # reset apporder fields in iexec.json
iexec order sign --app # sign your apporder
iexec order publish --app # publish your apporder on the marketplace and get an orderHash
iexec order show --app [orderHash] # show your order on the Marketplace
iexec order cancel --app <orderHash> # cancel your order
```

### SDK CLI for Dataset providers

First go through [Init project](#init-project)

#### Deploy a dataset

```bash
iexec dataset count # check if you have already deployed datasets
iexec dataset init # reset dataset fields in iexec.json
iexec dataset deploy # deploy dataset on Ethereum
iexec dataset show # show details of deployed dataset
```

#### Sell your dataset on the Marketplace

```bash
iexec orderbook dataset <address> # check if you have valid sell orders for your dataset on the marketplace
iexec order init --dataset # reset datasetorder fields in iexec.json
iexec order sign --dataset # sign your datasetorder
iexec order publish --dataset #publish your datasetorder on the marketplace and get an orderHash
iexec order show --dataset [orderHash] # show your order on the Marketplace
iexec order cancel --dataset <orderHash> # cancel your order
```

### SDK CLI for Workerpools

First go through [Init project](#init-project)

#### Deploy a workerpool

```bash
iexec workerpool count # check if you have already deployed workerpools
iexec workerpool init # reset workerpool fields in iexec.json
iexec workerpool deploy # deploy workerpool on Ethereum
iexec workerpool show # show details of deployed workerpool
```

#### Sell your computing power at limit price on the Marketplace

```bash
iexec orderbook workerpool [address] --category <id> # check if you have valid sell orders for your workerpool on the marketplace
iexec order init --workerpool # reset workerpoolorder fields in iexec.json
iexec order sign --workerpool # sign your workerpoolorder
iexec order publish --workerpool # publish your workerpoolorder on the marketplace and get an orderHash
iexec order show --workerpool [orderHash] # show your order on the Marketplace
iexec order cancel --workerpool <orderHash> # cancel your order
```

#### Sell your computing power at market price on the Marketplace

```bash
iexec orderbook requester --category <id> # find a requestorder ask you want to fill in your category
iexec orderbook app <address> #  find a compatible apporder
iexec orderbook dataset <address> #  find a compatible datasetorder
iexec order init --workerpool # reset workerpoolorder fields in iexec.json
iexec order sign --workerpool # sign your workerpoolorder
iexec order fill --request [orderHash] --app [orderHash] --dataset [orderHash] # send the orders and get a dealid
iexec deal show <dealid> # show the detail of the deal you concludes
```

### SDK CLI for Requesters

First go through [Init project](#init-project)

#### Top up your iExec account to buy compution

```bash
iexec account show # show your iExec account
iexec account deposit 200 # deposit RLC from your wallet to your account
iexec account show # make sure you have enough staked RCL to buy computation
```

#### Buy computation at market price on the Marketplace

```bash
iexec orderbook workerpool --category <id> # find the best workerpoolorder for your category on the marketplace
iexec orderbook app <address> # find the best apporder on the marketplace
iexec orderbook dataset <address> # find the best datasetorder on the marketplace
iexec order fill --app [orderHash] --workerpool [orderHash] --dataset [orderHash] # fill all signed orders and get a dealid
```

#### Or Buy computation at limit price on the Marketplace

```bash
iexec orderbook requester [address] --category <id> # check if you already have valid orders on the marketplace
iexec order init --request # reset requestorder fields in iexec.json
iexec order sign --request # sign your requestorder
iexec order publish --request # publish your requestorder on the marketplace and get an orderHash
iexec order show --app <orderHash> --deals # show your order on the marketplace and check the deals
```

#### Watch your Deals, your Tasks and download the results

```bash
iexec deal show <dealid> # show your deal details
iexec deal show <dealid> --tasks 0 # qet the taskid of the task at index 0 of the deal
iexec task show <taskid> # show the status of your task
iexec task show <taskid> --watch # wait until the task is COMPLETED or FAILLED
iexec task show <taskid> --download [fileName] # download the result of your COMPLETED task
```

### SDK CLI for workers

First go through [Init project](#init-project)

#### Top up your iExec account to buy compution

```bash
iexec account deposit 200 # deposit RLC from your wallet to your account
iexec account show # make sure you have enough stake to join a workerpool
```

#### Withdraw your working reward

```bash
iexec account show # view your available stake
iexec account withdraw 1000 # withdraw RLC from your account to your wallet
```

# iExec SDK CLI API

## Help & Info

```bash
iexec --version
iexec --help
iexec app --help
iexec orderbook --help
iexec info --chain kovan
```

## Global options

```bash
--raw # display the command result as a json
```

### Wallet options

```bash
--keystoredir <'global'|'local'|customPath> # specify the location of the keystoredir
--wallet-address <address> # specify which wallet to use in the keystore
--wallet-file <fileName> # specify which wallet to use in the keystore
--password <password> # specify the password for unlocking the wallet (not recommended)
```

## init

```bash
iexec init # create all files necessary to get started
iexec init --skip-wallet # skip the wallet creation step
```

## wallet

```bash
# OPTIONS
# --chain <chainName>
# --to <address>
# --force
# --password <password>
iexec wallet create # create a new encrypted wallet
iexec wallet create --unecrypted # create unecrypted wallet.json (not recommended)
iexec wallet import <privateKey> # create an encrypted wallet from a privateKey
iexec wallet getETH # ask ETH from faucets
iexec wallet getRLC # ask RLC from faucets
iexec wallet show [address] # optional address to show other people's wallet
iexec wallet show --show-private-key # allow to display wallet private key
iexec wallet sendETH <amount> --to <address> # send ETH to the specified eth address
iexec wallet sendRLC <amount> --to <address>  # send RLC to the specified eth address
iexec wallet sweep --to <address> # drain all ETH and RLC, sending them to the specified eth address
```

## account

```bash
# OPTIONS
# --chain <chainName>
# --force
iexec account show [address] # optional address to show other people's account
iexec account deposit <amount> # deposit the specified amount of RLC from your wallet to your account
iexec account withdraw <amount> # withdraw the specified amount of RLC from your account to your wallet
```

## app

```bash
# OPTIONS
# --chain <chainName>
# --user <address>
iexec app init # init new app
iexec app deploy # deploy new app
iexec app show [address|index] # show app details
iexec app count # count your total number of app
iexec app count --user <userAddress> # count user total number of app
```

## dataset

```bash
# OPTIONS
# --chain <chainName>
# --user <address>
iexec dataset init # init new app
iexec dataset deploy # deploy new dataset
iexec dataset show [address|index] # show dataset details
iexec dataset count # count your total number of dataset
iexec dataset count --user <userAddress> # count user total number of dataset
```

## workerpool

```bash
# OPTIONS
# --chain <chainName>
# --user <address>
iexec workerpool init # init new workerpool
iexec workerpool deploy # deploy new workerpool
iexec workerpool show [address|index] # show workerpool details
iexec workerpool count # count your total number of workerpool
iexec workerpool count --user <userAddress> # count user total number of workerpool
```

## order

```bash
# OPTIONS
# --chain <chainName>
# --force
iexec order init # init all kind of orders
iexec order init --app --dataset --workerpool --request # specify the kind of order to init
iexec order sign # sign all initialized orders
iexec order sign --app --dataset --workerpool --request # sign the specific initialized orders
iexec order publish --app --dataset --workerpool --request # publish the specific signed orders on iExec marketplace
iexec order show --app [orderHash] --dataset [orderHash] --workerpool [orderHash] --request [orderHash] # show the specified published order from iExec marketplace
iexec order show --request [orderHash] --deals # show the deals produced by an order
iexec order fill # fill a set of signed orders (app + dataset + workerpool + request) and return a dealID
iexec order cancel --app --dataset --workerpool --request # cancel a specific signed order
iexec order unpublish --app [orderHash] --dataset [orderHash] --workerpool [orderHash] --request [orderHash] # unpublish a specific published order from the marketplace (unpublished orders are still valid the PoCo, to invalidate them use cancel)
```

## orderbook

```bash
# OPTIONS
# --chain <chainName>
iexec orderbook requester --category <id> # show the best requestorders published on the Marketplace for the specified category
iexec orderbook requester [address] --category <id> # filters the result on requester
iexec orderbook workerpool --category <id> # show the best workerpools published on the Marketplace for the specified category
iexec orderbook workerpool [address] --category <id> # filters the result on workerpool
iexec orderbook app <address> # show the best apporders published on the Marketplace for the specified app
iexec orderbook dataset <address> # show the best datasetorders published on the Marketplace for the specified dataset
```

## deal

```bash
# OPTIONS
# ---chain <chainName>
iexec deal show <dealid> # show a deal identified by dealid
iexec deal show <dealid> --tasks <index...> # show the tasks of the deal at specified index (usage --tasks 0,1,2,3)
iexec deal claim <dealid> # NOT IMPLEMENTED YET
```

## task

```bash
# OPTIONS
# --chain <chainName>
iexec task show <taskid> # show task identified by taskid
iexec task show <taskid> --watch # wait for task to be COMPLETED or CLAIMED
iexec task show <taskid> --download [fileName] # download the result of a COMPLETED task
iexec task claim <taskid> # claim a task requested by the user if the final deadline is reached and the task is still not COMPLETED
```

## tee

```bash
# OPTIONS
# --chain <chainName>
# --application <appName | app0xAddress>
# --keysFolderPath <path>
# --inputsFolderPath <path>
# --encryptedOutputsFolder <path>
# --outputsFolderPath <path>
# --secretManagementService <hostname/IP>
# --remoteFileSystem <serviceName>
iexec tee init # init the TEE folders tree structure
iexec tee encryptedpush --application iexechub/sgx-scone:blender # encrypt work input data + upload it to file hosting service
iexec tee decrypt # decrypt work result
```

## category

```bash
# OPTIONS
# --chain <chainName>
iexec category init # init new category
iexec category create # create new category
iexec category show <index> # show category details by index
iexec category count # count total number of category
```

## registry

```bash
iexec registry validate <'app'|'dataset'|'workerpool'> # validate an object before submiting it to the iExec registry and be listed in the iExec stores
```

## iexec.json

The `iexec.json` file, located in every iExec project, describes the parameters used when creating a [app|dataset|category|workerpool], or when signing an order.

```json
{
  "app": {
    "owner": "0xF048eF3d7E3B33A465E0599E641BB29421f7Df92",
    "name": "VanityGen",
    "type": "DOCKER",
    "multiaddr": "registry.hub.docker.com/iexechub/vanitygen:1.0.0",
    "checksum": "0x762a451c05e0d8097b35d6376e748798b5dc6a13290439cf67d5202f7c6f695f",
    "mrenclave": ""
  },
  "dataset": {
    "owner": "0xF048eF3d7E3B33A465E0599E641BB29421f7Df92",
    "name": "my-dataset",
    "multiaddr": "/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ",
    "checksum": "0x0000000000000000000000000000000000000000000000000000000000000000"
  },
  "workerpool": {
    "owner": "0xF048eF3d7E3B33A465E0599E641BB29421f7Df92",
    "description": "my workerpool"
  },
  "category": {
    "name": "CAT1",
    "description": "my category N°1",
    "workClockTimeRef": 100
  },
  "order": {
    "apporder": {
      "app": "0x0000000000000000000000000000000000000000",
      "appprice": "0",
      "volume": "1",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "datasetrestrict": "0x0000000000000000000000000000000000000000",
      "workerpoolrestrict": "0x0000000000000000000000000000000000000000",
      "requesterrestrict": "0x0000000000000000000000000000000000000000"
    },
    "datasetorder": {
      "dataset": "0x0000000000000000000000000000000000000000",
      "datasetprice": "0",
      "volume": "1",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "apprestrict": "0x0000000000000000000000000000000000000000",
      "workerpoolrestrict": "0x0000000000000000000000000000000000000000",
      "requesterrestrict": "0x0000000000000000000000000000000000000000"
    },
    "workerpoolorder": {
      "workerpool": "0x0000000000000000000000000000000000000000",
      "workerpoolprice": "0",
      "volume": "1",
      "category": "1",
      "trust": "100",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "apprestrict": "0x0000000000000000000000000000000000000000",
      "datasetrestrict": "0x0000000000000000000000000000000000000000",
      "requesterrestrict": "0x0000000000000000000000000000000000000000"
    },
    "requestorder": {
      "app": "0x0000000000000000000000000000000000000000",
      "appmaxprice": "0",
      "dataset": "0x0000000000000000000000000000000000000000",
      "datasetmaxprice": "0",
      "workerpool": "0x0000000000000000000000000000000000000000",
      "workerpoolmaxprice": "0",
      "volume": "1",
      "category": "1",
      "trust": "100",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "beneficiary": "0x0000000000000000000000000000000000000000",
      "callback": "0x0000000000000000000000000000000000000000",
      "params": "{ cmdline: '--help' }"
    }
  }
}
```

## chains.json

The `chains.json` file, located in every iExec project, describes the parameters used when communicating with ethereum nodes and iExec schedulers. They are ordered by chain name, accessible by using the `--chain <chainName>` option for each command of the SDK.

```json
{
  "default": "kovan",
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

The `orders.json` file, located in iExec project, localy stores your signed orders. This file is used when you publish an order on the marketplace and when you fill orders without specified orders from the marketplace.

```json
{
  "42": {
    "apporder": {
      "app": "0x0000000000000000000000000000000000000000",
      "appprice": "0",
      "volume": "1",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "datasetrestrict": "0x0000000000000000000000000000000000000000",
      "workerpoolrestrict": "0x0000000000000000000000000000000000000000",
      "requesterrestrict": "0x0000000000000000000000000000000000000000",
      "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "sign": {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "v": 0
      }
    },
    "datasetorder": {
      "dataset": "0x0000000000000000000000000000000000000000",
      "datasetprice": "0",
      "volume": "1",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "apprestrict": "0x0000000000000000000000000000000000000000",
      "workerpoolrestrict": "0x0000000000000000000000000000000000000000",
      "requesterrestrict": "0x0000000000000000000000000000000000000000",
      "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "sign": {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "v": 0
      }
    },
    "workerpoolorder": {
      "workerpool": "0x0000000000000000000000000000000000000000",
      "workerpoolprice": "0",
      "volume": "1",
      "category": "1",
      "trust": "100",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "apprestrict": "0x0000000000000000000000000000000000000000",
      "datasetrestrict": "0x0000000000000000000000000000000000000000",
      "requesterrestrict": "0x0000000000000000000000000000000000000000",
      "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "sign": {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "v": 0
      }
    },
    "requestorder": {
      "app": "0x0000000000000000000000000000000000000000",
      "appmaxprice": "0",
      "dataset": "0x0000000000000000000000000000000000000000",
      "datasetmaxprice": "0",
      "workerpool": "0x0000000000000000000000000000000000000000",
      "workerpoolmaxprice": "0",
      "volume": "1",
      "category": "1",
      "trust": "100",
      "tag": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "beneficiary": "0x0000000000000000000000000000000000000000",
      "callback": "0x0000000000000000000000000000000000000000",
      "params": "{ cmdline: '--help' }",
      "requester": "0x0000000000000000000000000000000000000000",
      "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "sign": {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "v": 0
      }
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

# iExec SDK CLI fork/spawn

If your program is not written in javascript, your last option to use the SDK would be to spawn it as a seperate process (sometimes called FORK operation). After each SDK run you should check the exit code returned by the SDK to know if the operation was sucessfull or not `echo $?`:

- 0 = successful
- 1 = error

Finally, you could choose to parse the SDK stdout/stderr to access more information. Use the global option --raw to get json formated output. ex:

- `iexec wallet show --raw &> out.txt`
- `iexec wallet show --raw |& grep .`

Warning:

- The stdout/stderr is subject to changes (this is what makes this solution brittle)
- The node and docker version have some slight differences in their stdout/stderr
