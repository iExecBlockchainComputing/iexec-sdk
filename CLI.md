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
iexec wallet get-RLC # ask iExec faucet for RLC
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

## iexec

iExec SDK

Usage:

```sh
iexec [command] [options]
```

Options:

| option | description |
| --- | --- |
| -V, --version | output the version number |

Commands:

- [init](#iexec-init)
- [wallet](#iexec-wallet)
- [iexec account](#iexec-account)
- [app](#iexec-app)
- [dataset](#iexec-dataset)
- [iexec workerpool](#iexec-workerpool)
- [iexec requester](#iexec-requester)
- [order](#iexec-order)
- [iexec orderbook](#iexec-orderbook)
- [iexec deal](#iexec-deal)
- [iexec task](#iexec-task)
- [iexec storage](#iexec-storage)
- [iexec result](#iexec-result)
- [iexec ens](#iexec-ens)
- [iexec category](#iexec-category)
- [iexec registry](#iexec-registry)
- [info](#iexec-info)

### iexec init

init a new project

Usage:

```sh
iexec init [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --unencrypted | generate unsafe unencrypted wallet in working directory (--keystoredir option is ignored) |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --force | force perform action without prompting user |
| --skip-wallet | skip creating a new wallet |

### iexec wallet

manage local ethereum wallet

Usage:

```sh
iexec wallet [options]
```

### iexec account

manage iExec account

Usage:

```sh
iexec account <command> [options]
```

Commands:

- [deposit](#iexec-account-deposit)
- [withdraw](#iexec-account-withdraw)
- [show](#iexec-account-show)

#### iexec account deposit

deposit RLC onto your iExec account (default unit nRLC)

Usage:

```sh
iexec account deposit <amount> [unit] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

#### iexec account withdraw

withdraw RLC from your iExec account (default unit nRLC)

Usage:

```sh
iexec account withdraw <amount> [unit] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

#### iexec account show

show account iExec details

Usage:

```sh
iexec account show [address] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |

### iexec app

manage iExec apps

Usage:

```sh
iexec app [options]
```

### iexec dataset

manage iExec datasets

Usage:

```sh
iexec dataset [options]
```

### iexec workerpool

manage iExec workerpools

Usage:

```sh
iexec workerpool <command> [options]
```

Commands:

- [init](#iexec-workerpool-init)
- [deploy](#iexec-workerpool-deploy)
- [set-api-url](#iexec-workerpool-set-api-url)
- [show](#iexec-workerpool-show)
- [count](#iexec-workerpool-count)
- [publish](#iexec-workerpool-publish)
- [unpublish](#iexec-workerpool-unpublish)
- [transfer](#iexec-workerpool-transfer)

#### iexec workerpool init

init a new workerpool

Usage:

```sh
iexec workerpool init [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |

#### iexec workerpool deploy

deploy a new workerpool

Usage:

```sh
iexec workerpool deploy [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

#### iexec workerpool set-api-url

declare the workerpool API URL on the blockchain

Usage:

```sh
iexec workerpool set-api-url <apiUrl> [workerpoolAddress] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

#### iexec workerpool show

show user workerpool details

Usage:

```sh
iexec workerpool show [addressOrIndex] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --user \<address\> | custom user address |

#### iexec workerpool count

get user workerpool count

Usage:

```sh
iexec workerpool count [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --user \<address\> | custom user address |

#### iexec workerpool publish

publish a workerpoolorder on the marketplace to make the workerpool publicly available (use options to set custom usage restriction)

Usage:

```sh
iexec workerpool publish [workerpoolAddress] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --force | force perform action without prompting user |
| --category \<id\> | id of the task category |
| --price \<amount unit...\> | price per task (default unit nRLC) |
| --volume \<volume\> | number of run |
| --tag \<tag\> | specify tags<br/>\* usage: --tag tag1,tag2 |
| --trust \<integer\> | trust level |
| --app-restrict \<address\> | restrict usage to specific app |
| --dataset-restrict \<address\> | restrict usage to specific dataset |
| --requester-restrict \<address\> | restrict usage to specific requester |

#### iexec workerpool unpublish

unpublish last published workerpoolorder for from the marketplace

Usage:

```sh
iexec workerpool unpublish [workerpoolAddress] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --force | force perform action without prompting user |
| --all | unpublish all orders |

#### iexec workerpool transfer

transfer the ownership of the workerpool to an address

Usage:

```sh
iexec workerpool transfer <workerpoolAddress> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |
| --force | force perform action without prompting user |
| --to \<address\> | receiver address |

### iexec requester

commands for the requester

Usage:

```sh
iexec requester <command> [options]
```

Commands:

- [push-secret](#iexec-requester-push-secret)
- [check-secret](#iexec-requester-check-secret)

#### iexec requester push-secret

push a requester named secret to the secret management service

Usage:

```sh
iexec requester push-secret <secretName> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --secret-value \<secretValue\> | secret value (unsafe) |
| --tee-framework \<name\> | specify the TEE framework to use |

#### iexec requester check-secret

check if a secret exists in the secret management service

Usage:

```sh
iexec requester check-secret <secretName> [requesterAddress] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --tee-framework \<name\> | specify the TEE framework to use |

### iexec order

manage iExec marketplace orders

Usage:

```sh
iexec order [options]
```

### iexec orderbook

show marketplace orderbook

Usage:

```sh
iexec orderbook <command> [options]
```

Commands:

- [app](#iexec-orderbook-app)
- [dataset](#iexec-orderbook-dataset)
- [workerpool](#iexec-orderbook-workerpool)
- [requester](#iexec-orderbook-requester)

#### iexec orderbook app

show marketplace app orderbook details

Usage:

```sh
iexec orderbook app <address> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |
| --tag \<tag\> | specify exact tags<br/>\* usage: --tag tag1,tag2 |
| --require-tag \<tag\> | specify minimum required tags<br/>\* usage: --require-tag tag1,tag2 |
| --max-tag \<tag\> | specify maximum tags (exclude not listed tags)<br/>\* usage: --max-tag tag1,tag2 |
| --min-volume \<integer\> | specify minimum volume |
| --dataset \<address\> | include private orders for specified dataset |
| --workerpool \<address\> | include private orders for specified workerpool |
| --requester \<address\> | include private orders for specified requester |
| --dataset-strict | fetch orders created strictly for the specified dataset |
| --workerpool-strict | fetch orders created strictly for the specified workerpool |
| --requester-strict | fetch orders created strictly for the specified requester |

#### iexec orderbook dataset

show marketplace dataset orderbook details

Usage:

```sh
iexec orderbook dataset <address> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |
| --tag \<tag\> | specify exact tags<br/>\* usage: --tag tag1,tag2 |
| --require-tag \<tag\> | specify minimum required tags<br/>\* usage: --require-tag tag1,tag2 |
| --max-tag \<tag\> | specify maximum tags (exclude not listed tags)<br/>\* usage: --max-tag tag1,tag2 |
| --min-volume \<integer\> | specify minimum volume |
| --app \<address\> | include private orders for specified app |
| --workerpool \<address\> | include private orders for specified workerpool |
| --requester \<address\> | include private orders for specified requester |
| --app-strict | fetch orders created strictly for the specified app |
| --requester-strict | fetch orders created strictly for the specified requester |
| --workerpool-strict | fetch orders created strictly for the specified workerpool |

#### iexec orderbook workerpool

show marketplace workerpools orderbook details

Usage:

```sh
iexec orderbook workerpool [address] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |
| --category \<id\> | specify the work category |
| --tag \<tag\> | specify exact tags<br/>\* usage: --tag tag1,tag2 |
| --require-tag \<tag\> | specify minimum required tags<br/>\* usage: --require-tag tag1,tag2 |
| --max-tag \<tag\> | specify maximum tags (exclude not listed tags)<br/>\* usage: --max-tag tag1,tag2 |
| --min-volume \<integer\> | specify minimum volume |
| --min-trust \<integer\> | specify minimum trust |
| --app \<address\> | include private orders for specified app |
| --dataset \<address\> | include private orders for specified dataset |
| --requester \<address\> | include private orders for specified requester |
| --dataset-strict | fetch orders created strictly for the specified dataset |
| --app-strict | fetch orders created strictly for the specified app |
| --requester-strict | fetch orders created strictly for the specified requester |

#### iexec orderbook requester

show marketplace requesters orderbook details

Usage:

```sh
iexec orderbook requester [address] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |
| --category \<id\> | specify the work category |
| --tag \<tag\> | specify exact tags<br/>\* usage: --tag tag1,tag2 |
| --require-tag \<tag\> | specify minimum required tags<br/>\* usage: --require-tag tag1,tag2 |
| --max-tag \<tag\> | specify maximum tags (exclude not listed tags)<br/>\* usage: --max-tag tag1,tag2 |
| --min-volume \<integer\> | specify minimum volume |
| --max-trust \<integer\> | specify maximum trust |
| --app \<address\> | filter by app |
| --dataset \<address\> | filter by dataset |
| --beneficiary \<address\> | filter by beneficiary |
| --workerpool \<address\> | include private orders for specified workerpool |
| --workerpool-strict | fetch orders created strictly for the specified workerpool |

### iexec deal

manage iExec deals

Usage:

```sh
iexec deal <command> [options]
```

Commands:

- [show](#iexec-deal-show)
- [claim](#iexec-deal-claim)

#### iexec deal show

show user deal details

Usage:

```sh
iexec deal show <dealid> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --watch | watch execution status changes |

#### iexec deal claim

claim a deal that is not COMPLETED

Usage:

```sh
iexec deal claim <dealid> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

### iexec task

manage iExec tasks

Usage:

```sh
iexec task <command> [options]
```

Commands:

- [show](#iexec-task-show)
- [debug](#iexec-task-debug)
- [claim](#iexec-task-claim)

#### iexec task show

show user task details

Usage:

```sh
iexec task show <taskid> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --watch | watch execution status changes |
| --download \[fileName\] | download a task result data to local filesystem, if completed |
| --decrypt | decrypt an encrypted result |
| --beneficiary-keystoredir \<path\> | specify beneficiary TEE keys directory |
| --beneficiary-key-file \<fileName\> | specify beneficiary TEE key file to use |

#### iexec task debug

show task debug information

Usage:

```sh
iexec task debug <taskid> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --logs | show application logs |

#### iexec task claim

claim a task that is not COMPLETED

Usage:

```sh
iexec task claim <taskid> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

### iexec storage

manage remote storage

Usage:

```sh
iexec storage <command> [options]
```

Commands:

- [init](#iexec-storage-init)
- [check](#iexec-storage-check)

#### iexec storage init

initialize the remote storage

Usage:

```sh
iexec storage init [provider] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --force-update | update if already exists |
| --token \<token\> | storage provider authorization token (unsafe) |
| --tee-framework \<name\> | specify the TEE framework to use |

#### iexec storage check

check if the remote storage is initialized

Usage:

```sh
iexec storage check [provider] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --user \<address\> | custom user address |
| --tee-framework \<name\> | specify the TEE framework to use |

### iexec result

manage results encryption

Usage:

```sh
iexec result <command> [options]
```

Commands:

- [generate-encryption-keypair](#iexec-result-generate-encryption-keypair)
- [decrypt](#iexec-result-decrypt)
- [push-encryption-key](#iexec-result-push-encryption-key)
- [check-encryption-key](#iexec-result-check-encryption-key)

#### iexec result generate-encryption-keypair

_Alias: generate-keys_

generate a beneficiary key pair to encrypt and decrypt the results

Usage:

```sh
iexec result generate-encryption-keypair [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --force | force perform action without prompting user |
| --beneficiary-keystoredir \<path\> | specify beneficiary TEE keys directory |

#### iexec result decrypt

decrypt encrypted results with beneficiary key

Usage:

```sh
iexec result decrypt [encryptedResultsPath] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --force | force perform action without prompting user |
| --beneficiary-keystoredir \<path\> | specify beneficiary TEE keys directory |
| --beneficiary-key-file \<fileName\> | specify beneficiary TEE key file to use |

#### iexec result push-encryption-key

_Alias: push-secret_

push the public encryption key to the secret management service

Usage:

```sh
iexec result push-encryption-key [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --force-update | update if already exists |
| --secret-path \<secretPath\> | push the secret from a file |
| --tee-framework \<name\> | specify the TEE framework to use |

#### iexec result check-encryption-key

_Alias: check-secret_

check if a secret exists in the secret management service

Usage:

```sh
iexec result check-encryption-key [address] [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --tee-framework \<name\> | specify the TEE framework to use |

### iexec ens

manage ENS names

Usage:

```sh
iexec ens <command> [options]
```

Commands:

- [resolve](#iexec-ens-resolve)
- [lookup](#iexec-ens-lookup)
- [get-owner](#iexec-ens-get-owner)
- [register](#iexec-ens-register)

#### iexec ens resolve

resolve an ENS name to an address

Usage:

```sh
iexec ens resolve <name> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |

#### iexec ens lookup

lookup for the ENS name of an address

Usage:

```sh
iexec ens lookup <address> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |

#### iexec ens get-owner

find the the owner address of an ENS name

Usage:

```sh
iexec ens get-owner <name> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |

#### iexec ens register

register an ENS if needed and setup both ENS resolution and reverse resolution

Usage:

```sh
iexec ens register <label> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --force | force perform action without prompting user |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |
| --domain \<domain\> | use the specified ENS domain (default `users.iexec.eth`)<br/> - if the ENS name (label.domain) is not owned by the user, the domain must be controlled by a FIFS registrar<br/> - if the ENS name (label.domain) is already owned by the user, the registration will be skipped |
| --for \<address\> | register for an owned iExec app, dataset or workerpool |

### iexec category

manage iExec categories

Usage:

```sh
iexec category <command> [options]
```

Commands:

- [init](#iexec-category-init)
- [create](#iexec-category-create)
- [show](#iexec-category-show)
- [count](#iexec-category-count)

#### iexec category init

init a new category

Usage:

```sh
iexec category init [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |

#### iexec category create

create a new category

Usage:

```sh
iexec category create [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --password \<password\> | password used to encrypt the wallet (unsafe) |
| --wallet-file \<walletFileName\> | specify the name of the wallet file to use |
| --wallet-address \<walletAddress\> | specify the address of the wallet to use |
| --keystoredir \<path\> | specify the wallet directory \<"global"\|"local"\|custom\> |
| --chain \<name\> | chain name from "chain.json" |
| --gas-price \<amount unit...\> | set custom gas price for transactions (default unit wei) |
| --confirms \<blockCount\> | set custom block count to wait for transactions confirmation (default 1 block) |

#### iexec category show

show category details

Usage:

```sh
iexec category show <index> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |

#### iexec category count

count protocol categories

Usage:

```sh
iexec category count [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |

### iexec registry

interact with iExec registry

Usage:

```sh
iexec registry <command> [options]
```

Commands:

- [validate](#iexec-registry-validate)

#### iexec registry validate

validate an app/dataset/workerpool description before submitting it to the iExec registry

Usage:

```sh
iexec registry validate <object> [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |

### iexec info

show iExec contracts addresses

Usage:

```sh
iexec info [options]
```

Options:

| option | description |
| --- | --- |
| --raw | use raw output |
| --quiet | stop prompting updates |
| --chain \<name\> | chain name from "chain.json" |



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
      "sms": {
        "scone": "http://localhost:15000"
      },
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
      "sms": {
        "scone": "http://localhost:5000"
      },
      "resultProxy": "http://localhost:8089",
      "ipfsGateway": "http://localhost:8080",
      "flavour": "enterprise",
      "hub": "0xb80C02d24791fA92fA8983f15390274698A75D23",
      "enterprise": {
        "enterpriseSwapChainName": "dev"
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
