[< Back home](./README.md)

# iExec SDK CLI

Use the iExec decentralized marketplace for off-chain computing from your terminal.

## Content

- [Install](#install)
- [Upgrade](#upgrade)
- [Quick start](#quick-start)
- [API](#api)
- [Files](#files)
- [Interoperability](#interoperability)

---

# Install

All three major OS are supported (linux, OSX, windows).

## Using Nodejs

Requirements: [![npm version](https://img.shields.io/badge/nodejs-%3E=18.0.0-brightgreen.svg)](https://nodejs.org/en/).

```bash
npm -g install iexec # install the cli
iexec --version
iexec --help
```

## Using Docker

Requirements: [Docker](https://docs.docker.com/install/).

```bash
# For Linux users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v /tmp:/tmp -v $(pwd):/iexec-project -v /home/$(whoami)/.ethereum/keystore:/home/node/.ethereum/keystore -w /iexec-project iexechub/iexec-sdk:latest'"'"'' >> ~/.bash_aliases && source ~/.bashrc
# For Mac OSX users
echo 'alias iexec='"'"'docker run -e DEBUG=$DEBUG --interactive --tty --rm -v /tmp:/tmp -v $(pwd):/iexec-project -v /Users/$(whoami)/Library/Ethereum/keystore:/home/node/.ethereum/keystore -w /iexec-project iexechub/iexec-sdk:latest'"'"'' >> ~/.bash_profile && source ~/.bash_profile
```

Now run `iexec --version` to check all is working.

## Upgrade

- **Nodejs**: run `npm -g install iexec`
- **Docker**: run `docker pull iexechub/iexec-sdk`

---

# Quick start

- [Init project](#init-project)
- [SDK CLI for Dapp developers](#sdk-cli-for-dapp-developers)
- [SDK CLI for Dataset providers](#sdk-cli-for-dataset-providers)
- [SDK CLI for Workerpools](#sdk-cli-for-workerpools)
- [SDK CLI for Requesters](#sdk-cli-for-requesters)
- [SDK CLI for workers](#sdk-cli-for-workers)

## Init project

required steps before following any other workflow.

```bash
iexec init # create all required files
iexec wallet show # show your wallet
iexec storage init # initialize your remote storage
```

> _NB:_ iExec SDK CLI access the public blockchain (mainnet) through [ethers](https://github.com/ethers-io/ethers.js/) to connect different backends ([Alchemy](https://alchemyapi.io/), [Etherscan](https://etherscan.io/), [INFURA](https://infura.io/)).
>
> Default API keys for backend services are provided for convenience.
> As these keys are shared across all users and are subject to rate limits, **you must use your own API keys** or better **your own node**.
>
> Get API keys for backend services:
>
> - [INFURA](https://infura.io/register) ([more details on Infura's blog](https://blog.infura.io/getting-started-with-infura-28e41844cc89/))
> - [Etherscan](https://etherscan.io/apis)
> - [Alchemy](https://alchemyapi.io/signup)
>
> Once you created your access, you can add your API keys in the `chains.json` configuration file:
>
> ```json
> {
>    "default": ...,
>    "chains": { ... },
>    "providers": {
>      "infura": {
>        "projectId": "INFURA_PROJECT_ID",
>        "projectSecret": "INFURA_PROJECT_SECRET"
>       },
>     "etherscan": "ETHERSCAN_API_KEY",
>     "alchemy": "ALCHEMY_API_KEY"
>    }
> }
> ```
>
> If you run your own node, you can add an `host` key in the `chains.json` configuration file to target your node:
>
> ```json
> {
>    "default": ...,
>    "chains": {
>       ...
>       "mainnet": {
>         "id": "1",
>         "host": "http://localhost:8545"
>       }
>    }
> }
> ```
>
> Check your current host:
> `iexec info`

## SDK CLI for Dapp developers

First go through [Init project](#init-project)

### Deploy an app

```bash
iexec app count # check if you have already deployed apps
iexec app init # reset app fields in iexec.json
iexec app deploy # deploy app on Ethereum and get an address
iexec app show # show details of deployed app
```

### Run an app

```bash
iexec app run [address] # run an application on iExec at market price
```

### Sell your app on the Marketplace

```bash
iexec orderbook app <address> # check if you have valid sell orders for your app on the Marketplace
iexec app publish [address] # publish an apporder on the Marketplace and get an orderHash
iexec order show --app [orderHash] # show your order on the Marketplace
iexec order cancel --app <orderHash> # cancel your order
```

## SDK CLI for Dataset providers

First go through [Init project](#init-project)

### Encrypt your dataset

```bash
cp 'myAwesomeDataset.file' ./datasets/original # copy your dataset file or folder into the dataset/original/ folder
iexec dataset encrypt # generate a secret key for each file or folder in dataset/original/ and encrypt it, also output the encrypted file checksum to use for deployment.
cat ./.secrets/dataset/myAwesomeDataset.file.secret # this is the secret key for decrypting the dataset
cat ./datasets/encrypted/myAwesomeDataset.file.enc # this is the encrypted dataset, you must share this file at a public url
```

### Deploy your dataset

```bash
iexec dataset count # check if you have already deployed datasets
iexec dataset init # reset dataset fields in iexec.json
iexec dataset deploy # deploy dataset on Ethereum
iexec dataset show # show details of deployed dataset
```

## Securely share the dataset secret key

**Disclaimer:** The secrets pushed in the Secret Management Service will be shared with the worker to process the dataset in the therms your specify in the dataset order. Make sure to always double check your selling policy in the dataset order before signing it.

```bash
iexec dataset push-secret # Push the secret in the Secret Management Service (sms)
```

### Sell your dataset on the Marketplace

```bash
iexec orderbook dataset <address> # check if you have valid sell orders for your dataset on the Marketplace
iexec dataset publish [address] --tag tee --app-restrict <address> # publish a datasetorder (restricted to specific app running in Trusted Execution Environment) on the Marketplace and get an orderHash
iexec order show --dataset [orderHash] # show your order on the Marketplace
iexec order cancel --dataset <orderHash> # cancel your order
```

## SDK CLI for Workerpools

First go through [Init project](#init-project)

### Deploy a workerpool

```bash
iexec workerpool count # check if you have already deployed workerpools
iexec workerpool init # reset workerpool fields in iexec.json
iexec workerpool deploy # deploy workerpool on Ethereum
iexec workerpool show # show details of deployed workerpool
```

### Sell your computing power at limit price on the Marketplace

```bash
iexec orderbook workerpool [address] --category <id> # check if you have valid sell orders for your workerpool on the Marketplace
iexec workerpool publish # publish a workerpoolorder on the Marketplace and get an orderHash
iexec order cancel --workerpool <orderHash> # cancel your order
```

### Sell your computing power at market price on the Marketplace

```bash
iexec orderbook requester --category <id> # find a requestorder ask you want to fill in your category
iexec orderbook app <address> #  find a compatible apporder
iexec orderbook dataset <address> #  find a compatible datasetorder
iexec order init --workerpool # reset workerpoolorder fields in iexec.json
iexec order sign --workerpool # sign your workerpoolorder
iexec order fill --request <orderHash> --app <orderHash> --dataset <orderHash> # send the orders and get a dealid
iexec deal show <dealid> # show the detail of the deal you concludes
```

## SDK CLI for Requesters

First go through [Init project](#init-project)

### Top up your iExec account to buy computation

```bash
iexec account show # show your iExec account
iexec account deposit 200 # deposit RLC from your wallet to your account
iexec account show # make sure you have enough staked RCL to buy computation
```

### Buy computation at market price on the Marketplace

```bash
iexec app run [address] [--dataset [address] --args <args> --category <id> --input-files <fileURLs> --secret <secretMapping...>] # run an iExec application at market price
```

see [app run available options](#iexec-app-run)

### Or Buy computation at limit price on the Marketplace

```bash
iexec app request-execution [address] [--dataset [address] --args <args> --category <id> --input-files <fileURLs> --secret <secretMapping...>] # publish a requestorder on the Marketplace and get an orderHash
iexec order show --request <orderHash> --deals # show your order on the Marketplace and check the deals
```

### Watch your Deals, your Tasks and download the results

```bash
iexec deal show <dealid> # show your deal details, get the taskids
iexec task show <taskid> # show the status of your task
iexec task show <taskid> --watch # wait until the task is COMPLETED or FAILED
iexec task show <taskid> --download [fileName] # download the result of your COMPLETED task
```

### Use results encryption

```bash
iexec result generate-encryption-keypair # generate private/public RSA key pair for result encryption
iexec result push-encryption-key # share the public RSA key with the secret management service, all your results will be encrypted with this key
# Go through the normal buy process  and download the result of the computation #
iexec result decrypt [encryptedResultsFilePath] # decrypt the result with the private RSA key
```

## SDK CLI for workers

First go through [Init project](#init-project)

### Top up your iExec account to stake

```bash
iexec account deposit 200 # deposit RLC from your wallet to your account
iexec account show # make sure you have enough stake to join a workerpool
```

### Withdraw your working reward

```bash
iexec account show # view your available stake
iexec account withdraw 1000 # withdraw RLC from your account to your wallet
```

---

# API

%CLI_API_GENERATED_DOC%

---

# Files

- [wallet](#wallet)
- [iexec.json](#iexecjson)
- [chain.json](#chainjson)
- [orders.json](#ordersjson)
- [deployed.json](#deployedjson)
- [.secrets/](#secrets)
  - [.secrets/datasets/](#secretsdatasets)
  - [.secrets/beneficiary/](#secretsbeneficiary)
- [datasets/](#datasets)
  - [datasets/original/](#datasetsoriginal)
  - [datasets/encrypted/](#datasetsencrypted)

## wallet

To write on the blockchain, prove their identity and manage their assets, iExec's users need a wallet.

Wallet files are generated by [iexec init](#iexec-init) and [iexec wallet](#iexec-wallet) commands and stored in the Ethereum keystore.

The keystore location depends on your OS:

- Linux : ~/.ethereum/keystore
- Mac: ~/Library/Ethereum/keystore
- Windows: ~/AppData/Roaming/Ethereum/keystore

## iexec.json

The `iexec.json` file, located in every iExec project, describes the parameters used when creating a [app|dataset|category|workerpool], or when signing an order.

```json
{
  "app": {
    "owner": "0xF048eF3d7E3B33A465E0599E641BB29421f7Df92",
    "name": "VanityGen",
    "type": "DOCKER",
    "multiaddr": "registry.hub.docker.com/iexechub/vanitygen:1.0.0",
    "checksum": "0x762a451c05e0d8097b35d6376e748798b5dc6a13290439cf67d5202f7c6f695f"
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
      "params": "{ \"iexec_args\": \"--help\" }"
    }
  }
}
```

## chain.json

The `chain.json` file, located in every iExec project, describes the parameters used when communicating with ethereum nodes and iExec Secret Management Services. They are ordered by chain name, accessible by using the `--chain <chainName>` option for each command of the SDK.

- `default` set the default chain used by the SDK cli.
- `chains` set the available chains
  - optional key `host` set the url of the ethereum node used by the SDK cli on each chain (overwrite default value).
  - optional key `hub` set the address of the hub used by the SDK cli on each chain (overwrite default value).
  - optional key `sms` set the url of the Secret Management Service used by the SDK cli on each chain (overwrite default value), this key accepts a string or a mapping TEE framework - SMS url.
  - optional key `resultProxy` set the url of the Result Proxy used by the SDK cli on each chain (overwrite default value).
  - optional key `iexecGateway` set the url of the iexec marketplace gateway used by the SDK cli on each chain (overwrite default value).
  - optional key `ipfsGateway` set the url of the IPFS gateway used by the SDK cli on each chain (overwrite default value).
  - optional key `pocoSubgraph` set the url of the PoCo subgraph used by the SDK cli on each chain (overwrite default value).
  - optional key `voucherSubgraph` set the url of the voucher subgraph used by the SDK cli on each chain (overwrite default value).
  - optional key `bridge` set the bridge used by the SDK cli when working with bridged networks (sidechain). `bridge.contract` set the address of the RLC bridge on the chain, `bridge.bridgedChainName` set the reference to the bridged network.
  - optional key `voucherHub` set the address of the voucher hub contract used by the SDK cli on each chain (overwrite default value).
  - optional key `native` specify whether or not the chain native token is RLC (overwrite default value: chain value or `false`).
  - optional key `useGas` specify whether or not the chain requires to spend gas to send a transaction (overwrite default value: chain value or `true`).
- optional key `providers` set the backends for public chains
  - optional key `alchemy` set Alchemy API Token
  - optional key `etherscan` set Etherscan API Token
  - optional key `infura` set INFURA Project ID or ProjectID and Project Secret
  - optional key `quorum` set minimum number of backends that must agree before forwarding blockchain responses

```json
{
  "default": "bellecour",
  "chains": {
    "dev": {
      "host": "http://localhost:8545",
      "id": "65535",
      "sms": {
        "scone": "http://localhost:5000"
      },
      "resultProxy": "http://localhost:8089",
      "ipfsGateway": "http://localhost:8080",
      "hub": "0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca",
      "bridge": {
        "contract": "0x1e32aFA55854B6c015D284E3ccA9aA5a463A1418",
        "bridgedChainName": "dev-sidechain"
      }
    },
    "dev-sidechain": {
      "host": "http://localhost:18545",
      "id": "123456",
      "sms": {
        "scone": "http://localhost:15000"
      },
      "resultProxy": "http://localhost:18089",
      "ipfsGateway": "http://localhost:18080",
      "native": true,
      "useGas": false,
      "hub": "0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca",
      "bridge": {
        "contract": "0x1e32aFA55854B6c015D284E3ccA9aA5a463A1418",
        "bridgedChainName": "development"
      }
    },
    "mainnet": {},
    "bellecour": {}
  },
  "providers": {
    "alchemy": "ALCHEMY_API_KEY",
    "etherscan": "ETHERSCAN_API_KEY",
    "infura": {
      "projectId": "INFURA_PROJECT_ID",
      "projectSecret": "INFURA_PROJECT_SECRET"
    },
    "quorum": 1
  }
}
```

## deployed.json

The `deployed.json` file, located in iExec project, locally stores your latest deployed resources address. These address are used when you run a command without specifying a resource address (example: `iexec app show` will show the app in `deployed.json`).

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

## orders.json

The `orders.json` file, located in iExec project, locally stores your latest signed orders. This file is used when you publish an order on the Marketplace and when you fill orders without specified orders from the Marketplace.

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
      "params": "--help",
      "requester": "0x0000000000000000000000000000000000000000",
      "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "sign": "0x"
    }
  }
}
```

## ./secrets/

This folder is created when running `iexec result generate-encryption-keypair` or `iexec dataset init --tee` and is intended to store credentials generated by the iexec SDK CLI.

### ./secrets/beneficiary/

This folder stores the key pair to use for result encryption and decryption.
A key pair is generated when running `iexec result generate-encryption-keypair`
Public keys name follow the pattern _userAddress_\_key.pub , this key is shared with the workers when running `iexec result push-encryption-key`
Private keys name follow the pattern _userAddress_\_key this should never be shared with third party, the private key is used by the SDK CLI to decrypt a result when running `iexec result decrypt`.

### ./secrets/datasets/

This folder stores the AES keys used for dataset encryption.
A key is generated for each dataset file when running `iexec dataset encrypt`.
The key file is named after the dataset file name, last key generated is also stored in `./secrets/datasets/dataset.key` to be used as default secret to share with workers when running `iexec dataset push-secret`.

## ./datasets/

This folder is created when running `iexec dataset init --tee` and is intended to store datasets files.

### ./datasets/original/

Paste your original dataset files in this folder and run `iexec dataset encrypt` to encrypt them.

### ./datasets/encrypted/

This folder stores the encrypted datasets files.
An encrypted dataset file is created for each dataset file when running `iexec dataset encrypt`.
The encrypted dataset file is named after the dataset file name.
The encrypted dataset files must be upload on a public file system and referenced in multiaddr when running `iexec dataset deploy`.

---

# Interoperability

If your program is not written in javascript, your last option to use the SDK would be to spawn it as a separate process (sometimes called FORK operation). After each SDK run you should check the exit code returned by the SDK to know if the operation was successful or not `echo $?`:

- 0 = successful
- 1 = error

Finally, you could choose to parse the SDK stdout/stderr to access more information. Use the global option --raw to get json formatted output.

ex:

- `iexec wallet show --raw &> out.json`
- `iexec wallet show --raw | jq .`

Warning:

- The stdout/stderr is subject to changes (this is what makes this solution brittle)
- The node and docker version have some slight differences in their stdout/stderr

[< Back home](./README.md)
