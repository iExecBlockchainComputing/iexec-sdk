![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK V3

[![Build Status](https://drone.iex.ec//api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows easy interactions with iExec decentralized Marketplace in order to run off-chain computations.

## Resources

- [CLI documentation](https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-cli-api)
- [JS lib documentation](https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-library-api)
- The iExec Dapp Store: https://dapps.iex.ec
- The iExec Data Store: https://data.iex.ec
- The iExec Marketplace: https://market.iex.ec
- The iExec Explorer: https://explorer.iex.ec
- The iExec Workerpool registry: https://pools.iex.ec
- The RLC faucet: https://faucet.iex.ec
- iExec main documentation: https://docs.iex.ec
- The iExec [JS smart contracts client lib](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) to interact with iExec smart contracts (without the SDK)
- [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry), to apply for Dapp Store listing
- [iExec data registry](https://github.com/iExecBlockchainComputing/iexec-data-registry), to apply for Data Store listing

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
iexec orderbook app <address> # check if you have valid sell orders for your app on the Marketplace
iexec order init --app # reset apporder fields in iexec.json
iexec order sign --app # sign your apporder
iexec order publish --app # publish your apporder on the Marketplace and get an orderHash
iexec order show --app [orderHash] # show your order on the Marketplace
iexec order cancel --app <orderHash> # cancel your order
```

### SDK CLI for Dataset providers

First go through [Init project](#init-project)

#### Encrypt your dataset

```bash
iexec tee init # create ./tee/original-dataset, ./tee/encryptedDataset and ./.tee-secrets/dataset
cp 'myAwsomeDataset.file' ./tee/original-dataset # copy your dataset file or folder into the original-dataset folder
iexec tee encrypt-dataset # generate a secret key for each file or folder in original-dataset and encrypt it
cat ./.tee-secret/dataset/myAwsomeDataset.file.secret # this is the secret key for decrypting the dataset
cat ./tee/encrypted-dataset/myAwsomeDataset.file.enc # this is the encrypted dataset, you must share this file at a public url
```

#### Deploy your dataset

```bash
iexec dataset count # check if you have already deployed datasets
iexec dataset init # reset dataset fields in iexec.json
iexec dataset deploy # deploy dataset on Ethereum
iexec dataset show # show details of deployed dataset
```

### Securely share the dataset secret key (Encrypted datasets only)

**Disclaimer: The secrets pushed in the Secreet Management Service will be shared with the worker to process the dataset in the therms your specify in the dataset order. Make sure to always double check your selling policy in the dataset order before signing it**

```bash
iexec tee push-secret --dataset <datasetAddress> --secret-path <datasetSecretPath> # Push the secret in the Secreet Management Service (sms)
```

#### Sell your dataset on the Marketplace

```bash
iexec orderbook dataset <address> # check if you have valid sell orders for your dataset on the Marketplace
iexec order init --dataset # reset datasetorder fields in iexec.json
vim iexec.json # edit your selling policy, set restrictions, price ...
iexec order sign --dataset # sign your datasetorder
iexec order publish --dataset #publish your datasetorder on the Marketplace and get an orderHash
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
iexec orderbook workerpool [address] --category <id> # check if you have valid sell orders for your workerpool on the Marketplace
iexec order init --workerpool # reset workerpoolorder fields in iexec.json
iexec order sign --workerpool # sign your workerpoolorder
iexec order publish --workerpool # publish your workerpoolorder on the Marketplace and get an orderHash
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
iexec order fill --request <orderHash> --app <orderHash> --dataset <orderHash> # send the orders and get a dealid
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
iexec orderbook workerpool --category <id> # find the best workerpoolorder for your category on the Marketplace
iexec orderbook app <address> # find the best apporder on the Marketplace
iexec orderbook dataset <address> # find the best datasetorder on the Marketplace
iexec order init --request # reset requestorder fields in iexec.json
iexec order sign --request # sign your requestorder
iexec order fill --app <orderHash> --workerpool <orderHash> --dataset <orderHash> # fill orders from the Marketplace with signed request order and get a dealid
```

Alternatively you can generate the request on the fly

```bash
iexec orderbook workerpool --category <id> # find the best workerpoolorder for your category on the Marketplace
iexec orderbook app <address> # find the best apporder on the Marketplace
iexec orderbook dataset <address> # find the best datasetorder on the Marketplace
iexec order fill --app <orderHash> --workerpool <orderHash> --dataset <orderHash> --params <params> # fill orders from the Marketplace with requested params and get a dealid
```

#### Or Buy computation at limit price on the Marketplace

```bash
iexec orderbook requester [address] --category <id> # check if you already have valid orders on the Marketplace
iexec order init --request # reset requestorder fields in iexec.json
iexec order sign --request # sign your requestorder
iexec order publish --request # publish your requestorder on the Marketplace and get an orderHash
iexec order show --app <orderHash> --deals # show your order on the Marketplace and check the deals
```

#### Watch your Deals, your Tasks and download the results

```bash
iexec deal show <dealid> # show your deal details, get the taskids
iexec task show <taskid> # show the status of your task
iexec task show <taskid> --watch # wait until the task is COMPLETED or FAILLED
iexec task show <taskid> --download [fileName] # download the result of your COMPLETED task
```

#### Use tee results encryption

```bash
iexec tee init # create the tee folder tree
iexec tee generate-beneficiary-keys # generate private/public AES keypaire for result encryption
iexec tee push-secret # share the public AES key with the secret management service, all your results will be encrypted with this key
# Go through the normal buy process  and download the result of the computation #
iexec tee decrypt-results [encryptedResultsFilePath] # decrypt the result with the private AES key
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

### Transactions options

```bash
--gas-price <wei> # use the specified value for next transactions gas price (default use eth_gasPrice result)
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
iexec wallet create --unencrypted # create unencrypted wallet.json (not recommended)
iexec wallet import <privateKey> # create an encrypted wallet from a privateKey
iexec wallet getETH # ask ETH from faucets
iexec wallet getRLC # ask RLC from faucets
iexec wallet show [address] # optional address to show other people's wallet
iexec wallet show --show-private-key # allow displaying wallet private key
iexec wallet sendETH <amount> --to <address> # send ETH to the specified eth address
iexec wallet sendRLC <amount> --to <address>  # send RLC to the specified eth address
iexec wallet sweep --to <address> # drain all ETH and RLC, sending them to the specified eth address
```

The wallet files are stored in the Ethereum keystore.
The keystore location depends on your OS:

- Linux : ~/.ethereum/keystore
- Mac: ~/Library/Ethereum/keystore
- Windows: ~/AppData/Roaming/Ethereum/keystore

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
iexec order publish --app --dataset --workerpool --request # publish the specific signed orders on iExec Marketplace
iexec order show --app [orderHash] --dataset [orderHash] --workerpool [orderHash] --request [orderHash] # show the specified published order from iExec Marketplace
iexec order show --request [orderHash] --deals # show the deals produced by an order
iexec order fill # fill a set of local signed orders (app + dataset + workerpool + request) and return a dealID
iexec order fill --app <orderHash> --dataset <orderHash> --workerpool <orderHash> --request <orderHash> # fill a set of signed orders from iExec Marketplace and return a dealID
iexec order fill --params <params> # fill a set of signed orders generate a request order with specified params on the fly (existing apporder is ignored)
iexec order cancel --app --dataset --workerpool --request # cancel a specific signed order
iexec order unpublish --app [orderHash] --dataset [orderHash] --workerpool [orderHash] --request [orderHash] # unpublish a specific published order from iExec Marketplace (unpublished orders are still valid in the PoCo, to invalidate them use cancel)
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
# --dataset-keystoredir <path>
# --beneficiary-keystoredir <path>
# --original-dataset-dir <path>
# --encrypted-dataset-dir <path>
iexec tee init # create the TEE folder tree structure
iexec tee encrypt-dataset # generate a key and encrypt the dataset from "original-dataset"
iexec tee encrypt-dataset --algorithm scone # generate a key and encrypt the dataset from "original-dataset" with Scone
iexec tee generate-beneficiary-keys # generate a beneficiary key pair to encrypt and decrypt the results
iexec tee push-secret # push the secret for the beneficiary
iexec tee push-secret --secret-file [secretPath] # specify a file path for reading the secret
iexec tee push-secret --beneficary # push the secret for the beneficiary (default)
iexec tee push-secret --dataset <datasetAddress> # push the secret for the dataset
iexec tee decrypt-results [encryptedResultsPath] # decrypt encrypted results with beneficary key
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
iexec registry validate <'app'|'dataset'|'workerpool'> # validate an object before submitting it to the iExec registry and be listed in the iExec stores
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
      "host": "http://localhost:8545",
      "id": "*",
      "sms": "http://localhost:5000"
    },
    "ropsten": {
      "host": "https://ropsten.infura.io/v3/apiKey",
      "id": "3"
    },
    "rinkeby": {
      "host": "https://rinkeby.infura.io/v3/apiKey",
      "id": "4"
    },
    "kovan": {
      "host": "https://kovan.infura.io/v3/apiKey",
      "id": "42",
      "sms": "https://sms-kovan.iex.ec"
    },
    "mainnet": {
      "host": "https://mainnet.infura.io/v3/apiKey ",
      "id": "1",
      "sms": "https://sms-mainnet.iex.ec"
    }
  }
}
```

The `orders.json` file, located in iExec project, locally stores your signed orders. This file is used when you publish an order on the Marketplace and when you fill orders without specified orders from the Marketplace.

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
      "sign": "0x"
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
      "sign": "0x"
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
      "sign": "0x"
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
      "sign": "0x"
    }
  }
}
```

# iExec SDK Library API

**[Work In Progress]** Although we'll try to avoid any API change, the Lib API may still evolve based on beta-testers feedback.

iExec SDK can be imported in your project as a library/module, and it's compatible with old JS engines:

- \>= Node v8
- \>= Firefox v22
- \>= Chrome v28
- \>= IE 9

## These dapps are built on the top of iexec SDK

- [Price feed DOracle](https://price-feed-doracle.iex.ec/): a decentralized price oracle for your favorite cryptos.
- [Not safe for work](https://nsfw.app.iex.ec/): find if a picture is safe for work using an AI trained model protected by iExec TEE.

## How to use ?

1. [Install the dependencies in your JS project](#install-the-dependencies-in-your-js-project)
2. [Create a contracts object consumable by iexec SDK](#create-a-contracts-object-consumable-by-iexec-sdk)
3. [Access iexec most useful methods](#access-iexec-most-useful-methods)

### Install the dependencies in your JS project

Install iexec-contracts-js-client to access the iexec Smart Contracts

```bash
npm install iexec-contracts-js-client
```

Install iexec sdk

```bash
npm install iexec
```

### Create a `contracts` object consumable by `iexec` SDK

iExec SDK use a wrapper to access the iexec contracts on the blockchain, you need to pass this object to every method that interact with the blockchain.

`contracts` is created with the module `iexec-contracts-js-client` and require an Ethereum signer provider.

In your code:

```js
import createIExecContracts from 'iexec-contracts-js-client';

const getContracts = ethProvider => {
  return createIExecContracts({
    ethProvider: ethProvider, // an eth signer provider like MetaMask
    chainId: 42, // id of the chain (42 for kovan)
  });
};
```

**Important:** ethProvider must implement eth_signTypedData_v3 (EIP712)

In the browser, you can get a signer provider from [MetaMask plugin](https://metamask.io/)

**Example:**

```js
const getEthProvider = async () => {
  let ethProvider;
  if (!window.ethereum)
    // check existing
    throw Error('Need to install MetaMask');
  ethProvider = window.ethereum;
  try {
    await window.ethereum.enable(); // prompt the use to grant the dapp access to the blockchain
  } catch (error) {
    throw Error('User denied access', error);
  }
  return ethProvider;
};
```

### Access iexec most useful methods

iexec modules:

- [wallet](#wallet): manage your wallet, send RLC...
- [account](#account): manage your account, deposit, withdraw...
- [orderbook](#orderboook): explore the iexec Marketplace
- [order](#order): manage any type of order, make deals to start offchain computation
- [deal](#deal): find your deals
- [task](#task): follow the computation, download results or claim failled exuecutions

### Wallet

**Example:**

```js
import sdk from 'iexec';

// check wallet balances (nRLC & wei)
const checkBalances = async (contracts, ethAddress) => {
  const balance = await sdk.wallet.checkBalances(contracts, ethAddress);
  console.log('Nano RLC:', balance.nRLC.toString());
  console.log('Eth wei:', balance.wei.toString());
};

// send RLC (! blockchain transaction !)
const sendRLC = async (contracts, amount, toEthAddress) => {
  const txHash = await sdk.wallet.sendRLC(contracts, amount, toEthAddress);
  console.log('Transaction hash:', txHash);
};
```

### Account

**Example:**

```js
import sdk from 'iexec';

// check iExec account balance (nRLC staked and locked)
const checkAccountBalance = async (contracts, ethAddress) => {
  const balance = await sdk.account.checkBalance(contracts, ethAddress);
  console.log('Nano RLC staked:', balance.stake.toString());
  console.log('Nano RLC locked:', balance.locked.toString());
};

// deposit RLC from the wallet to the iExec Account (! blockchain transaction !)
const deposit = async (contracts, amount) => {
  const depositedAmount = await sdk.account.deposit(contracts, amount);
  console.log('Deposited:', depositedAmount);
};

// withdraw RLC from the iExec Account to the wallet (! blockchain transaction !)
const withdraw = async (contracts, amount) => {
  const withdrawedAmount = await sdk.account.withdraw(contracts, amount);
  console.log('Withdrawed:', withdrawedAmount);
};
```

### Orderbook

**Example:**

```js
import sdk from 'iexec';

// explore the published workerpool orders
const getWorkerpoolOrderbook = async (chainId, category, workerpoolAddress) => {
  const res = await sdk.orderbook.fetchWorkerpoolOrderbook(
    chainId, // 42 for kovan
    category, // 1 for category 1
    { workerpoolAddress }, // optional filter by workerpool address
  );
  console.log('Best workerpool orders:', res.workerpoolOrders);
  console.log('Best order:', res.workerpoolOrders[0].order);
};

// explore the published request orders
const getRequestOrderbook = async (chainId, category, requesterAddress) => {
  const res = await sdk.orderbook.fetchRequestOrderbook(
    chainId, // 42 for kovan
    category, // 1 for category 1
    { requesterAddress }, // optional filter by requester address
  );
  console.log('Best request orders:', res.requestOrders);
  console.log('Best order:', res.requestOrders[0].order);
};

// explore the published app orders
const getAppOrderbook = async (chainId, appAddress) => {
  const res = await sdk.orderbook.fetchAppOrderbook(
    chainId, // 42 for kovan
    appAddress, // '0x...' the eth address of an iExec dapp
  );
  console.log(`Best orders for ${appAddress}:`, res.appOrders);
  console.log('Best order:', res.appOrders[0].order);
};

// explore the published dataset orders
const getDatasetOrderbook = async (chainId, datasetAddress) => {
  const res = await sdk.orderbook.fetchDatasetOrderbook(
    chainId, // 42 for kovan
    datasetAddress, // '0x...' the eth address of an iExec dataset
  );
  console.log(`Best orders for ${datasetAddress}:`, res.datasetOrders);
  console.log('Best order:', res.datasetOrders[0].order);
};
```

### Order

#### Create your app order (as dapp developper)

**Example:**

```js
import sdk from 'iexec';

// prepare an app order to sign
const orderToSign = await sdk.order.createApporder({
  app, // [mandatory] app address
  appprice, // [mandatory] selling price in nRLC
  volume, // [mandatory] number of execution to sell
  tag, // [optional] bytes 32 hexstring encoded required tags (default no tag)
  datasetrestrict, // [optional] whitelisted dataset (default all)
  workerpoolrestrict, // [optional] whitelisted workerpool (default all)
  requesterrestrict, // [optional] whitelisted requester (default all)
});

// sign an app order
const signAppOrder = async (contracts, orderToSign) => {
  const signedOrder = await sdk.order.signApporder(contracts, orderToSign);
  console.log('Signed order:', signedOrder);
};
```

#### Create your dataset order (as dataset provider)

**Example:**

```js
import sdk from 'iexec';

// prepare a dataset order to sign
const orderToSign = await sdk.order.createDatasetorder(
  dataset, // [mandatory] dataset address
  datasetprice, // [mandatory] selling price in nRLC
  volume, // [mandatory] number of execution to sell
  tag, // [optional] bytes 32 hexstring encoded required tags (default no tag)
  apprestrict, // [optional] whitelisted app (default all)
  workerpoolrestrict, // [optional] whitelisted workerpool (default all)
  requesterrestrict, // [optional] whitelisted requester (default all)
);

// sign a dataset order
const signDatasetOrder = async (contracts, orderToSign) => {
  const signedOrder = await sdk.order.signDatasetorder(contracts, orderToSign);
  console.log('Signed order:', signedOrder);
};
```

#### Create your workerpool order (as workerpool owner)

**Example:**

```js
import sdk from 'iexec';

// prepare a workerpool order to sign
const orderToSign = await sdk.order.createWorkerpoolorder(
  workerpool, // [mandatory] workerpool address
  workerpoolprice, // [mandatory] execution selling price in nRLC
  volume, // [mandatory] number of execution to sell
  category, // [mandatory] id of the category (0 to 4)
  trust, // [optional] level of trust offered (default no trust)
  tag, // [optional] bytes 32 hexstring encoded offered tags (default no tag)
  apprestrict, // [optional] whitelisted app (default all)
  datasetrestrict, // [optional] whitelisted dataset (default all)
  requesterrestrict, // [optional] whitelisted requester (default all)
);

// sign a workerpool order
const signWorkerpoolOrder = async (contracts, orderToSign) => {
  const signedOrder = await sdk.order.signOrder(contracts, orderToSign);
  console.log('Signed order:', signedOrder);
};
```

#### Create your request order (as requester)

**Example:**

```js
import sdk from 'iexec';

// prepare a request order to sign
const orderToSign = await sdk.order.createRequestorder(
  app, // [mandatory] address of the app to run
  appmaxprice, // [mandatory] max price in nRLC to pay to the app owner
  workerpoolmaxprice, // [mandatory] max price in nRLC to pay to the workerpool
  requester, // [mandatory] address of the signer of the order (pay for the computation)
  volume, // [mandatory] number of execution to buy
  category, // [mandatory] id of the category (0 to 4)
  workerpool, //  [optional] address of the workerpool to use (default any workerpool)
  dataset, // [optional] address of the dataset to use (default no dataset)
  datasetmaxprice, // [optional] max price in nRLC to pay to the dataset owner (default '0')
  beneficiary, // [optional] address of the beneficiary of the order (can download the result of the computation, default same as requester)
  params, // [optional] application params
  callback, // [optional] address of the smart contract to send receiveResult as specified in ERC1154 (default none)
  trust, // [optional] level of trust required (default no trust)
  tag, // [optional] bytes 32 hexstring encoded required tags (default no tag)
);

// sign a request order
const signRequestOrder = async (contracts, orderToSign) => {
  const signedOrder = await sdk.order.signOrder(contracts, orderToSign);
  console.log('Signed order:', signedOrder);
};
```

#### Order sharing

**Example:**

```js
import sdk from 'iexec';

// publish an order on iExec Marketplace
const publishAppOrder = async (contracts, signedAppOrder) => {
  const orderHash = await sdk.order.publishApporder(contracts, signedAppOrder);
  console.log('Published order orderHash:', orderHash);
};

// unpublish an order from iExec Marketplace (unpublished orders still can be matched)
const unpublishAppOrder = async (contracts, orderHash) => {
  const unpublishedOrderHash = await sdk.order.unpublishApporder(
    contracts,
    orderHash, // hash of the order to unpublish
  );
  console.log('Unpublished order orderHash:', unpublishedOrderHash);
};

// cancel an order (canceled orders can't be matched) (! blockchain transaction !)
const cancelAppOrder = async (contracts, signedAppOrder) => {
  const isCanceled = await sdk.order.cancelApporder(
    contracts,
    signedAppOrder, // order to cancel
  );
  console.log('Order is canceled:', isCanceled);
};
```

#### Make a deal

**Example:**

```js
import sdk from 'iexec';

// make a deal with compatible signed orders (! blockchain transaction !)
const makeADeal = async (
  contracts,
  signedAppOrder,
  signedDataseOrder = sdk.order.NULL_DATASETORDER, // default no dataset
  signedWorkerpoolOrder,
  signedRequestOrder,
) => {
  const res = await sdk.order.matchOrders(
    contracts,
    signedAppOrder,
    signedDataseOrder,
    signedWorkerpoolOrder,
    signedRequestOrder,
  );
  console.log('Deal concluded:', res.dealid);
  console.log('Volume matched:', res.volume);
};

// show the deals produced by an order
const showAppOrderDeals = async (contracts, chainId, signedOrder) => {
  const orderHash = await sdk.order.computeOrderHash(
    contracts,
    orderName, // sdk.order.APP_ORDER to get an App order hash
    signedOrder, // signed app order
  );
  const res = await sdk.order.fetchDealsByOrderHash(
    orderName, // sdk.order.APP_ORDER to get an App order hash
    chainId, // 42 for kovan
    orderHash,
  );
  console.log('Deals concluded:', res.deals);
  console.log('Total deals count:', res.count);
};
```

### Deal

**Example:**

```js
import sdk from 'iexec';

// show a deal
const showDeal = async (contracts, dealid) => {
  const deal = await sdk.deal.show(contracts, dealid);
  console.log('Deal:', deal);
};
```

### Task

**Example:**

```js
import sdk from 'iexec';

// show a task
const showTask = async (contracts, taskid) => {
  const task = await sdk.task.show(
    contracts,
    taskid, // Bytes 32 hexstring, id of the task
  );
  console.log('Task:', task);
};

// claim a task not completed after the final deadline (! blockchain transaction !)
const claimTask = async (contracts, taskid) => {
  const txHash = await sdk.task.claim(
    contracts,
    taskid, // Bytes 32 hexstring, id of the task
  );
  console.log('Claim transaction :', txHash);
};

const downloadResults = async (contractas, taskid) => {
  const res = await sdk.task.fetchResults(
    contracts,
    taskid, // Bytes 32 hexstring, id of the task
    {
      ipfsGatewayURL: 'https://gateway.ipfs.io', // optional url of an IPFS gateway (should allow CORS for in browser use)
    },
  );
  const resultBlob = await res.blob(); // get the result in a blob for example
};
```

# iExec SDK CLI fork/spawn

If your program is not written in javascript, your last option to use the SDK would be to spawn it as a separate process (sometimes called FORK operation). After each SDK run you should check the exit code returned by the SDK to know if the operation was successful or not `echo $?`:

- 0 = successful
- 1 = error

Finally, you could choose to parse the SDK stdout/stderr to access more information. Use the global option --raw to get json formatted output. ex:

- `iexec wallet show --raw &> out.txt`
- `iexec wallet show --raw |& grep .`

Warning:

- The stdout/stderr is subject to changes (this is what makes this solution brittle)
- The node and docker version have some slight differences in their stdout/stderr
