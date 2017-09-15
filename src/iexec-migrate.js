#!/usr/bin/env node

const Debug = require('debug');
const fs = require('fs');
const Web3 = require('web3');
const Promise = require('bluebird');
const cli = require('commander');
const path = require('path');
const tx = require('@warren-bank/ethereumjs-tx-sign');
const truffle = require('./truffle-cli');
const wallet = require('./wallet');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:iexec-migrate');
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

cli
  .option('--network [name]', 'migrate to network name', 'ropsten')
  .option('--wallet <type>', 'choose type of wallet', /^(local|remote)$/i, 'local')
  .parse(process.argv);

const migrate = async () => {
  try {
    const network = truffleConfig.networks[cli.network];
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));

    await truffle.compile();

    console.log(`Deploying ${iexecConfig.name} contract...`);
    const compiledFileJSONPath = `build/contracts/${iexecConfig.name}.json`;
    const compiledFileJSON = await readFileAsync(compiledFileJSONPath);
    const compiledFile = JSON.parse(compiledFileJSON);
    const { abi, unlinked_binary } = compiledFile;

    const contract = new web3.eth.Contract(abi);

    const toDeploy = { data: unlinked_binary };
    if (iexecConfig.constructorArgs) toDeploy.arguments = iexecConfig.constructorArgs;

    const unsignedTx = contract.deploy(toDeploy).encodeABI();

    if (cli.wallet === 'local') {
      const userWallet = await wallet.load();
      const [networkGasPrice, nonce, networkChainId] = await Promise.all([
        web3.eth.getGasPrice(),
        web3.eth.getTransactionCount(userWallet.address),
        web3.eth.net.getId(),
      ]);
      debug('networkGasPrice', networkGasPrice);
      debug('nonce', nonce);

      const gasPriceMultiplier = network.gasPriceMultiplier || 3;
      const gasPrice = network.gasPrice || networkGasPrice * gasPriceMultiplier;
      debug('gasPrice', gasPrice);
      const gasLimit = network.gas || 4400000;
      debug('gasLimit', gasLimit);
      const chainId = network.chainId || networkChainId;
      debug('chainId', chainId);

      const { rawTx } = tx.sign({
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasLimit),
        data: unsignedTx,
        chainId,
      }, userWallet.privateKey);

      const txReceipt = await web3.eth.sendSignedTransaction('0x'.concat(rawTx))
        .once('transactionHash', hash => console.log('txHash', hash, '\n'))
        .on('error', error => debug('error', error));
      console.log('txReceipt', txReceipt, '\n');
      console.log(`View on etherscan: https://${cli.network}.etherscan.io/tx/${txReceipt.transactionHash}\n`);

      compiledFile.networks[chainId] = { address: txReceipt.contractAddress };
      await writeFileAsync(compiledFileJSONPath, JSON.stringify(compiledFile, null, 4));
      console.log(`saved new contract address to ${compiledFileJSONPath}\n`);
    } else if (cli.wallet === 'remote') {
      debug('remote');
    }
  } catch (error) {
    console.log(`"iexec migrate" failed with ${error}`);
  }
};
migrate();
