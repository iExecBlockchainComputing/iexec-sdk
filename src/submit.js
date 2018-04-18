const Debug = require('debug');
const ora = require('ora');
const Promise = require('bluebird');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const escrowJSON = require('iexec-oracle-contract/build/contracts/IexecOracleEscrow.json');
const rlcJSON = require('rlc-faucet-contract/build/contracts/RLC.json');
const createIEXECClient = require('iexec-server-js-client');
const wallet = require('./wallet');
const utils = require('./utils');
const oraOptions = require('./oraOptions');
const account = require('./account');

const debug = Debug('iexec:submit');

const submit = async (chainName, methodName, param, cliDappAddress) => {
  const spinner = ora(oraOptions);
  try {
    debug('cliDappAddress', cliDappAddress);
    debug('chainName', chainName);
    debug('param', param);
    const userWallet = await wallet.load();

    const work = param || JSON.stringify(utils.iexecConfig.work);
    const fnString = methodName.concat('(', work, ')');

    const chain = utils.getChains()[chainName];
    const { abi, networks } = await utils.loadContractDesc();

    if (!(chain.id in networks) && !cliDappAddress) {
      throw Error(`No existing deployed contract on ${chainName} or no --dapp contract address provided to the cli`);
    }

    // hit iexec server REST API to create a user on the fly
    // so it can be mandated by the bridge
    const { jwtoken } = await account.load();
    const iexec = createIEXECClient({ server: chain.server });
    await iexec.getCookieByJWT(jwtoken);
    const version = await iexec.get('version');
    debug('version', version);

    const dappAddress = cliDappAddress || networks[chain.id].address;
    const dappContract = chain.web3.eth.contract(abi).at(dappAddress);
    debug('dappAddress', dappAddress);

    const unsignedTx = dappContract[methodName].getData(work);
    debug('unsignedTx', unsignedTx);

    const rlcAddress = rlcJSON.networks[chain.id].address;
    const rlcContract = chain.web3.eth.contract(rlcJSON.abi).at(rlcAddress);
    Promise.promisifyAll(rlcContract);

    const escrowAddress = escrowJSON.networks[chain.id].address;
    const oracleAddress = oracleJSON.networks[chain.id].address;
    const oracleContract = chain.web3.eth
      .contract(oracleJSON.abi)
      .at(oracleAddress);
    Promise.promisifyAll(oracleContract);

    spinner.start('calling submit...');
    const [callbackPrice, dappPrice, allowance] = await Promise.all([
      oracleContract.callbackPriceAsync(),
      oracleContract.getDappPriceAsync(dappAddress),
      rlcContract.allowanceAsync(
        '0x'.concat(userWallet.address),
        escrowAddress,
      ),
    ]);
    debug('callbackPrice', callbackPrice.toNumber());
    debug('dappPrice', dappPrice.toNumber());
    debug('allowance', allowance.toNumber());

    if (dappPrice > allowance) {
      throw Error(`the dapp price (${dappPrice} nRLC) is higher than your iexec credit (${allowance} nRLC).`);
    }

    const txHash = await utils.signAndSendTx({
      chain,
      userWallet,
      unsignedTx,
      contractAddress: dappAddress,
      value: callbackPrice,
    });
    spinner.info(`${fnString} \n`);
    spinner.info(`txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await utils.waitFor(
      chain.web3.eth.getTransactionReceiptAsync,
      txHash,
    );

    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));
    spinner.info(`View on etherscan: https://${chainName}.etherscan.io/tx/${
      txReceipt.transactionHash
    }\n`);
    spinner.succeed('calculation job submitted to iExec workers \n');
  } catch (error) {
    spinner.fail(`"iexec submit" failed with ${error}`);
    throw error;
  }
};

module.exports = submit;
