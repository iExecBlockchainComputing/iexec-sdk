#!/usr/bin/env node

const Debug = require('debug');
const fs = require('fs');
const Web3 = require('web3');
const Promise = require('bluebird');
const cli = require('commander');
const path = require('path');
const tx = require('@warren-bank/ethereumjs-tx-sign');
const truffle = require('./truffle-cli');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));

const debug = Debug('iexec:iexec-migrate');
const readFileAsync = Promise.promisify(fs.readFile);

const privateKey = '';
const publicAddr = '';

cli
  .option('--network [name]', 'migrate to network name', 'ropsten')
  .option('--wallet <type>', 'choose type of wallet', /^(local|remote)$/i, 'local')
  .parse(process.argv);

const migrate = async () => {
  const web3 = new Web3(new Web3.providers.HttpProvider(truffleConfig.networks[cli.network].host));

  await truffle('compile');

  const compiledFile = await readFileAsync('build/contracts/HelloWorld.json');
  const { abi, unlinked_binary } = JSON.parse(compiledFile);

  const contract = new web3.eth.Contract(abi);

  const unsignedTx = contract.deploy({
    data: unlinked_binary,
    arguments: ['0xC3fb2431042fBdde67B8356AbCabBc5c14660849'],
  }).encodeABI();

  const [gasPrice, nonce, chainId] = await Promise.all([
    web3.eth.getGasPrice(),
    web3.eth.getTransactionCount(publicAddr),
    web3.eth.net.getId(),
  ]);
  debug('gasPrice', gasPrice);
  debug('nonce', nonce);
  debug('chainId', chainId);

  const { rawTx } = tx.sign({
    nonce: web3.utils.toHex(nonce),
    gasPrice: web3.utils.toHex(gasPrice * 3),
    gasLimit: web3.utils.toHex(4400000),
    data: unsignedTx,
    chainId,
  }, privateKey);

  const txReceipt = await web3.eth.sendSignedTransaction('0x'.concat(rawTx))
    .once('transactionHash', hash => debug('hash', hash))
    .on('error', error => debug('error', error));
  debug('txReceipt', txReceipt);
};
migrate();
