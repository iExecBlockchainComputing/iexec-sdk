OffchainComputingClient
=======================

This packages all needed tools to develop, deploy and execute Dapps.

Dapp management
===============

DApps development, deployment and execution on iExec offchain computing platform requires two packages: the [client](#xtremweb-hep) of the offchain computing middleware and the [iExec blockchain oracle](#iexec-oracle).

XtremWeb-HEP
============

[XtremWeb-HEP (_XWHEP_)](https://github.com/lodygens/xtremweb-hep) is an open source middleware conjointly developped by [CNRS](http://www.cnrs.fr) and [INRIA](https://www.inria.fr).
It permits to build a cloud over a set of volunteer computing resources, based on peer to peer services and protocols. XWHEP is the middleware iExec uses to deploy a decentralized cloud.


## Install XWHEP client

iExec packages the XWHEP client to ease Dapps developper work.

The client comes in three different packages: Redhat, Debian and Apple Package.
We provide no Windows package.

### RedHat
```
 rpmbuild  --buildroot installers/xwhep/10.5.2/installers/linux/rpm/xwhep.client/BUILD/xwhep-client-10.5.2 \
           -bb         installers/xwhep/10.5.2/installers/linux/rpm/xwhep.client/xwhep-server.spec
```

### Debian
```
 pkg-deb --build installers/xwhep/10.5.2/installers/linux/dpkg/xwhep.client xwhep-client-10.5.2.deb
```

## Apple
Apple PackageMaker must be installed.

```
 /Applications/PackageMaker.app/Contents/MacOS/PackageMaker \
       -d installers/xwhep/10.5.2/installers/macosx/xwhep.client/installer/xwhep-client.pmdoc \
       -o installers/xwhep/10.5.2/installers/macosx/xwhep.client/installer/xwhep-client-10.5.2.mpkg

```

iExec oracle
============

iExec proposes a [blockchain oracle](https://blog.ledger.co/hardware-oracles-bridging-the-real-world-to-the-blockchain-ca97c2fc3e6c) to securely link blockchain and computing networks:
   * the blockchain smart contract ensures security and payment;
   * the bridge links blockchain and iExec XWHEP platform.

