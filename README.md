# iExec SDK [![npm version](https://badge.fury.io/js/iexec.svg)](https://www.npmjs.com/package/iexec)


iExec allows Ethereum developers to create applications that can be executed off-chain.
This package brings all the tools to develop, deploy and execute Dapps on Ethereum and iExec.
Using these tools, you will be able to deploy any legacy applications in the iExec infrastructure
and execute them through calls to Ethereum smart contracts.

## Ressources

* A [Hello World  tutorial](https://goo.gl/REsz1j) to get your feet wet.
* A [create your dapp  tutorial](https://goo.gl/REsz1j) to craft custom iExec Dapps and join the [iExec dapp challenge](https://medium.com/iex-ec/the-iexec-%C3%B0app-challenge-150k-of-grants-to-win-abf6798b31ee).
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

You're done ! Now, let's create your first iExec application.


## Init

Init your iExec project using one of the many [sample iExec dapps](https://github.com/iExecBlockchainComputing/iexec-dapp-samples/tree/master)
```bash
iexec init factorial
cd iexec-factorial  // move into new project directory
```

It will download the sample iExec project to start with.

Your iExec Dapp is composed of two parts:
1. An offchain app (under ```/apps``` directory), which can be any kind of legacy application. The offchain app will be executed by the iExec decentralised cloud.
2. A smart contract (under ```/contracts``` directory) that interfaces your iExec Dapp from Ethereum to the offchain app.


## Wallet

All interactions with the Ethereum blockchain need some ETH to pay for the transaction fees and some RLC to pay for the computing power:
```bash
iexec wallet create
iexec wallet getETH
iexec wallet getRLC
```
You can check how many ETH/RLC you have in your wallet:
```bash
iexec wallet show
```

## I deploy
Using a single command line, you can deploy your smart contract (```/contracts/Factorial.sol```) on Ethereum AND deploy your legacy application (```/apps/Factorial```) on the iExec network:
```bash
iexec deploy
```

## I exec
Depending on the price of the application you want to use, you will need to credit your iExec account with some RLC before submitting a calculation:
```bash
iexec account allow 5
```
Let's submit our first calculation:
```bash
iexec submit 10
```
Each submission gives you back a transaction hash, that you need to use as a parameter to get the result of the submit:
```bash
iexec result txHash
```

Congrats, your smart contract is "offchain computing ready!". Sky is the limit for you and your smart contract!

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
iexec submit # submit work to previously deployed contract
iexec submit --dapp 0xE22F4... # submit work to any dapp address
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
