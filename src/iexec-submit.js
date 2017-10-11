#!/usr/bin/env node

const Debug = require('debug');
const fs = require('fs');
const cli = require('commander');
const path = require('path');
const ora = require('ora');
const Web3 = require('web3');
const Promise = require('bluebird');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const rlcJSON = require('rlc-faucet-contract/build/contracts/FaucetRLC.json');
const wallet = require('./wallet');
const utils = require('./utils');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:iexec-submit');
const readFileAsync = Promise.promisify(fs.readFile);

cli
  .option('--chain, --network [name]', 'network name', 'ropsten')
  .parse(process.argv);

debug('cli.args', cli.args);

const submit = async (networkName, methodName, args) => {
  const spinner = ora();
  try {
    const userWallet = await wallet.load();

    const fnString = methodName.concat('(', args.join(), ')');
    const network = truffleConfig.networks[networkName];

    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);

    const compiledFile = await readFileAsync(`build/contracts/${iexecConfig.name}.json`);
    const { abi, networks } = JSON.parse(compiledFile);

    if (!(network.network_id in networks)) throw Error(`No existing deployed contract on ${networkName}`);
    const dappAddress = networks[network.network_id].address;
    const dappContract = web3.eth.contract(abi).at(dappAddress);
    debug('dappAddress', dappAddress);
    debug('...args', ...args);

    const unsignedTx = dappContract[methodName].getData(...args);
    debug('unsignedTx', unsignedTx);

    const rlcAddress = rlcJSON.networks[network.network_id].address;
    const rlcContract = web3.eth.contract(rlcJSON.abi).at(rlcAddress);
    Promise.promisifyAll(rlcContract);

    const oracleAddress = oracleJSON.networks[network.network_id].address;
    const oracleContract = web3.eth.contract(oracleJSON.abi).at(oracleAddress);
    Promise.promisifyAll(oracleContract);

    spinner.start(`calling ${fnString}`);
    const [callbackPrice, dappPrice, allowance] = await Promise.all([
      oracleContract.callbackPriceAsync(),
      oracleContract.getDappPriceAsync(dappAddress),
      rlcContract.allowanceAsync('0x'.concat(userWallet.address), oracleAddress),
    ]);
    debug('callbackPrice', callbackPrice.toNumber());
    debug('dappPrice', dappPrice.toNumber());
    debug('allowance', allowance.toNumber());

    if (dappPrice > allowance) throw Error(`the dapp price (${dappPrice} RLC) is higher than your iexec credit (${allowance} RLC).`);

    const txHash = await utils.signAndSendTx({
      web3,
      userWallet,
      unsignedTx,
      network,
      contractAddress: dappAddress,
      value: callbackPrice,
    });
    spinner.succeed(`${fnString} txHash: ${txHash} \n`);

    spinner.start('waiting for txReceipt');
    const txReceipt = await utils.waitFor(web3.eth.getTransactionReceiptAsync, txHash);
    spinner.succeed('txReceipt:');
    console.log(JSON.stringify(txReceipt, null, 4));
    console.log(`\nView on etherscan: https://${networkName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);
  } catch (error) {
    spinner.fail();
    debug('submit()', error);
    throw error;
  }
};
submit(cli.network, 'iexecSubmit', cli.args).catch(error => console.log(`"iexec submit" failed with ${error}`));
