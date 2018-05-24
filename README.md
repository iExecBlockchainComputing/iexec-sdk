![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK V2

[![Build Status](https://drone.iex.ec//api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows developers to interact with iExec decentralized marketplace in order to run off-chain computations.

## Ressources

* The iExec Explorer: https://explorer.iex.ec
* The iExec Marketplace
* The iExec Dapp Store: https://dapps.iex.ec
* The iExec Pools registry
* The RLC faucet: https://faucet.iex.ec
* iExec main documentation: https://docs.iex.ec
* The iExec [JS smart contracts client lib](https://github.com/iExecBlockchainComputing/iexec-contracts-js-client) to interact with iExec smart contracts (without the SDK)
* The iExec [JS client lib](https://github.com/iExecBlockchainComputing/iexec-server-js-client) to interact with iExec server (without the SDK)
* [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry), to apply for Dapp Store listing

## Install

#### Using Nodejs

Requirements: [![npm version](https://img.shields.io/badge/nodejs-%3E=%206.4.0-brightgreen.svg)](https://nodejs.org/en/) and [Git](https://git-scm.com/).

```bash
npm -g install iexec@next # install the cli
iexec --version
iexec --help
```

> Windows users need to create an alias by running `for /f "delims=|" %i in ('where iexec') do doskey iex="%i" $*` to avoid a naming conflict. Then always use `iex` instead of `iexec` when using the SDK.

#### Using Docker

Requirements: [Docker](https://docs.docker.com/install/).

```bash
# For Linux users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v $(pwd):/iexec-project -w /iexec-project iexechub/iexec-sdk:next'"'"'' >> ~/.bashrc && source ~/.bashrc
# For Mac OSX users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v $(pwd):/iexec-project -w /iexec-project iexechub/iexec-sdk:next'"'"'' >> ~/.bash_profile && source ~/.bash_profile
```

Now run `iexec --version` to check all is working.

## Upgrade

* **Nodejs**: run `npm -g install iexec@next`
* **Docker**: run `docker pull iexechub/iexec-sdk:next`

# iExec SDK API

## Help

```bash
iexec --help
iexec --version
```

## init

To interact with the [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry)

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
iexec wallet create
iexec wallet getETH
iexec wallet getRLC
iexec wallet show [address] # optional address to show other people's wallet
iexec wallet sendETH <amount> --to <eth_address>
iexec wallet sendRLC <amount> --to <eth_address>
iexec wallet sweep --to <eth_address> # drain all ETH and RLC, sending them back to iExec faucet by default
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

## order

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --sell
# --buy
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
iexec work show [address] # show a work
iexec work download [address] # download a work result
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

## server

```bash
iexec server version # get server version
iexec server deploy # deploy legacy app only to iExec server
iexec server uploadData <data_path> # direct data upload
iexec server submit --app <app_uid> # direct work submit
iexec server result <workUID> --watch --save [fileName]# direct result
iexec server api <fnName> [arg1] [arg2] ... # directly call api method
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
