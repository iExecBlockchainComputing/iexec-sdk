![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK V3

[![Build Status](https://drone.iex.ec//api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows easy interactions with iExec decentralized Marketplace in order to run off-chain computations.

## Resources

- [CLI tutorials](#cli-tutorials)
- [CLI documentation](#iexec-sdk-cli-api)
- [JS lib documentation](#iexec-sdk-library-api)
- The iExec Dapp Store: https://dapps.iex.ec
- The iExec Data Store: https://data.iex.ec
- The iExec Marketplace: https://market.iex.ec
- The iExec Explorer: https://explorer.iex.ec
- The iExec Workerpool registry: https://pools.iex.ec
- The RLC faucet: https://faucet.iex.ec
- iExec main documentation: https://docs.iex.ec
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

## CLI Tutorials

- [Init project](#Init-project)
- [SDK CLI for Dapp developpers](#SDK-CLI-for-Dapp-developpers)
- [SDK CLI for Dataset providers](#SDK-CLI-for-Dataset-providers)
- [SDK CLI for Workerpools](#SDK-CLI-for-Workerpools)
- [SDK CLI for Requesters](#SDK-CLI-for-Requesters)
- [SDK CLI for workers](#SDK-CLI-for-workers)

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

#### Encrypt your dataset (optional)

```bash
cp 'myAwsomeDataset.file' ./datasets/original # copy your dataset file or folder into the dataset/original/ folder
iexec dataset encrypt # generate a secret key for each file or folder in dataset/original/ and encrypt it
cat ./.secrets/dataset/myAwsomeDataset.file.secret # this is the secret key for decrypting the dataset
cat ./datasets/encrypted/myAwsomeDataset.file.enc # this is the encrypted dataset, you must share this file at a public url
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
iexec dataset push-secret # Push the secret in the Secret Management Service (sms)
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

#### Use results encryption

```bash
iexec result generate-keys # generate private/public AES keypair for result encryption
iexec result push-secret # share the public AES key with the secret management service, all your results will be encrypted with this key
# Go through the normal buy process  and download the result of the computation #
iexec result decrypt [encryptedResultsFilePath] # decrypt the result with the private AES key
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
iexec dataset init # init new dataset
iexec dataset deploy # deploy new dataset
iexec dataset show [address|index] # show dataset details
iexec dataset count # count your total number of dataset
iexec dataset count --user <userAddress> # count user total number of dataset
iexec dataset encrypt # generate a key and encrypt the dataset files from ./datasets/original/
iexec dataset encrypt --algorithm scone # generate a key and encrypt the dataset files from ./datasets/original/ with Scone TEE
iexec dataset push-secret [datasetAddress] # push the secret for the dataset
iexec dataset check-secret [datasetAddress] # check if a secret exists for the dataset
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

## result

```bash
# OPTIONS
# --chain <chainName>
iexec result generate-beneficiary-keys # generate a beneficiary key pair to encrypt and decrypt the results
iexec result push-secret # push the encryption key for the beneficiary
iexec result push-secret --secret-file [secretPath] # specify a file path for reading the secret
iexec result decrypt [encryptedResultsPath] # decrypt encrypted results with beneficary key
iexec result check-secret [userAddress] # check if a secret exists for the user
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

## CLI files and folders

- [iexec.json](#iexecjson)
- [chain.json](#chainjson)
- [orders.json](#ordersjson)
- [deployed.json](#deployedjson)
- [.secrets/](#/secrets/)
  - [.secrets/datasets/](#/secrets/datasets/)
  - [.secrets/beneficary/](#/secrets/beneficary/)
- [datasets/](#/datasets/)
  - [datasets/original/](#/datasets/original/)
  - [datasets/encrypted/](#/datasets/encrypted/)

### iexec.json

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

### chain.json

The `chain.json` file, located in every iExec project, describes the parameters used when communicating with ethereum nodes and iExec schedulers. They are ordered by chain name, accessible by using the `--chain <chainName>` option for each command of the SDK.

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

### deployed.json

The `deployed.json` file, located in iExec project, locally stores your last deployed resources address. These address are used when you run a commande without specifying a resource address (exemple: `iexec app show` will show the app in `deployed.json`).

```json
{
  "app": {
    "42": "0xa760FEfAd0a38D494890501120cB79f5EEAFeE28"
  },
  "workerpool": {
    "42": "0xFb346A453C4D34AbA0038c274D1bd3C98099962c"
  },
  "dataset": {
    "42": "0xB9c7647ECd48d795A9031d6fe8292C13E73372F7"
  }
}
```

### orders.json

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

### ./secrets/

This folder is created when running `iexec init` and is intended to store credentials generated by the iexec SDK CLI.

#### ./secrets/beneficiary/

This folder store the keypair to use for result encryption and decryption.
A keypair is generated when running `iexec result generate-keys`
Public keys name follow the pattern _userAddress_\_key.pub , this key is shared with the workers when running `ìexec result push-secret`
Private keys name follow the pattern _userAddress_\_key this should never be shared with third party, the private key is used by the SDK CLI to decrypt a result when running `ìexec result decrypt`.

#### ./secrets/datasets/

This folder store the secret used for dataset encryption.
A secret is generated when running `iexec dataset encrypt`
The secret file is named after the dataset file, last secret generated is also stored in `./secrets/datasets/dataset.secret` to be used as default secret to share with workers when running `iexec dataset push-secret`.

### ./datasets/

This folder is created when running `iexec init` and is intended to store datasets files.

#### ./datasets/original/

Paste your original dataset files in this folder and run `iexec dataset encrypt` to encrypt them.

#### ./datasets/original/

Encrypted dataset files ends in this folder when you run `iexec dataset encrypt`.

# iExec SDK Library API

**[Work In Progress]** Although we'll try to avoid any API change, the Lib API may still evolve based on beta-testers feedback.

iExec SDK can be imported in your project as a library/module, and it's compatible with old JS engines:

- \>= Node v8
- \>= Firefox v22
- \>= Chrome v28
- \>= IE 9

## Test iexec in codesandbox

- [Buy computation demo](https://codesandbox.io/embed/iexec-sdk-demo-iexec310-zm93y?fontsize=14)

## These dapps are built on the top of iexec SDK

- [Price feed DOracle](https://price-feed-doracle.iex.ec/): a decentralized price oracle for your favorite cryptos.
- [Not safe for work](https://nsfw.app.iex.ec/): find if a picture is safe for work using an AI trained model protected by iExec TEE.

## How to use ?

1. [Install the dependency in your JS project](#install-the-dependenciy-in-your-js-project)
2. [Instanciate the iExec SDK](#instanciate-the-iexec-sdk)
3. [Use iexec sdk](#use-iexec-sdk)
4. [Types](#types)
5. [Errors](#errors)

### Install the dependency in your JS project

Install iexec sdk

```bash
npm install iexec
```

### Instanciate the iExec SDK

iExec SDK requires an eth signer provider and a chain id to work.

In your code:

```js
import { IExec } from 'iexec';

const iexec = new IExec({
  ethProvider: ethProvider, // an eth signer provider like MetaMask
  chainId: '42', // id of the chain (42 for kovan)
});
```

**Important:** if the current network change, you must reinstanciate the iExec SDK (actual supported networks are '1' (mainnet) and '42' (kovan testnet)).

**Important:** ethProvider must implement eth_signTypedData_v3 (EIP712)

In the browser, you can get a signer provider from [MetaMask plugin](https://metamask.io/)

_Example:_

```js
const getIExec = async () => {
  let ethProvider;
  if (!window.ethereum)
    // check existing web3 provider
    throw Error('Need to install MetaMask');
  ethProvider = window.ethereum;
  try {
    await window.ethereum.enable(); // prompt the use to grant the dapp access to the blockchain
  } catch (error) {
    throw Error('User denied access', error);
  }
  return new IExec({
    ethProvider: ethProvider,
    chainId: ethProvider.networkVersion,
  });
};
```

### Use iexec sdk

- [wallet](#iexecwallet): manage your wallet, send RLC...
- [account](#iexecaccount): manage your account, deposit, withdraw...
- [orderbook](#iexecorderboook): explore the iexec Marketplace
- [order](#iexecorder): manage any type of order, make deals to start offchain computation
- [deal](#iexecdeal): find your deals
- [task](#iexectask): follow the computation, download results or claim failled executions
- [app](#iexecapp): deploy a new app, show an existing one
- [dataset](#iexecdataset): deploy a new dataset, show an existing one
- [workerpool](#iexecworkerpool): deploy a new workerpool, show an existing one

### iexec.wallet

#### getAddress

iexec.**wallet.getAddress ( )** => Promise < **Address** >

> get the user selected address

_Example:_

```js
const userAddress = await iexec.wallet.getAddress();
console.log('User address:', userAddress);
```

#### checkBalances

iexec.**wallet.checkBalances ( address: Address )** => Promise < **{ nRLC: BN, wei: BN }** >

> check the wallet balance of specified address

_Example:_

```js
const balance = await iexec.wallet.checkBalances(ethAddress);
console.log('Nano RLC:', balance.nRLC.toString());
console.log('Eth wei:', balance.wei.toString());
```

#### sendRLC

iexec.**wallet.sendRLC ( nRlcAmount: Uint256, address: Address )** => Promise < **TxHash** >

> send some nRLC (1 nRLC = 1\*10^-9 RLC) to the specified address

_Example:_

```js
const txHash = await iexec.wallet.sendRLC(nRlcAmount, toEthAddress);
console.log('Transaction hash:', txHash);
```

#### sendETH

iexec.**wallet.sendETH ( weiAmount, address: Address )** => Promise < **TxHash** >

> send some wei to the specified address

_Example:_

```js
const txHash = await iexec.wallet.sendETH(weiAmount, toEthAddress);
console.log('Transaction hash:', txHash);
```

#### sweep

iexec.**wallet.sweep ( address: Address )** => Promise < **{ sendRLCTxHash: TxHash, sendETHTxHash: TxHash }**

> send all the RLC and the native token to the specified address

_Example:_

```js
await sdk.wallet.sweep(toEthAddress);
```

### iexec.account

#### checkBalance

iexec.**account.checkBalance ( address: Address )** => Promise < **{ stake: BN, locked: BN }** >

> check the account balance of specified address (stake is availlable nRLC, locked is escowed nRLC)

_Example:_

```js
const balance = await iexec.account.checkBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### deposit

iexec.**account.deposit ( nRlcAmount: Uint256 )** => Promise < **BN** >

> deposit some nRLC (1 nRLC = 1\*10^-9 RLC) from user wallet to user account
>
> The deposit include 2 transaction (1st to approve the iexec clerk SC, 2nd for deposit)

_Example:_

```js
const depositedAmount = await iexec.account.deposit('1000000000');
console.log('Deposited:', depositedAmount);
```

#### withdraw

iexec.**account.withdraw ( nRlcAmount: Uint256 )** => Promise < **BN** >

> withdraw some nRLC (1 nRLC = 1\*10^-9 RLC) from user account to user wallet

_Example:_

```js
const withdrawedAmount = await iexec.account.withdraw('1000000000');
console.log('Withdrawed:', withdrawedAmount);
```

### iexec.orderbook

#### fetchAppOrderbook

iexec.**orderbook.fetchAppOrderbook ( address: Address )** => Promise < **{ count, orders: \[ { order: SignedApporder , status, remaining} \] }** >

> find the cheapest orders for the specified app

_Example:_

```js
const res = await iexec.orderbook.fetchAppOrderbook(
  '0xdBDF1FE51fd3AF9aD94fb63824EbD977518d64b3',
);
console.log('best order:', res.orders[0].order);
console.log('total orders:', res.count);
```

#### fetchDatasetOrderbook

iexec.**orderbook.fetchDatasetOrderbook ( address: Address )** => Promise < **{ count, orders: \[ { order: SignedDatasetorder , status, remaining} \] }** >

> find the cheapest orders for the specified dataset

_Example:_

```js
const res = await iexec.orderbook.fetchDatasetOrderbook(
  '0xf6b2bA0793C225c28a6E7753f6f67a3C68750bF1',
);
console.log('best order:', res.orders[0].order);
console.log('total orders:', res.count);
```

#### fetchWorkerpoolOrderbook

iexec.**orderbook.fetchAppOrderbook ( category: Uint256 \[, { workerpoolAddress: Address } \] )** => Promise < **{ count, orders: \[ { order: SignedApporder, status, remaining} \] }** >

> find the cheapest orders for computing resource in specified category.
>
> _Optional_: filter on specific workerpoolAddress

_Example:_

```js
const res = await iexec.orderbook.fetchWorkerpoolOrderbook('1');
console.log('best order:', res.orders[0].order);
console.log('total orders:', res.count);
```

#### fetchRequestOrderbook

iexec.**orderbook.fetchRequestOrderbook ( category: Uint256 \[, { requesterAddress: Address } \] )** => Promise < **{ count, orders: \[ { order: SignedRequestorder, status, remaining} \] }** >

> find the best paying request orders for computing resource in specified category.
>
> _Optional_: filter on specific requesterAddress

_Example:_

```js
const res = await iexec.orderbook.fetchRequestOrderbook('1');
console.log('best order:', res.orders[0].order);
console.log('total orders:', res.count);
```

#### fetchApporder

iexec.**orderbook.fetchApporder ( orderHash: Bytes32 )** => Promise < **{ order: SignedApporder, status, remaining }** >

> find a published apporder by orderHash

_Example:_

```js
const res = await iexec.orderbook.fetchApporder(
  '0x5ea856b5169486243c22ac77c778de2bdf8317fa0c52cb86c81eb06ad3854d88',
);
console.log('order:', res.order);
console.log('status:', res.status);
console.log('remaining:', res.remaining);
```

#### fetchDatasetorder

iexec.**orderbook.fetchDatasetorder ( orderHash: Bytes32 )** => Promise < **{ order: SignedDatasetorder, status, remaining }** >

> find a published datasetorder by orderHash

_Example:_

```js
const res = await iexec.orderbook.fetchDatasetorder(
  '0xe001eb5294b88c9998ee43fff116a4f7b0a05a05d4cef9382d811631fdaa7259',
);
console.log('order:', res.order);
console.log('status:', res.status);
console.log('remaining:', res.remaining);
```

#### fetchWorkerpoolorder

iexec.**orderbook.fetchWorkerpoolorder ( orderHash: Bytes32 )** => Promise < **{ order: SignedWorkerpoolorder, status, remaining }** >

> find a published workerpoolorder by orderHash

_Example:_

```js
const res = await iexec.orderbook.fetchWorkerpoolorder(
  '0x0ba665c9ae1578cdb37b89888ae25d65b06e67911f7aef30ed5cad30701f641f',
);
console.log('order:', res.order);
console.log('status:', res.status);
console.log('remaining:', res.remaining);
```

#### fetchRequestorder

iexec.**orderbook.fetchRequestorder ( orderHash: Bytes32 )** => Promise < **{ order: SignedRequestorder, status, remaining }** >

> find a published requestorder by orderHash

_Example:_

```js
const res = await iexec.orderbook.fetchRequestorder(orderHash);
console.log('order:', res.order);
console.log('status:', res.status);
console.log('remaining:', res.remaining);
```

### iexec.order

#### createApporder

iexec.**order.createApporder ( { app: Address, appprice: Uint256, volume: Uint256 \[, tag: Bytes32, datasetrestrict: Address, workerpoolrestrict: Address, requesterrestrict: Address \] } )** => Promise < **Apporder** >

> create an apporder with specified params

_Example:_

```js
const apporderToSign = await iexec.order.createApporder({
  app: '0xdBDF1FE51fd3AF9aD94fb63824EbD977518d64b3',
  appprice: '1000000000',
  volume: '1000',
});
```

#### signApporder

iexec.**order.signApporder ( apporderToSign: Apporder )** => Promise < **SignedApporder** >

> sign an apporder to produce a SignedApporder valid for the PoCo.

_Example:_

```js
const signedApporder = await iexec.order.signApporder(apporderToSign);
```

#### createDatasetorder

iexec.**order.createDatasetorder ( { dataset: Address, datasetprice: Uint256, volume: Uint256 \[, tag: Bytes32, apprestrict: Address, workerpoolrestrict: Address, requesterrestrict: Address \] } )** => Promise < **Datasetorder** >

> create a datasetorder with specified params

_Example:_

```js
const datasetorderToSign = await iexec.order.createDatasetorder({
  dataset: '0xf6b2bA0793C225c28a6E7753f6f67a3C68750bF1',
  datasetprice: '1000000000',
  volume: '1000',
});
```

#### signDatasetorder

iexec.**order.signDatasetorder ( datasetorderToSign: Datasetorder )** => Promise < **SignedDatasetorder** >

> sign a datasetorder to produce a SignedDatasetorder valid for the PoCo.

_Example:_

```js
const signedDatasetorder = await iexec.order.signDatasetorder(
  datasetorderToSign,
);
```

#### createWorkerpoolorder

iexec.**order.createWorkerpoolorder ( { workerpool: Address, workerpoolprice: Uint256, category: Uint256, volume: Uint256 \[, trust: Uint256, tag: Bytes32, apprestrict: Address, datasetrestrict: Address, requesterrestrict: Address \] } )** => Promise < **Workerpoolorder** >

> create a workerpoolorder with specified params

_Example:_

```js
const workerpoolorderToSign = await iexec.order.createWorkerpoolorder({
  dataset: '0xD34b0356D3A80De34d4fd71eF51346E468fe8cC2',
  workerpoolprice: '1000000000',
  category: '2',
  volume: '1',
});
```

#### signWorkerpoolorder

iexec.**order.signWorkerpoolorder ( workerpoolorderToSign: Workerpoolorder )** => Promise < **SignedWorkerpoolorder** >

> sign a workerpoolorder to produce a SignedWorkerpoolorder valid for the PoCo.

_Example:_

```js
const signedWorkerpoolorder = await iexec.order.signWorkerpoolorder(
  workerpoolorderToSign,
);
```

#### createRequestorder

iexec.**order.createRequestorder ( { app: Address, appmaxprice: Uint256, workerpoolmaxprice: Uint256, requester: Address, category: Uint256, volume: Uint256 \[, workerpool: Address, dataset: Address, datasetmaxprice: Uint256, beneficiary: Address, params: String, callback: Address, trust: Uint256, tag: Bytes32 \] } )** => Promise < **Requestorder** >

> create a requestorder with specified params

_Example:_

```js
const requestorderToSign = await iexec.order.createRequestorder({
  app: '0xdBDF1FE51fd3AF9aD94fb63824EbD977518d64b3',
  appmaxprice: '0',
  workerpoolmaxprice: '1000000000',
  requester: await iexec.wallet.getAddress(),
  category: '2',
  volume: '1',
  params: 'ETH USD 9 2019-09-03T08:37:00.000Z',
});
```

#### signRequestorder

iexec.**order.signRequestorder ( requestorderToSign: Requestorder )** => Promise < **SignedRequestorder** >

> sign a requestorder to produce a SignedRequestorder valid for the PoCo.

_Example:_

```js
const SignedRequestorder = await iexec.order.signRequestorder(
  requestorderToSign,
);
```

#### publishApporder

iexec.**order.publishApporder ( order: SignedApporder )** => Promise < **orderHash: Bytes32** >

> publish a SignedApporder on the offchain marketplace, the order will be available for other users

_Example:_

```js
const orderHash = await iexec.order.publishApporder(signedApporder);
console.log('order published with orderHash:', orderHash);
```

#### unpublishApporder

iexec.**order.unpublishApporder ( orderHash: Bytes32 )** => Promise < **orderHash: Bytes32** >

> unpublish a SignedApporder from the offchain marketplace, the order still valid but no longer displayed for other users (to invalidate an order on the blockchain, use cancel).

_Example:_

```js
const unpublishedOrderHash = await iexec.order.unpublishApporder(orderHash);
```

#### cancelApporder

iexec.**order.cancelApporder ( order: SignedApporder )** => Promise < **Boolean** >

> cancel a SignedApporder on the blockchain.

_Example:_

```js
await iexec.order.cancelApporder(signedApporder);
```

#### publishDatasetorder

iexec.**order.publishDatasetorder ( order: SignedDatasetorder )** => Promise < **orderHash: Bytes32** >

> publish a SignedDatasetorder on the offchain marketplace, the order will be available for other users

_Example:_

```js
const orderHash = await iexec.order.publishDatasetorder(signedDatasetorder);
console.log('order published with orderHash:', orderHash);
```

#### unpublishDatasetorder

iexec.**order.unpublishDatasetorder ( orderHash: Bytes32 )** => Promise < **orderHash: Bytes32** >

> unpublish a SignedDatasetorder from the offchain marketplace, the order still valid but no longer displayed for other users (to invalidate an order on the blockchain, use cancel).

_Example:_

```js
const unpublishedOrderHash = await iexec.order.unpublishDatasetorder(orderHash);
```

#### cancelDatasetorder

iexec.**order.cancelDatasetorder ( order: SignedDatasetorder )** => Promise < **Boolean** >

> cancel a SignedDatasetorder on the blockchain.

_Example:_

```js
await iexec.order.cancelDatasetorder(signedDatasetorder);
```

#### publishWorkerpoolorder

iexec.**order.publishWorkerpoolorder ( order: SignedWorkerpoolorder )** => Promise < **orderHash: Bytes32** >

> publish a SignedWorkerpoolorder on the offchain marketplace, the order will be available for other users

_Example:_

```js
const orderHash = await iexec.order.publishWorkerpoolorder(
  signedWorkerpoolorder,
);
console.log('order published with orderHash:', orderHash);
```

#### unpublisWorkerpoolorder

iexec.**order.unpublisWorkerpoolorder ( orderHash: Bytes32 )** => Promise < **orderHash: Bytes32** >

> unpublish a SignedWorkerpoolorder from the offchain marketplace, the order still valid but no longer displayed for other users (to invalidate an order on the blockchain, use cancel).

_Example:_

```js
const unpublishedOrderHash = await iexec.order.unpublisWorkerpoolorder(
  orderHash,
);
```

#### cancelWorkerpoolorder

iexec.**order.cancelWorkerpoolorder ( order: SignedWorkerpoolorder )** => Promise < **Boolean** >

> cancel a SignedWorkerpoolorder on the blockchain.

_Example:_

```js
await iexec.order.cancelWorkerpoolorder(signedWorkerpoolorder);
```

#### publishRequestorder

iexec.**order.publishRequestorder ( order: SignedRequestorder )** => Promise < **orderHash: Bytes32** >

> publish a SignedRequestorder on the offchain marketplace, the order will be available for other users

_Example:_

```js
const orderHash = await iexec.order.publishRequestorder(signedRequestorder);
console.log('order published with orderHash:', orderHash);
```

#### unpublishRequestorder

iexec.**order.unpublishRequestorder ( orderHash: Bytes32 )** => Promise < **orderHash: Bytes32** >

> unpublish a SignedRequestorder from the offchain marketplace, the order still valid but no longer displayed for other users (to invalidate an order on the blockchain, use cancel).

_Example:_

```js
const unpublishedOrderHash = await iexec.order.unpublishRequestorder(orderHash);
```

#### cancelRequestorder

iexec.**order.cancelRequestorder ( order: SignedRequestorder )** => Promise < **Boolean** >

> cancel a SignedRequestorder on the blockchain.

_Example:_

```js
await iexec.order.cancelRequestorder(signedRequestorder);
```

#### matchOrders

iexec.**order.matchOrders ( { apporder: SignedApporder, workerpoolorder: SignedWorkerpoolorder, requestorder: SignedRequestorder \[, datasetorder: SignedDatasetorder \]} )** => Promise < **{ dealid, volume }** >

> make a deal on-chain with compatible orders and trigger off-chain computation.

_Example:_

```js
const res = await iexec.order.matchOrders(
  signedApporder,
  signedDatasetorder,
  signedRequestorder,
);
console.log('deal:', res.dealid);
```

### iexec.deal

#### show

iexec.**deal.show ( dealid: Bytes32 )** => Promise < **{ app : { pointer: Address, owner: Address, price }, dataset : { pointer: Address, owner: Address, price }, workerpool : { pointer: Address, owner: Address, price }, trust, category, tag, requester, beneficiary, callback, params, startTime, botFirst, botSize, workerStake, schedulerRewardRatio, tasks: \[...taskid\] }** >

> show the details of a deal.

_Example:_

```js
const deal = await iexec.deal.show(
  '0xe0ebfa1177a5997434fe14b5e88897950e07ff82e6976a024b07f30063249a1e',
);
console.log('deal:', deal);
```

#### computeTaskId

iexec.**deal.computeTaskId ( dealid: Bytes32, taskIdx: Uint256 )** => Promise < **taskid: Bytes32** >

> compute the taskid of the task with index taskIdx of specified deal.

_Example:_

```js
const taskid = await iexec.deal.computeTaskId(
  '0xe0ebfa1177a5997434fe14b5e88897950e07ff82e6976a024b07f30063249a1e',
  '0',
);
console.log('taskid:', taskid);
```

#### fetchRequesterDeals

iexec.**deal.fetchRequesterDeals ( requesterAddress: Address, \[ { appAddress: Address, datasetAddress: Address, workerpoolAddress: Address } \] )** => Promise < **{ count, deals: \[ ...Deals \]}** >

> show the last deals of the specified requester.
>
> _Optional_: filter by appAddress, datasetAddress, workerpoolAddress.

_Example:_

```js
const res = await iexec.deal.fetchRequesterDeals(
  await iexec.wallet.getAddress(),
);
console.log('deals count:', res.count);
console.log('last deal:', res.deals[0]);
```

### iexec.task

#### show

iexec.**task.show ( taskid: Bytes32 )** => Promise < **{ status, dealid, idx, resultDigest, results, statusName }** >

> show the details of a task.

_Example:_

```js
const task = await iexec.task.show(
  '0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19',
);
console.log('task:', task);
```

#### claim

iexec.**task.claim ( taskid: Bytes32 )** => Promise < **TxHash** >

> claim a task not completed after the final deadline (refund RLC for the requester and the workers).

_Example:_

```js
await iexec.task.claim(
  '0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19',
);
```

#### fetchResults

iexec.**task.claim ( taskid: Bytes32 \[, { ipfsGatewayURL: URL }\] )** => Promise < **fetchResponse: Response** >

> download the specified task result.
>
> _Optional_: overwrite the ipfs gateway to use for results stored on ipfs.

_Example:_

```js
const res = await iexec.task.fetchResults(
  '0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19',
);
const binary = await res.blob();
```

#### waitForTaskStatusChange

iexec.**task.waitForTaskStatusChange ( taskid: Bytes32, initialStatus: Uint256 )** => Promise < **{ status: Uint256, statusName: String }** >

> wait until the status of specified task change.

_Example:_

```js
const res = await iexec.task.fetchResults(
  '0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19',
  '1',
);
console.log('task status is', res.statusName);
```

### iexec.app

#### show

iexec.**app.show ( appAddress: Address )** => Promise < **{ objAddress: Address, app: { appName, appMultiaddr, appChecksum, owner, appMREnclave, appType } }** >

> show the details of an app.

_Example:_

```js
const { app } = await iexec.app.show(
  '0x917D71168fF60A10afD684d8D815b4A78097225D',
);
console.log('app:', app);
```

#### deploy

iexec.**app.deploy ( app: App )** => Promise < **Address** >

> deploy an app on the blockchain.

_Example:_

```js
const address = await iexec.app.deploy({
  owner: await iexec.wallet.getAddress(),
  name: 'My app',
  type: 'DOCKER',
  multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
  checksum:
    '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
  mrenclave: '',
});
console.log('deployed at', address);
```

### iexec.dataset

#### show

iexec.**dataset.show ( datasetAddress: Address )** => Promise < **{ objAddress: Address, dataset: { datasetName, datasetMultiaddr, datasetChecksum, owner } }** >

> show the details of a dataset.

_Example:_

```js
const { dataset } = await iexec.dataset.show(
  '0xf6b2bA0793C225c28a6E7753f6f67a3C68750bF1',
);
console.log('dataset:', dataset);
```

#### deploy

iexec.**dataset.deploy ( dataset: Dataset )** => Promise < **Address** >

> deploy a dataset on the blockchain.

_Example:_

```js
const address = await iexec.dataset.deploy({
  owner: await iexec.wallet.getAddress(),
  name: 'My dataset',
  multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
  checksum:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
});
console.log('deployed at', address);
```

### iexec.workerpool

#### show

iexec.**workerpool.show ( workerpoolAddress: Address )** => Promise < **{ objAddress: Address, workerpool: { workerpoolDescription, owner } }** >

> show the details of a workerpool.

_Example:_

```js
const { workerpool } = await iexec.workerpool.show(
  '0xD34b0356D3A80De34d4fd71eF51346E468fe8cC2',
);
console.log('workerpool:', workerpool);
```

#### deploy

iexec.**workerpool.deploy ( workerpool: Workerpool )** => Promise < **Address** >

> deploy a workerpool on the blockchain.

_Example:_

```js
const address = await iexec.workerpool.deploy({
  owner: await iexec.wallet.getAddress(),
  description: 'My workerpool',
});
console.log('deployed at', address);
```

### Types

#### BN

`BN` is instance of `bn.js` it allows big numbers manipulation in js (see [bn.js](https://www.npmjs.com/package/bn.js)).

`BN` constructor can be imported from iexec:

```js
import { utils } from 'iexec';
const { BN } = utils;
```

#### Address

`Address` is a "0x" prefixed checksummed ethereum address. Any valid ethereum address can be used as argument of methods requiring `Address` (ENS is not supported).

#### Bytes32

`Bytes32` is a "0x" prefixed hexadecimal string representation of 32 bytes.

#### TxHash

`TxHash` is an ethereum transaction hash.

#### Uint256

`Uint256` is a decimal string representation of a 256 bit unsigned integer.

Accepted:

- Number
- String
- BN

#### Multiaddress

`Multiaddress` is resource address representation [multiaddr](https://github.com/multiformats/js-multiaddr).

Accepted:

- url as string
- multiaddr string representation
- multiaddr().buffer

#### App

`App` is an object representation of an app.

```js
{
  owner: Address,
  name: String,
  type: String, // only "DOCKER" is supported
  multiaddr: Multiaddress,
  checksum: Bytes32,
  mrenclave: String,
}
```

#### Apporder

`Apporder` is an object representation of an apporder not signed.

```js
{
  app: Address,
  appprice: Uint256,
  volume: Uint256,
  tag: Bytes32,
  datasetrestrict: Address,
  workerpoolrestrict: Address,
  requesterrestrict: Address
}
```

#### Dataset

`Dataset` is an object representation of a dataset.

```js
{
  owner: Address,
  name: String,
  multiaddr: Multiaddress,
  checksum: Bytes32
}
```

#### Workerpool

`Workerpool` is an object representation of a workerpool.

```js
{
  owner: Address,
  description: String
}
```

#### Category

`Category` is an object representation of a category.

```js
{
  name: String,
  description: String,
  workClockTimeRef: Uint253
}
```

#### SignedApporder

`SignedApporder` is an object representation of a signed apporder.

```js
{
  app: Address,
  appprice: Uint256,
  volume: Uint256,
  tag: Bytes32,
  datasetrestrict: Address,
  workerpoolrestrict: Address,
  requesterrestrict: Address,
  salt: Bytes32,
  sign: HexString
}
```

#### Datasetorder

`Datasetorder` is an object representation of a datasetorder not signed.

```js
{
  dataset: Address,
  datasetprice: Uint256,
  volume: Uint256,
  tag: Bytes32,
  apprestrict: Address,
  workerpoolrestrict: Address,
  requesterrestrict: Address,
}
```

#### SignedDatasetorder

`SignedApporder` is an object representation of a signed datasetorder.

```js
{
  dataset: Address,
  datasetprice: Uint256,
  volume: Uint256,
  tag: Bytes32,
  apprestrict: Address,
  workerpoolrestrict: Address,
  requesterrestrict: Address,
  salt: Bytes32,
  sign: HexString
}
```

#### Workerpoolorder

`Workerpoolorder` is an object representation of a workerpoolorder not signed.

```js
{
  workerpool: Address,
  workerpoolprice: Uint256,
  volume: Uint256,
  tag: Bytes32,
  category: Uint256,
  trust: Uint256,
  apprestrict: Address,
  datasetrestrict: Address,
  requesterrestrict: Address,
}
```

#### SignedWorkerpoolorder

`SignedWorkerpoolorder` is an object representation of a signed workerpoolorder.

```js
{
  workerpool: Address,
  workerpoolprice: Uint256,
  volume: Uint256,
  tag: Bytes32,
  category: Uint256,
  trust: Uint256,
  apprestrict: Address,
  datasetrestrict: Address,
  requesterrestrict: Address,
  salt: Bytes32,
  sign: HexString
}
```

#### Requestorder

`Requestorder` is an object representation of a requestorder not signed.

```js
{
  app: Address,
  appmaxprice: uint256S,
  dataset: Address,
  datasetmaxprice: uint256,
  workerpool: Address,
  workerpoolprice: Uint256,
  requester: Address,
  volume: Uint256,
  tag: Bytes32,
  category: Uint256,
  trust: Uint256,
  beneficary: Address,
  callback: Address,
  params: String,
}
```

#### SignedRequestorder

`SignedRequestorder` is an object representation of a signed requestorder.

```js
{
  app: Address,
  appmaxprice: uint256S,
  dataset: Address,
  datasetmaxprice: uint256,
  workerpool: Address,
  workerpoolprice: Uint256,
  requester: Address,
  volume: Uint256,
  tag: Bytes32,
  category: Uint256,
  trust: Uint256,
  beneficary: Address,
  callback: Address,
  params: String,
  salt: Bytes32,
  sign: HexString
}
```

### Errors

iexec sdk use typed errors, errors constructors are accessible through import.

```js
import { errors } from 'iexec';
const {
  ObjectNotFoundError,
  ValidationError,
  Web3ProviderError,
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
} = errors;
```

#### ObjectNotFoundError

`ObjectNotFoundError` is thrown when trying to access an unexisting resource.

Specific properties:

- `error.objName`: type of object trying to access
- `error.chainId`: chain id of the blockchain where the object is supposed to be
- `error.objectId` : id used to find the object

#### ValidationError

`ValidationError` is thrown when a method is called with missing or unexpected parameters.

#### Web3ProviderError

`Web3ProviderError` encapsulate a web3 provider exception.

Specific properties:

- `error.originalError`: the original exception from the web3Provider.

#### Web3ProviderCallError

`Web3ProviderCallError` extends the `Web3ProviderError`, this `Error` is thrown when an exception is catched during a web3 call.

Reasons:

- network failure
- unexpected args

#### Web3ProviderCallError

`Web3ProviderSendError` extends the `Web3ProviderError`, this `Error` is thrown when an exception is catched during a web3 send transaction.

Reasons:

- user denied tx signature
- not enough gas
- transaction revert

#### Web3ProviderSignMessageError

`Web3ProviderSignMessageError` extends the `Web3ProviderError`, this `Error` is thrown when an exception is catched during a web3 message signature.

Reasons:

- user denied message signature
- method not supported by the web3 provider

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
