iexec SDK (better name iexec cli ?)
=======================

This packages bring all needed tools to develop, deploy and execute Dapps

Iexec SDK <-> Iexec Node <br>
Iexec SDK <-> iexec Oracle <-> XtremWeb-HEP


Initialize your project
===============

```
iexec init
```

it will scaffolding the helloWorld project to start with.


I create, I deploy
===============

Then, the iexec dapps developer must first create and deploy 2 things :
- His offchain computing app which will be execute by an iexec worker.
- His smart contract that will use his offchain computing app through iexec oracle.

For his offchain computing app, the developer must first deploy his binary into XtremWeb-HEP. To do so, the developer will connect to XtremWeb-HEP with his ethereum address, obtain a token, then launch :

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
