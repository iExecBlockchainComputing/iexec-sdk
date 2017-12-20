# iExec SDK [![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec)

iExec allows Ethereum developers to create applications that can be executed off-chain.
This package brings all the tools to develop, deploy and execute Dapps on Ethereum and iExec.
Using these tools, you will be able to deploy any legacy applications in the iExec infrastructure
and execute them through calls to Ethereum smart contracts.

## Ressources

* A [Hello World tutorial](https://www.katacoda.com/sulliwane/scenarios/hello-world)
* A [create your dapp  tutorial](https://www.katacoda.com/sulliwane/scenarios/ffmpeg) to craft custom iExec Dapps and join the [iExec dapp challenge](https://medium.com/iex-ec/the-iexec-%C3%B0app-challenge-150k-of-grants-to-win-abf6798b31ee).
* An iExec explorer : https://explorer.iex.ec
* A RLC faucet : https://faucet.iex.ec
* A Dapp Store : https://dapps.iex.ec
* A [JS client lib](https://github.com/iExecBlockchainComputing/iexec-server-js-client) to interact with iExec server (without the SDK)

## Install

Requirements:
[Node.js](https://nodejs.org/en/) (version >= 6.4.0) and [Git](https://git-scm.com/).
```bash
npm -g install iexec # install the cli
iexec --version
iexec --help
```

> Windows users need to create an alias by running ```for /f %i in ('where iexec') do doskey iex=%i $*``` to avoid a naming conflict. Then always use ```iex``` instead of ```iexec``` when using the SDK.

## Init
These are the basic steps you need to run before any "real" use of the SDK.
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
After the init steps, go to [iExec dapp store](https://dapps.iex.ec) and find the dapp you'd like to use, say [ffmpeg](https://dapps.iex.ec/dapp/jeremy_toussaint/ffmpeg):
 1. Copy its ethereum address by clicking on the network #tag (ropsten, rinkeby, mainnet).
 2. Replace your local ```iexec.js``` with the one of the dapp (you can find it on the [github page of the dapp](https://github.com/iExecBlockchainComputing/iexec-dapp-samples/tree/ffmpeg#readme))

And submit your work:
```
iexec submit --dapp 0x928cf...

```
Finally, copy the transaction hash given by the SDK and check the progress of your work:

```
iexec result txHash

```
Or directly go to the [iExec explorer](https://explorer.iex.ec/) for a more visual experience.

## Deploy and run an existing dapp

Go checkout the [Hello World tutorial](https://www.katacoda.com/sulliwane/scenarios/hello-world)

## Create and deploy your own custom dapp

Go checkout the [Ffmpeg step by step tutorial](https://www.katacoda.com/sulliwane/scenarios/ffmpeg)

# iExec SDK API
## Help
```bash
iexec --help
iexec --version
```
## truffle
```bash
iexec compile # call truffle compile underhood
iexec truffle [...] # call any truffle command
```
## wallet
```bash
iexec wallet create
iexec wallet getETH
iexec wallet getRLC
iexec wallet show
```
## account
```bash
iexec account login
iexec account show
iexec account allow 5
```
## dapps
Coming features...
```bash
iexec dapps deploy # deploy smart contract only to ethereum
iexec dapps show # show addresses of deployed dapps
```
## apps
```bash
iexec apps deploy # deploy legacy app only to iExec server
```
## submit
```bash
iexec submit # submit work to your own dapp
iexec submit --dapp 0xE22F4... # submit work to someone else dapp address
```

## deploy
```bash
iexec deploy # a combo of "iexec dapps deploy" and "iexec apps deploy"
```

## result
You need the txHash of a work submission in order to check its result:
```bash
iexec result 0xEL3D9ed... # this will log the result data
iexec result 0xEL3D9ed... --save # this will download the result locally
```

## iexec.js
```js
module.exports = {
  name: 'Factorial',
  // data tags used when deploying
  // legacy app to iExec server
  data: {  
    type: 'BINARY',
    cpu: 'AMD64',
    os: 'LINUX',
  },
  // app tags used once when deploying
  // legacy app to iExec server
  app: {
    name: 'Factorial',
  },
  // work tags used each work submit
  work: {
    cmdline: '10',
  }
};
```

## truffle.js
```js
module.exports = {
  networks: {
    ropsten: {
      // ETH node relay config
      host: 'https://ropsten.infura.io/berv5GTB5cSdOJPPnqOq',
      port: 8545,
      network_id: '3',
      constructorArgs: [ROPSTEN_ORACLE_ADDRESS],
      // iExec server used to deploy legacy app
      server: 'https://testxw.iex.ec:443',
      // gasPriceMultiplier: 2,  // use factor 2 of the network estimated gasPrice
      // gasLimitMultiplier: 4,  // use factor 4 of the network estimated gasLimit
      // gasPrice: 21000000000  // manually set the gasPrice in gwei. Prefer 'gasPriceMultiplier'
      // gas: 400000  // manually set the gas limit in gwei. Prefer 'gasLimitMultiplier'
    },
};

```
