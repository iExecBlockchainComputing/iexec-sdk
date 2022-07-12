[< Back home](./README.md)

# iExec SDK CLI

Use the iExec decentralised marketplace for off-chain computing from your terminal.

## Content

- [Install](#install)
- [Upgrade](#upgrade)
- [Quick start](#quick-start)
- [API](#api)
- [Files](#files)
- [Interoperability](#Interoperability)

---

# Install

All three major OS are supported (linux, OSX, windows).

## Using Nodejs

Requirements: [![npm version](https://img.shields.io/badge/nodejs-%3E=14.0.0-brightgreen.svg)](https://nodejs.org/en/).

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

- [Init project](#Init-project)
- [SDK CLI for Dapp developpers](#SDK-CLI-for-Dapp-developpers)
- [SDK CLI for Dataset providers](#SDK-CLI-for-Dataset-providers)
- [SDK CLI for Workerpools](#SDK-CLI-for-Workerpools)
- [SDK CLI for Requesters](#SDK-CLI-for-Requesters)
- [SDK CLI for workers](#SDK-CLI-for-workers)

## Init project

required steps before following any other workflow.

```bash
iexec init # create all required files
iexec wallet get-RLC # ask iExec faucet for RLC
iexec wallet show # show your wallet
iexec storage init # initialize your remote storage
```

> _NB:_ iExec SDK CLI access the public blockchains (mainnet & goerli) through [ethers](https://github.com/ethers-io/ethers.js/) to connect different backends ([Alchemy](https://alchemyapi.io/), [Etherscan](https://etherscan.io/), [INFURA](https://infura.io/)).
>
> Default API keys for backend services are provided for convenience.
> As these keys are shared accross all users and are subject to rate limits, **you must use your own API keys** or better **your own node**.
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
>       },
>       "goerli": {
>         "id": "5",
>         "host": "http://localhost:58545"
>       }
>    }
> }
> ```
>
> Check your current host:
> `iexec info`

## SDK CLI for Dapp developpers

First go through [Init project](#Init-project)

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

First go through [Init project](#Init-project)

### Encrypt your dataset

```bash
cp 'myAwsomeDataset.file' ./datasets/original # copy your dataset file or folder into the dataset/original/ folder
iexec dataset encrypt # generate a secret key for each file or folder in dataset/original/ and encrypt it, also output the encrypted file checksum to use for deployment.
cat ./.secrets/dataset/myAwsomeDataset.file.secret # this is the secret key for decrypting the dataset
cat ./datasets/encrypted/myAwsomeDataset.file.enc # this is the encrypted dataset, you must share this file at a public url
```

### Deploy your dataset

```bash
iexec dataset count # check if you have already deployed datasets
iexec dataset init # reset dataset fields in iexec.json
iexec dataset deploy # deploy dataset on Ethereum
iexec dataset show # show details of deployed dataset
```

## Securely share the dataset secret key

**Disclaimer:** The secrets pushed in the Secreet Management Service will be shared with the worker to process the dataset in the therms your specify in the dataset order. Make sure to always double check your selling policy in the dataset order before signing it.

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

First go through [Init project](#Init-project)

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

### Top up your iExec account to buy compution

```bash
iexec account show # show your iExec account
iexec account deposit 200 # deposit RLC from your wallet to your account
iexec account show # make sure you have enough staked RCL to buy computation
```

### Buy computation at market price on the Marketplace

```bash
iexec app run [address] [--dataset [address] --args <args> --category <id> --input-files <fileURLs> --secret <secretMapping...>] # run an iExec application at market price
```

see [app run available options](#app-run)

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
iexec result generate-encryption-keypair # generate private/public RSA keypair for result encryption
iexec result push-encryption-key # share the public RSA key with the secret management service, all your results will be encrypted with this key
# Go through the normal buy process  and download the result of the computation #
iexec result decrypt [encryptedResultsFilePath] # decrypt the result with the private RSA key
```

## SDK CLI for workers

First go through [Init project](#Init-project)

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

- [Help & Info](#help--info)
- [Global options](#global-options)
- [init](#init)
- [wallet](#wallet)
- [account](#account)
- [app](#app)
- [dataset](#dataset)
- [workerpool](#workerpool)
- [order](#order)
- [orderbook](#orderbook)
- [deal](#deal)
- [task](#task)
- [storage](#storage)
- [result](#result)
- [requester](#requester)
- [ens](#ens)
- [category](#category)
- [registry](#registry)

## Help & Info

```bash
iexec --version
iexec --help
iexec app --help
iexec orderbook --help
iexec info --chain viviani
```

## Global options

```bash
--quiet # disable update notification
--raw # display the command result as a json (disable update notification)
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
--gas-price <amount> [unit] # use the specified value (in wei or specified unit) for next transactions gas price (default use eth_gasPrice current value)
--confirms <blockCount> # set custom block count to wait for transactions confirmation (default 1 block)
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
iexec wallet get-ETH # ask ETH from faucets
iexec wallet get-RLC # ask RLC from faucets
iexec wallet show [address] # optional address to show other people's wallet
iexec wallet show --show-private-key # allow displaying wallet private key
iexec wallet send-ether <amount> [unit] --to <address> # send ether amount (in ether or specified unit) to the specified eth address
iexec wallet send-RLC <amount> [unit] --to <address>  # send RLC amount (in RLC or specified unit) to the specified eth address
iexec wallet sweep --to <address> # drain all ether and RLC, sending them to the specified eth address
iexec wallet bridge-to-sidechain <amount> [unit] # send RLC amount (in nRLC or specified unit) from a mainchain to the bridged sidechain.
iexec wallet bridge-to-mainchain <amount> [unit] # send RLC amount (in nRLC or specified unit) from a sidechain to the bridged mainchain.
iexec wallet swap-RLC-for-eRLC <amount> [unit] # swap RLC for the same amount of eRLC (default unit nRLC) - the wallet must be authorized to interact with eRLC.
iexec wallet swap-eRLC-for-RLC <amount> [unit] # swap eRLC for the same amount of RLC (default unit neRLC) - the wallet must be authorized to interact with eRLC.
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
iexec account deposit <amount> [unit] # deposit the specified amount of RLC (in nRLC or specified unit) from your wallet to your account
iexec account withdraw <amount> [unit] # withdraw the specified amount of RLC  (in nRLC or specified unit) from your account to your wallet
```

## app

```bash
# OPTIONS
# --chain <chainName>
# --user <address>
iexec app init # init the app template
iexec app init --tee # init the TEE app template
iexec app deploy # deploy the app on the blockchain
iexec app publish [address] # publish an apporder to make your app publicly available on the marketplace (use options to manage access)
iexec app unpublish [address] # unpublish the last published apporder for specified app
iexec app unpublish [address] --all # unpublish all the published apporders for specified app
iexec app show [address|index] # show app details
iexec app count # count your total number of app
iexec app count --user <userAddress> # count user total number of app
```

### app run

```bash
iexec app run [appAddress] [options] # run an iExec application at market price (default run last deployed app)
# OPTIONS
--dataset <address|"deployed"> # dataset address, use "deployed" to use last deployed from "deployed.json"
--workerpool <address|"deployed"> # workerpool address, use "deployed" to use last deployed from "deployed.json"
--category <id> # id of the task category
--tag <tag...> # specify tags (usage: --tag tee,gpu)
--trust <integer> # trust level
--beneficiary <address> # specify the beneficiary of the request (default user address)
--callback <address> # specify the callback address of the request
--args <string> # specify the arguments to pass to the app
--input-files <fileUrl...> # specify the URL of input files to be used by the app (usage: --input-files https://example.com/foo.txt,https://example.com/bar.zip)
--secret <secretMapping> # specify the requester secrets mappings (<appSecretKey>=<requesterSecretName>) to use in the app (only available for TEE tasks, use with --tag tee)
--encrypt-result # encrypt the result archive with the beneficiary public key (only available for TEE tasks, use with --tag tee)
--storage-provider <"ipfs"|"dropbox"> # specify the storage to use to store the result archive
--skip-request-check # skip request validity checks, this may result in task execution fail
--params <json> # specify the params of the request, this option is reserved to an advanced usage (usage: --params '{"iexec_args":"dostuff","iexec_input_files":["https://example.com/file.zip"]}')
--watch # watch execution status changes
```

### app request-execution

```bash
iexec app request-execution <appAddress> [options] # request an iExec application execution at limit price
# OPTIONS
--dataset <address> # dataset address
--workerpool <address> # workerpool address
--app-price <amount unit...> # app price per task (default unit nRLC)
--dataset-price <amount unit...> # dataset price per task (default unit nRLC)
--workerpool-price <amount unit...> # workerpool price per task (default unit nRLC)
--category <id> # id of the task category
--tag <tag...> # specify tags (usage: --tag tee,gpu)
--trust <integer> # trust level
--beneficiary <address> # specify the beneficiary of the request (default user address)
--callback <address> # specify the callback address of the request
--args <string> # specify the arguments to pass to the app
--input-files <fileUrl...> # specify the URL of input files to be used by the app (usage: --input-files https://example.com/foo.txt,https://example.com/bar.zip)
--secret <secretMapping> # specify the requester secrets mappings (<appSecretKey>=<requesterSecretName>) to use in the app (only available for TEE tasks, use with --tag tee)
--encrypt-result # encrypt the result archive with the beneficiary public key (only available for TEE tasks, use with --tag tee)
--storage-provider <"ipfs"|"dropbox"> # specify the storage to use to store the result archive
--skip-request-check # skip request validity checks, this may result in task execution fail
--params <json> # specify the params of the request, this option is reserved to an advanced usage (usage: --params '{"iexec_args":"dostuff","iexec_input_files":["https://example.com/file.zip"]}')
```

## dataset

```bash
# OPTIONS
# --chain <chainName>
# --user <address>
iexec dataset init # init the dataset template
iexec dataset init --tee # init the dataset template and create the folders for dataset encryption
iexec dataset encrypt # for each dataset file in ./datasets/original/ generate a 256 bits key and encrypt the dataset using AES-256-CBC and compute the encrypted file's sha256 checksum
iexec dataset deploy # deploy the dataset on the blockchain
iexec dataset push-secret [datasetAddress] # push the key for the encrypted dataset
iexec dataset check-secret [datasetAddress] # check if a secret exists for the dataset
iexec dataset publish [datasetAddress] # publish an datasetorder to make your dataset publicly available on the marketplace (use options to manage access)
iexec dataset unpublish [datasetAddress] # unpublish the last published datasetorder for specified dataset
iexec dataset unpublish [datasetAddress] --all # unpublish all the published datasetorders for specified dataset
iexec dataset show [address|index] # show dataset details
iexec dataset count # count your total number of dataset
iexec dataset count --user <userAddress> # count user total number of dataset
```

## workerpool

```bash
# OPTIONS
# --chain <chainName>
# --user <address>
iexec workerpool init # init the workerpool template
iexec workerpool deploy # deploy the workerpool on the blockchain
iexec workerpool set-api-url <url> [workerpoolAddress] # declare the workerpool API URL on the blockchain
iexec workerpool publish [workerpoolAddress] --price <amount> [unit] # publish an workerpoolorder to make your workerpool computing power publicly available on the marketplace
iexec workerpool unpublish [workerpoolAddress] # unpublish the last published workerpoolorder for specified workerpool
iexec workerpool unpublish [workerpoolAddress] --all # unpublish all the published workerpoolorders for specified workerpool
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
iexec order fill # fill a set of local signed orders (app + dataset + workerpool + request) and return a dealid
iexec order fill --app <orderHash> --dataset <orderHash> --workerpool <orderHash> --request <orderHash> # fill a set of signed orders from iExec Marketplace and return a dealid
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
iexec orderbook workerpool --category <id> --require-tag <...tags> # show the best workerpools published on the Marketplace matchin the specified tags
iexec orderbook app <address> # show the best apporders published on the Marketplace for the specified app
iexec orderbook app <address> --dataset <address> --requester <address> --workerpool <address> # filter on specific dataset, requester, workerpool
iexec orderbook dataset <address> # show the best datasetorders published on the Marketplace for the specified dataset
iexec orderbook dataset <address> --app <address> --requester <address> --workerpool <address> # filter on specific app, requester, workerpool
```

## deal

```bash
# OPTIONS
# ---chain <chainName>
iexec deal show <dealid> # show a deal identified by dealid
iexec deal claim <dealid> # claim all failed tasks from a deal
```

## task

```bash
# OPTIONS
# --chain <chainName>
iexec task show <taskid> # show task identified by taskid
iexec task show <taskid> --watch # wait for task to be COMPLETED or CLAIMED
iexec task show <taskid> --download [fileName] # download the result of a COMPLETED task
iexec task show <taskid> --download [fileName] --decrypt # download and decrypt the result of a COMPLETED task
iexec task claim <taskid> # claim a task requested by the user if the final deadline is reached and the task is still not COMPLETED
iexec task debug <taskid> --logs # show task debug information and logs
```

## requester

```bash
# OPTIONS
# --chain <chainName>
iexec push-secret <secretName> # push a requester named secret to the secret management service
iexec check-secret <secretName> [requesterAddress] # check if a secret exists in the secret management service
```

## result

```bash
# OPTIONS
# --chain <chainName>
iexec result generate-encryption-keypair # generate a beneficiary keypair to encrypt and decrypt the results
iexec result push-encryption-key # push the encryption key for the beneficiary
iexec result push-encryption-key --force-update # push the encryption key for the beneficiary, update if exists
iexec result push-encryption-key --secret-file [secretPath] # specify a file path for reading the secret
iexec result decrypt [encryptedResultsPath] # decrypt encrypted results with beneficary key
iexec result check-encryption-key [userAddress] # check if a encryption key exists for the user
```

## storage

```bash
# OPTIONS
# --chain <chainName>
iexec storage init # initialize the IPFS based default remote storage
iexec storage init [provider] # initialize the specified remote storage (supported "default"|"dropbox")
iexec storage check [provider] # check if the specified remote storage is initialized
iexec storage check [provider] --user <address> # check if the remote storage of specified user is initialized
```

## ens

```bash
# OPTIONS
# --chain <chainName>
iexec ens resolve <name> # resolve an ENS name to an address
iexec ens lookup <address> # lookup for the ENS name of an address
iexec ens get-owner <name> # find the the owner address of an ENS name
iexec ens register <label> --domain <domain> --for <address># register an ENS if needed and setup both ENS resolution and reverse resolution
```

## category

```bash
# OPTIONS
# --chain <chainName>
iexec category init # init the category template
iexec category create # create new category
iexec category show <index> # show category details by index
iexec category count # count total number of category
```

## registry

```bash
iexec registry validate <'app'|'dataset'|'workerpool'> # validate an object before submitting it to the iExec registry and be listed in the iExec stores
```

---

# Files

- [iexec.json](#iexecjson)
- [chain.json](#chainjson)
- [orders.json](#ordersjson)
- [deployed.json](#deployedjson)
- [.secrets/](#secrets)
  - [.secrets/datasets/](#secretsdatasets)
  - [.secrets/beneficary/](#secretsbeneficiary)
- [datasets/](#datasets)
  - [datasets/original/](#datasetsoriginal)
  - [datasets/encrypted/](#datasetsencrypted)

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
      "params": "{ cmdline: '--help' }"
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
  - optional key `sms` set the url of the Secret Management Service used by the SDK cli on each chain (overwrite default value).
  - optional key `resultProxy` set the url of the Result Proxy used by the SDK cli on each chain (overwrite default value).
  - optional key `ipfsGateway` set the url of the IPFS gateway used by the SDK cli on each chain (overwrite default value).
  - optional key `bridge` set the bridge used by the SDK cli when working with bridged networks (sidechain). `bridge.contract` set the address of the RLC bridge on the chain, `bridge.bridgedChainName` set the reference to the bridged network.
  - optional key `enterprise` set the enterprise swap contract used by the SDK cli when working with enterprise enabled networks. `bridge.enterpriseSwapChainName` set the reference to the enterprise bound network.
  - optional key `native` specify whether or not the chain native token is RLC (overwrite default value: chain value or `false`).
  - optional key `useGas` specify whether or not the chain requires to spend gas to send a transaction (overwrite default value: chain value or `true`).
- optional key `providers` set the backends for public chains
  - optional key `alchemy` set Alchemy API Token
  - optional key `etherscan` set Etherscan API Token
  - optional key `infura` set INFURA Project ID or ProjectID and Project Secret
  - optional key `quorum` set minimum number of backends that must agree before forwarding blockchain responses

```json
{
  "default": "viviani",
  "chains": {
    "dev": {
      "host": "http://localhost:8545",
      "id": "65535",
      "sms": "http://localhost:5000",
      "resultProxy": "http://localhost:8089",
      "ipfsGateway": "http://localhost:8080",
      "flavour": "standard",
      "hub": "0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca",
      "bridge": {
        "contract": "0x1e32aFA55854B6c015D284E3ccA9aA5a463A1418",
        "bridgedChainName": "dev-sidechain"
      },
      "enterprise": {
        "enterpriseSwapChainName": "dev-enterprise"
      }
    },
    "dev-sidechain": {
      "host": "http://localhost:18545",
      "id": "123456",
      "sms": "http://localhost:15000",
      "resultProxy": "http://localhost:18089",
      "ipfsGateway": "http://localhost:18080",
      "native": true,
      "useGas": false,
      "flavour": "standard",
      "hub": "0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca",
      "bridge": {
        "contract": "0x1e32aFA55854B6c015D284E3ccA9aA5a463A1418",
        "bridgedChainName": "development"
      }
    },
    "dev-enterprise": {
      "host": "http://localhost:8545",
      "id": "65535",
      "sms": "http://localhost:5000",
      "resultProxy": "http://localhost:8089",
      "ipfsGateway": "http://localhost:8080",
      "flavour": "enterprise",
      "hub": "0xb80C02d24791fA92fA8983f15390274698A75D23",
      "enterprise": {
        "enterpriseSwapChainName": "dev"
      }
    },
    "goerli": {},
    "viviani": {},
    "mainnet": {},
    "bellecour": {},
    "enterprise": {}
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

The `deployed.json` file, located in iExec project, locally stores your latest deployed resources address. These address are used when you run a command without specifying a resource address (exemple: `iexec app show` will show the app in `deployed.json`).

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

This folder is created when running `iexec result generate-encryption-keypair` or `ìexec dataset init --tee` and is intended to store credentials generated by the iexec SDK CLI.

### ./secrets/beneficiary/

This folder stores the keypair to use for result encryption and decryption.
A keypair is generated when running `iexec result generate-encryption-keypair`
Public keys name follow the pattern _userAddress_\_key.pub , this key is shared with the workers when running `ìexec result push-encryption-key`
Private keys name follow the pattern _userAddress_\_key this should never be shared with third party, the private key is used by the SDK CLI to decrypt a result when running `ìexec result decrypt`.

### ./secrets/datasets/

This folder stores the AES keys used for dataset encryption.
A key is generated for each dataset file when running `iexec dataset encrypt`.
The key file is named after the dataset file name, last key generated is also stored in `./secrets/datasets/dataset.key` to be used as default secret to share with workers when running `iexec dataset push-secret`.

## ./datasets/

This folder is created when running `ìexec dataset init --tee` and is intended to store datasets files.

### ./datasets/original/

Paste your original dataset files in this folder and run `iexec dataset encrypt` to encrypt them.

### ./datasets/encrypted/

This folder stores the encrypted datasets files.
An encrypted dataset file is created for each dataset file when running `iexec dataset encrypt`.
The encrypted dataset file is named after the dataset file name.
The encrypted dataset files must be upload on a public file system and referenced in multriaddr when running `iexec dataset deploy`.

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
