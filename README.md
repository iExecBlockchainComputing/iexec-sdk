![iExec SDK logo](./iexec_sdk_logo.jpg)

# iExec SDK

[![Build Status](https://drone.iex.ec//api/badges/iExecBlockchainComputing/iexec-sdk/status.svg)](https://drone.iex.ec/iExecBlockchainComputing/iexec-sdk)
[![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec) [![npm version](https://img.shields.io/npm/dm/iexec.svg)](https://www.npmjs.com/package/iexec) [![license](https://img.shields.io/github/license/iExecBlockchainComputing/iexec-sdk.svg)](LICENSE) [![Twitter Follow](https://img.shields.io/twitter/follow/iex_ec.svg?style=social&label=Follow)](https://twitter.com/iex_ec)

The iExec SDK is a CLI and a JS library that allows developers to interact with iExec decentralized marketplace in order to run off-chain computations.

## Ressources

* The iExec Dapp Store: https://dapps.iex.ec
* The iExec explorer: https://explorer.iex.ec
* The RLC faucet: https://faucet.iex.ec
* iExec main documentation: https://docs.iex.ec
* The [JS client lib](https://github.com/iExecBlockchainComputing/iexec-server-js-client) to interact with iExec server (without the SDK)
* [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry)

## Install

#### Using Nodejs

Requirements: [![npm version](https://img.shields.io/badge/nodejs-%3E=%206.4.0-brightgreen.svg)](https://nodejs.org/en/) and [Git](https://git-scm.com/).

```bash
npm -g install iexec # install the cli
iexec --version
iexec --help
```

> Windows users need to create an alias by running `for /f "delims=|" %i in ('where iexec') do doskey iex="%i" $*` to avoid a naming conflict. Then always use `iex` instead of `iexec` when using the SDK.

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

* **Nodejs**: run `npm -g install iexec`
* **Docker**: run `docker pull iexechub/iexec-sdk`

## Init & Wallet setup

Before any use of the SDK, make sure you did run once the below steps:

```bash
iexec init # init a project
cd iexec-init # enter the project
iexec wallet create # create a wallet
iexec wallet getETH # get some ETH
iexec wallet getRLC # get some RLC
iexec wallet show # check you received the tokens
iexec account allow 5 # credit your account with RLC
iexec account show # check your iExec account balance
```

## Use an existing dapp

Go checkout the [run a dapp tutorial](https://katacoda.com/sulliwane/scenarios/run-dapp), recap below:

After the init steps, go to [iExec dapp store](https://dapps.iex.ec) and find the dapp you'd like to use, say [ffmpeg](https://dapps.iex.ec/dapp/jeremy_toussaint/ffmpeg):

1.  Copy its ethereum address by clicking on the network #tag (ropsten, rinkeby, mainnet).
2.  Replace your local `iexec.js` with the one of the dapp (you can find it on the [github page of the dapp](https://github.com/iExecBlockchainComputing/iexec-dapp-samples/tree/ffmpeg#readme))

And submit your work to the dapp address:

```bash
iexec submit --dapp <dapp_address>
```

Finally, copy the transaction hash given by the SDK and check the progress of your work:

```bash
iexec result <txHash> --dapp <dapp_address>
```

Note: The [iExec explorer](https://explorer.iex.ec/) provides a more visual experience.

## Deploy and run an existing dapp

Go checkout the [Hello World tutorial](https://www.katacoda.com/sulliwane/scenarios/hello-world)

## Craft and deploy your own custom dapp

Go checkout the [Ffmpeg step by step tutorial](https://www.katacoda.com/sulliwane/scenarios/ffmpeg)

# iExec SDK API

## Help

```bash
iexec --help
iexec --version
```

## init

To interact with the [iExec dapps registry](https://github.com/iExecBlockchainComputing/iexec-dapps-registry)

```bash
iexec init # pull a basic project
iexec init factorial # pull factorial branch from iExec dapp registry
iexec init <branch> --repo <my_github_repo> # pull from custom dapp registry
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
iexec app create # create new app
iexec app show <address> # show app details
iexec app show <index> # show app details by index
iexec app count --user <userAddress> # count user total number of app
```

## dataset

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --user <address>
iexec dataset create # create new dataset
iexec dataset show <address> # show dataset details
iexec dataset show <index> # show dataset details by index
iexec dataset count --user <userAddress> # count user total number of dataset
```

## category

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
iexec category create # create new category
iexec category show <index> # show category details by index
iexec category count # count hub total number of category
```

## workerpool

```bash
# OPTIONS
# --chain <chainName>
# --hub <address>
# --user <address>
iexec workerpool create # create new workerpool
iexec workerpool show <address> # show workerpool details
iexec workerpool show <index> # show workerpool details by index
iexec workerpool count --user <userAddress> # count user total number of workerpool
```

## submit

```bash
iexec submit --chain ropsten # submit work to your own dapp
iexec submit --dapp 0xE22F4...  --chain ropsten # submit work to someone else dapp address
```

## result

You need the txHash of a work submission in order to check its result:

```bash
iexec result <txHash> --chain ropsten # this will log the result data
iexec result <txHash> --watch --save [fileName] --chain ropsten # this will download the result locally
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
