iexec SDK
=========

Iexec allows Ethereum developpers to create applications that can be executed off-chain.
This packages bring all the tools to develop, deploy and execute Dapps on Ethereum and iexec.
Using these tools, you will be able to deploy any legacy applications in the iexec infrastructure
and execute them through calls to Ethereum smart contracts.


Install
========

Requirement: [Node.js](https://nodejs.org/en/)

```bash
npm -g install iexec
iexec --version
iexec --help
```

You're done ! Now, you can create your first iexec application.


Init
=========

Init your iexec project with one of the [sample iexec dapps](https://github.com/iExecBlockchainComputing/iexec-dapp-samples/tree/master)
```bash
iexec init factorial
cd iexec-factorial
```

It will download the sample iexec project to start with.

Your iexec Dapps is composed at the minimum of two parts:
1. an offchain app, which can be any kind of legacy application. The offchain app will be executed by the iexec decentralised cloud.
2. a smart contract that interfaces your iexec Dapp from Ethereum to the offchain app.

Ethereum ->  Smart Contract -> offchain

Wallet
=================
All interactions with the Ethereum blockchain need some ETH to pay for the transaction fees. First get a Wallet, and some ETH:
```bash
iexec wallet create
iexec wallet getETH
```
You can check how many ETH you have on your wallet:
```bash
iexec wallet show
```

I deploy
============
```bash
iexec migrate
iexec migrate --network ropsten # you need ETH on the ropsten testnet to do that
```
This will use informations from the iexec and truffle config file to deploy the contract on ethereum:
This is the iexec configuration file:
```js
// iexec.js
module.exports = {
    name: 'Factorial',  // the name of the contract to be deployed
    constructorArgs: ['0xe6b658facf9621eff76a0d649c61dba4c8de85fb'],  // the constructor arguments for contract deployment logic
};
```

I exec
============
Let's submit our first calculation:
```bash
iexec submit factorial 10
```
check the results:
```
iexec results
```

Your smart contract is "offchain computing ready!".Sky is the limit for you and your smart contract!
