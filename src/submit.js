const Debug = require('debug');
const ora = require('ora');
const Web3 = require('web3');
const Promise = require('bluebird');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const rlcJSON = require('rlc-faucet-contract/build/contracts/FaucetRLC.json');
const wallet = require('./wallet');
const utils = require('./utils');

const debug = Debug('iexec:submit');

const submit = async (networkName, methodName, param) => {
  const spinner = ora({ color: 'yellow' });
  try {
    const userWallet = await wallet.load();

    const fnString = methodName.concat('(', param, ')');
    const network = utils.truffleConfig.networks[networkName];

    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);

    const { abi, networks } = await utils.loadContractDesc();

    if (!(network.network_id in networks)) throw Error(`No existing deployed contract on ${networkName}`);
    const dappAddress = networks[network.network_id].address;
    const dappContract = web3.eth.contract(abi).at(dappAddress);
    debug('dappAddress', dappAddress);

    const unsignedTx = dappContract[methodName].getData(param);
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

    if (dappPrice > allowance) throw Error(`the dapp price (${dappPrice} nRLC) is higher than your iexec credit (${allowance} nRLC).`);

    const txHash = await utils.signAndSendTx({
      web3,
      userWallet,
      unsignedTx,
      network,
      contractAddress: dappAddress,
      value: callbackPrice,
    });
    spinner.info(`${fnString} txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await utils.waitFor(web3.eth.getTransactionReceiptAsync, txHash);

    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));
    spinner.info(`View on etherscan: https://${networkName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);
    spinner.succeed('calculation job submitted to iExec workers \n');
  } catch (error) {
    spinner.fail(`"iexec submit" failed with ${error}`);
    throw error;
  }
};

module.exports = submit;
