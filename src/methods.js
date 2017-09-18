const Debug = require('debug');
const fs = require('fs');
const Web3 = require('web3');
const Promise = require('bluebird');
const path = require('path');
const ora = require('ora');
const tx = require('@warren-bank/ethereumjs-tx-sign');
const wallet = require('./wallet');
const utils = require('./utils');
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:methods');
const readFileAsync = Promise.promisify(fs.readFile);

const send = async (walletType, networkName, truffleConfig, methodName, args) => {
  const spinner = ora();
  try {
    const fnString = methodName.concat('(', args.join(), ')');
    spinner.start(`calling ${fnString}`);
    const network = truffleConfig.networks[networkName];

    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);

    const compiledFile = await readFileAsync(`build/contracts/${iexecConfig.name}.json`);
    const { abi, networks } = JSON.parse(compiledFile);

    const contractAddress = networks[network.network_id].address;
    const contract = web3.eth.contract(abi).at(contractAddress);

    const unsignedTx = contract[methodName].getData(...args);

    if (walletType === 'local') {
      const userWallet = await wallet.load();
      const [networkGasPrice, nonce] = await Promise.all([
        web3.eth.getGasPriceAsync(),
        web3.eth.getTransactionCountAsync('0x'.concat(userWallet.address)),
      ]);
      debug('networkGasPrice', networkGasPrice);
      debug('nonce', nonce);

      const gasPriceMultiplier = network.gasPriceMultiplier || 3;
      const gasPrice = network.gasPrice || networkGasPrice * gasPriceMultiplier;
      debug('gasPrice', gasPrice);
      const gasLimit = network.gas || 4400000;
      debug('gasLimit', gasLimit);
      const chainId = parseInt(web3.version.network, 10);
      debug('chainId', chainId);

      const { rawTx } = tx.sign({
        nonce: web3.toHex(nonce),
        gasPrice: web3.toHex(gasPrice),
        gasLimit: web3.toHex(gasLimit),
        data: unsignedTx,
        chainId,
        to: contractAddress,
      }, userWallet.privateKey);

      const txHash = await web3.eth.sendRawTransactionAsync('0x'.concat(rawTx));
      spinner.succeed(`${fnString} txHash: ${txHash} \n`);

      spinner.start('waiting for txReceipt');
      const txReceipt = await utils.waitFor(web3.eth.getTransactionReceiptAsync, txHash);
      spinner.succeed('txReceipt:');
      console.log(JSON.stringify(txReceipt, null, 4));
      console.log(`\nView on etherscan: https://${networkName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);
    } else if (walletType === 'remote') {
      debug('remote wallet');
    }
  } catch (error) {
    spinner.fail();
    debug('send()', error);
    throw error;
  }
};

module.exports = {
  send,
};
