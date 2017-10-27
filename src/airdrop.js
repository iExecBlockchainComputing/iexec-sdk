const Debug = require('debug');
const fs = require('fs-extra');
const Papa = require('papaparse');
const ora = require('ora');
const rlcJSON = require('rlc-faucet-contract/build/contracts/FaucetRLC.json');
const Promise = require('bluebird');
const moment = require('moment');
const {
  getChains, signAndSendTx, waitFor, oraOptions,
} = require('./utils');
const wallet = require('./wallet');

const readFileAsync = Promise.promisify(fs.readFile);

let MAX_CONCURRENT_TX = 0;
let transferring = 0;
let transferred = 0;
let errored = 0;
let paid = 0;
let gasUsed = 0;
let ethUsed = 0;
let processCall = 0;
let saving = 0;
let nonceOffset = 0;
let blockNumber = 0;

const debug = Debug('iexec:airdrop');

const airdrop = async (chainName, csvPath, batch) => {
  const spinner = ora(oraOptions);
  try {
    MAX_CONCURRENT_TX = batch;

    const startTime = new Date();
    const userWallet = await wallet.load();
    const chains = getChains();
    const chain = chains[chainName];
    const rlcAddress = rlcJSON.networks[chain.id].address;
    const rlcContract = chain.web3.eth.contract(rlcJSON.abi).at(rlcAddress);

    spinner.start('RLC airdrop going on...');

    const csvStr = await readFileAsync(csvPath, 'utf8');
    const outputCSVPath = 'airdrop-result-'.concat(csvPath);
    const outputCSVStream = fs.createWriteStream(outputCSVPath);

    const csv = Papa.parse(csvStr, {
      header: true,
      skipEmptyLines: true,
    });
    debug('csv', csv);
    const { delimiter, linebreak, fields } = csv.meta;
    fields.push('result');
    const header = fields.join(delimiter).concat(linebreak);
    outputCSVStream.write(header);

    const total = csv.data.length;
    const totalAmount = csv.data.reduce((accu, elt) => accu + parseInt(elt.amount, 10), 0);
    spinner.info(`${total} transfers to be transferred`);
    spinner.info(`${totalAmount} nRLC to be airdropped \n`);

    spinner.start(`RLC airdrop going on... ${transferred}/${total} already transfered`);

    const transfersToDo = csv.data.map((elt, i) => async () => {
      const row = Object.assign({}, elt);
      try {
        transferring += 1;
        debug('start transferring index', i, elt);
        const unsignedTx = rlcContract.transfer.getData(elt.address, elt.amount);

        const newBlockNumber = await chain.web3.eth.getBlockNumberAsync();
        debug('blockNumber', blockNumber);
        debug('newBlockNumber', newBlockNumber);
        debug('nonceOffset', nonceOffset);
        if (newBlockNumber !== blockNumber) {
          nonceOffset = 0;
          blockNumber = newBlockNumber;
        } else {
          nonceOffset += 1;
        }
        debug('new nonceOffset', nonceOffset);

        const txHash = await signAndSendTx({
          web3: chain.web3,
          userWallet,
          unsignedTx,
          network: chain,
          contractAddress: rlcAddress,
          nonceOffset,
          chainID: chain.id,
        });
        debug('txHash', txHash);

        const [tx, txReceipt] = await Promise.all([
          chain.web3.eth.getTransactionAsync(txHash),
          waitFor(chain.web3.eth.getTransactionReceiptAsync, txHash),
        ]);
        debug('txReceipt:', txReceipt);
        debug('tx:', tx);
        const etherscanURL = `https://${chainName}.etherscan.io/tx/${txReceipt.transactionHash}`;

        transferred += 1;
        transferring -= 1;
        saving += 1;

        paid += parseInt(elt.amount, 10);
        gasUsed += txReceipt.gasUsed;
        ethUsed += txReceipt.gasUsed * tx.gasPrice.toNumber();
        spinner.succeed(`Transfered ${elt.amount} nRLC to ${elt.address} [${transferred + errored}/${total}]. View on etherscan: ${etherscanURL}\n`);
        spinner.start('RLC airdrop going on...');
        row.result = etherscanURL;
        row.index = i;
        return row;
      } catch (error) {
        errored += 1;
        transferring -= 1;
        saving += 1;

        spinner.fail(`Failed to transfer ${elt.amount} nRLC to ${elt.address} because ${error}`);
        spinner.start('RLC airdrop going on...');
        row.result = error;
        row.index = i;
        return row;
      }
    });

    const processTransfers = async () => {
      debug('processCall', processCall += 1);
      debug('transferring', transferring);
      debug('saving', saving);
      debug('transferred', transferred);
      debug('errored', errored);
      if (transfersToDo.length === 0 && transferring === 0 && saving === 0) {
        outputCSVStream.end();
        const endTime = new Date();
        const duration = moment.duration(endTime - startTime).humanize();
        spinner.succeed(`Processed ${transferred}/${total} transfers in ${duration}`);
        spinner.succeed(`Transfered ${paid} nRLC on ${chainName}`);
        spinner.succeed(`Spent ${chain.web3.fromWei(ethUsed, 'ether')} ETH, and ${gasUsed} gas used`);
        spinner.succeed(`${errored} failed transfers`);
        spinner.succeed(`Result saved to file "${outputCSVPath}"`);
        return;
      }
      if (transferring >= MAX_CONCURRENT_TX) {
        debug('transferring', transferring);
        debug('MAX_CONCURRENT_TX', MAX_CONCURRENT_TX);
        return;
      }
      if (transfersToDo.length === 0) {
        debug('transfersToDo.length', transfersToDo.length);
        return;
      }

      const transferToDo = transfersToDo.shift();
      transferToDo().then((row) => {
        debug('transferResolved index', row.index);
        const rowFields = Object.keys(row);
        const rowValues = rowFields.map(elt => row[elt]);
        const csvRow = rowValues.join(delimiter).concat(linebreak);

        outputCSVStream.write(csvRow);
        saving -= 1;
        processTransfers();
      });
      processTransfers();
    };
    processTransfers();
  } catch (error) {
    spinner.fail(`airdrop() failed with ${error}`);
    throw error;
  }
};

module.exports = airdrop;
