iexec SDK
=========

Iexec allows Ethereum developpers to create applications that can be executed off-chain.
This packages bring all the tools to develop, deploy and execute Dapps on Ethereum and iexec.
Using these tools, you will be able to deploy any legacy applications in the iexec infrastructure
and execute them through calls to Ethereum smart contracts.


Installing the iexec SDK
========================

First clone the iexec-sdk Githup repo.

Make sure you have the following components installed :
 - Ethereum client



Then move in the directory and enter the following command:

```
npm install iexec
```

You're done ! Now, you can create your first hello world application.


I create,
=========


```
iexec init
```

It will scaffolding the helloWorld project to start with.

Your iexec Dapps is composed of two parts:
- an offchain app, which can be any kind of legacy application. The offchain app will be executed by the iexec decentralised cloud.
- a smart contract that interfaces your iexec Dapp from Ethereum to the offchain app.

Ethereum ->  Smart Contract -> offchain

 I deploy,
==========

For his offchain computing app, the developer must first deploy his binary into iexec. To do so,  connect  with your ethereum address, obtain a token, then launch :

```
iexec sendapp appName
```

For his smart contract, the developer will use truffle behind the seen with the followings commands :

```
iexec compile
iexec migrate
iexec test
```


============

I exec
============

To debug the offchain computing part of your dapp, you can try to submit a work through your smart contract by the following command :
```
iexec register(work) appName (find a better word ? )
```
It will return an uid of your work.

Configure your work, by adding parameter
```
iexec setParam appName uid  paramName paramValue
```
Put your work available for a iexec worker to execute it
```
iexec setPending appName uid (find a better word ? )
```

Get your work status :
```
iexec getStatus appName uid
```

When finish, you can download your work results with  :

```
iexec getResults appName uid
```

You just test that your smart contract can you use offchain computing.
Now sky's the limit for you and your smart contract !
