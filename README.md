OffchainComputingClient
=======================

This packages all needed tools to develop, deploy and execute Dapps.

Dapp management
===============

DApps development, deployment and execution on iExec offchain computing platform requires two packages: the client of the offchain computing middleware and the iExec blockchain oracle.

## XtremWeb-HEP

[XtremWeb-HEP (_XWHEP_)](https://github.com/lodygens/xtremweb-hep) is an open source middleware conjointly developped by [CNRS](http://www.cnrs.fr) and [INRIA](https://www.inria.fr).
It permits to build a cloud over a set of volunteer computing resources, based on peer to peer services and protocols.

iExec uses XWHEP to deploy a decentralized computing paltform. iExec packages the XWHEP client to ease Dapps developper work.

## iExec oracle:

iExec proposes a [blockchain oracle](https://blog.ledger.co/hardware-oracles-bridging-the-real-world-to-the-blockchain-ca97c2fc3e6c) to securely link blockchain and computing worlds:
   * the blockchain smart contract ensures security and payment;
   * the bridge links blockchain and iExec XWHEP platform.


Install XWHEP client
====================

The client comes in three different packages: Redhat, Debian and Apple Package.

RedHat
------
```
 rpmbuild  --buildroot $CURRENTWORKINGDIR/BUILD/xwhep-server-$VERSION -bb $CURRENTWORKINGDIR/xwhep-server.spec
```

Debian
------
```
 pkg-deb --build installers/xwhep/10.5.2/installers/linux/dpkg/xwhep.client xwhep-client-10.5.2.deb
```
