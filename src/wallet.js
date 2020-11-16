const Debug = require('debug');
const fetch = require('cross-fetch');
const BN = require('bn.js');
const { Contract, BigNumber } = require('ethers');
const {
  ethersBnToBn,
  bnToEthersBn,
  truncateBnWeiToBnNRlc,
  bnNRlcToBnWei,
  checksummedAddress,
  formatRLC,
} = require('./utils');
const foreignBridgeErcToNativeDesc = require('./abi/bridge/ForeignBridgeErcToNative.json');
const homeBridgeErcToNativeDesc = require('./abi/bridge/HomeBridgeErcToNative.json');
const {
  addressSchema,
  uint256Schema,
  nRlcAmountSchema,
  weiAmountSchema,
  throwIfMissing,
} = require('./validator');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');
const { BridgeError } = require('./errors');

const debug = Debug('iexec:wallet');

const ethFaucets = [
  {
    chainName: 'ropsten',
    name: 'faucet.ropsten.be',
    getETH: (address) => fetch(`http://faucet.ropsten.be:3001/donate/${address}`)
      .then((res) => res.json())
      .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'ropsten',
    name: 'ropsten.faucet.b9lab.com',
    getETH: (address) => fetch('https://ropsten.faucet.b9lab.com/tap', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ toWhom: address }),
    })
      .then((res) => res.json())
      .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'rinkeby',
    name: 'faucet.rinkeby.io',
    getETH: () => ({
      error: 'Go to https://faucet.rinkeby.io/ to manually ask for ETH',
    }),
  },
  {
    chainName: 'kovan',
    name: 'gitter.im/kovan-testnet/faucet',
    getETH: () => ({
      error:
        'Go to https://gitter.im/kovan-testnet/faucet to manually ask for ETH',
    }),
  },
  {
    chainName: 'kovan',
    name: 'faucet.kovan.network',
    getETH: () => ({
      error: 'Go to https://faucet.kovan.network to manually ask for ETH',
    }),
  },
  {
    chainName: 'goerli',
    name: 'goerli-faucet.slock.it',
    getETH: () => ({
      error: 'Go to https://goerli-faucet.slock.it/ to manually ask for ETH',
    }),
  },
];

const getAddress = async (contracts = throwIfMissing()) => {
  if (!contracts.signer) throw Error('Missing Signer');
  const address = await wrapCall(contracts.signer.getAddress());
  return checksummedAddress(address);
};

const checkBalances = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
    const { isNative } = contracts;
    const getETH = () => contracts.provider.getBalance(vAddress);
    const balances = {};
    if (isNative) {
      const weiBalance = await getETH();
      Object.assign(balances, {
        wei: ethersBnToBn(weiBalance),
        nRLC: truncateBnWeiToBnNRlc(ethersBnToBn(weiBalance)),
      });
    } else {
      const rlcAddress = await contracts.fetchRLCAddress();
      const getRLC = () => contracts
        .getRLCContract({
          at: rlcAddress,
        })
        .balanceOf(vAddress)
        .catch((error) => {
          debug(error);
          return 0;
        });

      const [weiBalance, rlcBalance] = await Promise.all([getETH(), getRLC()]);
      Object.assign(balances, {
        wei: ethersBnToBn(weiBalance),
        nRLC: ethersBnToBn(rlcBalance),
      });
    }
    debug('balances', balances);
    return balances;
  } catch (error) {
    debug('checkBalances()', error);
    throw error;
  }
};

const getETH = async (
  chainName = throwIfMissing(),
  account = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(account);
    const filteredFaucets = ethFaucets.filter((e) => e.chainName === chainName);
    if (filteredFaucets.length === 0) throw Error(`No ETH faucet on chain ${chainName}`);
    const faucetsResponses = await Promise.all(
      filteredFaucets.map((faucet) => faucet.getETH(vAddress)),
    );
    const responses = filteredFaucets.reduce((accu, curr, index) => {
      accu.push(
        {
          name: curr.name,
          response: faucetsResponses[index],
        },
      );
      return accu;
    }, []);
    return responses;
  } catch (error) {
    debug('getETH()', error);
    throw error;
  }
};

const rlcFaucets = [
  {
    name: 'faucet.iex.ec',
    getRLC: (chainName, address) => fetch(
      `https://api.faucet.iex.ec/getRLC?chainName=${chainName}&address=${address}`,
    ).then((res) => res.json()),
  },
];

const getRLC = async (
  chainName = throwIfMissing(),
  account = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(account);
    const faucetsResponses = await Promise.all(
      rlcFaucets.map((faucet) => faucet.getRLC(chainName, vAddress)),
    );
    const responses = rlcFaucets.reduce((accu, curr, index) => {
      accu.push(
        {
          name: curr.name,
          response: faucetsResponses[index],
        },
      );
      return accu;
    }, []);
    return responses;
  } catch (error) {
    debug('getRLC()', error);
    throw error;
  }
};

const sendNativeToken = async (
  contracts = throwIfMissing(),
  value = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(to);
    const vValue = await uint256Schema().validate(value);
    const hexValue = BigNumber.from(vValue).toHexString();
    if (!contracts.signer) throw Error('Missing Signer');
    const tx = await wrapSend(
      contracts.signer.sendTransaction({
        data: '0x',
        to: vAddress,
        value: hexValue,
        gasPrice:
          (contracts.txOptions && contracts.txOptions.gasPrice) || undefined,
      }),
    );
    await wrapWait(tx.wait());
    return tx.hash;
  } catch (error) {
    debug('sendNativeToken()', error);
    throw error;
  }
};

const sendERC20 = async (
  contracts = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  to = throwIfMissing(),
) => {
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(to);
  const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
  try {
    const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
    const rlcContract = contracts.getRLCContract({ at: rlcAddress });
    const tx = await wrapSend(
      rlcContract.transfer(vAddress, vAmount, contracts.txOptions),
    );
    await wrapWait(tx.wait());
    return tx.hash;
  } catch (error) {
    debug('sendERC20()', error);
    throw error;
  }
};

const sendETH = async (
  contracts = throwIfMissing(),
  value = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(to);
    const vValue = await weiAmountSchema().validate(value);
    if (contracts.isNative) throw Error('sendETH() is disabled on sidechain, use sendRLC()');
    const txHash = await sendNativeToken(contracts, vValue, vAddress);
    return txHash;
  } catch (error) {
    debug('sendETH()', error);
    throw error;
  }
};

const sendRLC = async (
  contracts = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(to);
    const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
    if (contracts.isNative) {
      debug('send native token');
      const weiValue = bnNRlcToBnWei(new BN(vAmount)).toString();
      const txHash = await sendNativeToken(contracts, weiValue, vAddress);
      return txHash;
    }
    debug('send ERC20 token');
    const txHash = await sendERC20(contracts, vAmount, vAddress);
    return txHash;
  } catch (error) {
    debug('sendRLC()', error);
    throw error;
  }
};

const sweep = async (contracts = throwIfMissing(), to = throwIfMissing()) => {
  try {
    const vAddressTo = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(to);
    const userAddress = await getAddress(contracts);
    const code = await contracts.provider.getCode(vAddressTo);
    if (code !== '0x') {
      throw new Error('Cannot sweep to a contract');
    }
    let balances = await checkBalances(contracts, userAddress);
    const res = {};
    const errors = [];
    if (!contracts.isNative) {
      if (balances.nRLC.gt(new BN(0))) {
        try {
          const sendERC20TxHash = await sendERC20(
            contracts,
            bnToEthersBn(balances.nRLC),
            vAddressTo,
          );
          Object.assign(res, { sendERC20TxHash });
        } catch (error) {
          debug('error', error);
          errors.push(`Failed to transfert ERC20': ${error.message}`);
          throw Error(
            `Failed to sweep ERC20, sweep aborted. errors: ${errors}`,
          );
        }
        balances = await checkBalances(contracts, userAddress);
      }
    }
    const gasPrice = contracts.txOptions && contracts.txOptions.gasPrice
      ? ethersBnToBn(BigNumber.from(contracts.txOptions.gasPrice))
      : ethersBnToBn(await contracts.provider.getGasPrice());
    const gasLimit = new BN(21000);
    const txFee = gasPrice.mul(gasLimit);
    const sweepNative = balances.wei.sub(txFee);
    if (balances.wei.gt(new BN(txFee))) {
      try {
        const sendNativeTxHash = await sendNativeToken(
          contracts,
          bnToEthersBn(sweepNative),
          vAddressTo,
        );
        debug('sendNativeTxHash', sendNativeTxHash);
        Object.assign(res, { sendNativeTxHash });
      } catch (error) {
        debug(error);
        errors.push(`Failed to transfert native token': ${error.message}`);
      }
    } else {
      const err = 'Tx fees are greather than wallet balance';
      debug(err);
      errors.push(`Failed to transfert native token': ${err}`);
    }
    if (errors.length > 0) Object.assign(res, { errors });
    return res;
  } catch (error) {
    debug('sweep()', error);
    throw error;
  }
};

const bridgeToSidechain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { sidechainBridgeAddress, bridgedContracts } = {},
) => {
  let sendTxHash;
  let receiveTxHash;
  try {
    const vBridgeAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(bridgeAddress);
    const vSidechainBridgeAddress = sidechainBridgeAddress
      ? await addressSchema({
        ethProvider: contracts.provider,
      }).validate(sidechainBridgeAddress)
      : undefined;
    const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
    if (contracts.isNative) throw Error('Current chain is a sidechain');

    const ercBridgeContract = new Contract(
      vBridgeAddress,
      foreignBridgeErcToNativeDesc.abi,
      contracts.provider,
    );
    const [minPerTx, maxPerTx, currentDay, dailyLimit] = await Promise.all([
      wrapCall(ercBridgeContract.minPerTx()),
      wrapCall(ercBridgeContract.maxPerTx()),
      wrapCall(ercBridgeContract.getCurrentDay()),
      wrapCall(ercBridgeContract.dailyLimit()),
    ]);
    if (new BN(vAmount).lt(ethersBnToBn(minPerTx))) {
      throw Error(
        `Minimum amount allowed to bridge is ${formatRLC(
          minPerTx.toString(),
        )} RLC`,
      );
    }
    if (new BN(vAmount).gt(ethersBnToBn(maxPerTx))) {
      throw Error(
        `Maximum amount allowed to bridge is ${formatRLC(
          maxPerTx.toString(),
        )} RLC`,
      );
    }
    // check daily amount transfered to bridge
    const dayStartTimestamp = currentDay.toNumber() * (60 * 60 * 24);
    debug('dayStartTimestamp', dayStartTimestamp);
    const currentBlockNumber = await wrapCall(
      contracts.provider.getBlockNumber(),
    );
    debug('currentBlockNumber', currentBlockNumber);
    const currentBlock = await wrapCall(
      contracts.provider.getBlock(currentBlockNumber),
    );
    const findBlockNumberByTimestamp = async (
      lastTriedBlock,
      targetTimestamp,
      step,
    ) => {
      const triedBlockNumber = Math.max(lastTriedBlock.number - step, 0);
      const triedBlock = await wrapCall(
        contracts.provider.getBlock(triedBlockNumber),
      );
      const triedBlockTimestamp = triedBlock.timestamp;
      const remainingTime = triedBlockTimestamp - targetTimestamp;
      debug('remainingTime', remainingTime);
      if (remainingTime > 0) {
        debug(
          'triedBlockTimestamp',
          triedBlockTimestamp,
          'lastTriedBlock.timestamp',
          lastTriedBlock.timestamp,
        );
        const stepTime = Math.max(
          lastTriedBlock.timestamp - triedBlockTimestamp,
          100,
        );
        debug('stepTime', stepTime);
        const nextStep = Math.min(
          Math.ceil((remainingTime / stepTime) * step) + 5,
          1000,
        );
        debug('nextStep', nextStep);
        return findBlockNumberByTimestamp(
          triedBlock,
          targetTimestamp,
          nextStep,
        );
      }
      return triedBlock.number;
    };
    const startBlockNumber = await findBlockNumberByTimestamp(
      currentBlock,
      dayStartTimestamp,
      100,
    );
    debug('startBlockNumber', startBlockNumber);
    const erc20Address = await contracts.fetchRLCAddress();
    const erc20conctract = contracts.getRLCContract({ at: erc20Address });
    const transferLogs = await contracts.provider.getLogs({
      fromBlock: startBlockNumber,
      toBlock: 'latest',
      address: erc20Address,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      ],
    });
    const erc20Interface = erc20conctract.interface;
    let totalSpentPerDay = new BN(0);
    const processTransferLogs = async (logs, checkTimestamp = true) => {
      if (logs.length === 0) return;
      let isInvalidTimestamp = checkTimestamp;
      if (checkTimestamp) {
        const logTimestamp = (
          await wrapCall(contracts.provider.getBlock(logs[0].blockNumber))
        ).timestamp;
        isInvalidTimestamp = logTimestamp < dayStartTimestamp;
      }
      if (!isInvalidTimestamp) {
        const parsedLog = erc20Interface.parseLog(logs[0]);
        if (parsedLog.args.to === vBridgeAddress) {
          totalSpentPerDay = totalSpentPerDay.add(
            ethersBnToBn(parsedLog.args.value),
          );
        }
      }
      logs.shift();
      await processTransferLogs(logs, isInvalidTimestamp);
    };
    await processTransferLogs(transferLogs);
    debug('totalSpentPerDay', totalSpentPerDay.toString());
    const withinLimit = totalSpentPerDay.lt(ethersBnToBn(dailyLimit));
    if (!withinLimit) {
      throw Error(
        `Amount to bridge would exceed bridge daily limit. ${formatRLC(
          totalSpentPerDay,
        )}/${formatRLC(dailyLimit)} RLC already bridged today.`,
      );
    }

    const sidechainBlockNumber = vSidechainBridgeAddress && bridgedContracts
      ? await bridgedContracts.provider.getBlockNumber()
      : 0;

    sendTxHash = await sendRLC(contracts, vAmount, vBridgeAddress);
    debug('sendTxHash', sendTxHash);

    if (vSidechainBridgeAddress && bridgedContracts) {
      const waitAffirmationCompleted = (txHash) => new Promise((resolve) => {
        debug('waitAffirmationCompleted');
        const sidechainBridge = new Contract(
          vSidechainBridgeAddress,
          homeBridgeErcToNativeDesc.abi,
          bridgedContracts.provider,
        );
        const cleanListeners = () => sidechainBridge.removeAllListeners('AffirmationCompleted');
        try {
          sidechainBridge.on(
            sidechainBridge.filters.AffirmationCompleted(),
            (address, amount, refTxHash, event) => {
              if (refTxHash === txHash) {
                cleanListeners();
                debug('AffirmationCompleted', event);
                resolve(event);
              }
            },
          );
          bridgedContracts.provider.resetEventsBlock(sidechainBlockNumber);
          debug(`watching events from block ${sidechainBlockNumber}`);
        } catch (e) {
          cleanListeners();
          throw e;
        }
      });
      const event = await waitAffirmationCompleted(sendTxHash);
      receiveTxHash = event.transactionHash;
    }
    return { sendTxHash, receiveTxHash };
  } catch (error) {
    debug('bridgeToSidechain()', error);
    if (sendTxHash) throw new BridgeError(error, sendTxHash);
    throw error;
  }
};

const bridgeToMainchain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { mainchainBridgeAddress, bridgedContracts } = {},
) => {
  let sendTxHash;
  let receiveTxHash;
  try {
    const vBridgeAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(bridgeAddress);
    const vMainchainBridgeAddress = mainchainBridgeAddress
      ? await addressSchema({
        ethProvider: contracts.provider,
      }).validate(mainchainBridgeAddress)
      : undefined;
    const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
    if (!contracts.isNative) throw Error('Current chain is a mainchain');

    const sidechainBridgeContract = new Contract(
      vBridgeAddress,
      homeBridgeErcToNativeDesc.abi,
      contracts.provider,
    );

    const bnWeiValue = bnNRlcToBnWei(new BN(vAmount));
    const weiValue = bnWeiValue.toString();

    const [
      minPerTx,
      maxPerTx,
      withinLimit,
      dailyLimit,
      totalSpentPerDay,
    ] = await Promise.all([
      wrapCall(sidechainBridgeContract.minPerTx()),
      wrapCall(sidechainBridgeContract.maxPerTx()),
      wrapCall(sidechainBridgeContract.withinLimit(weiValue)),
      wrapCall(sidechainBridgeContract.dailyLimit()),
      wrapCall(
        sidechainBridgeContract
          .getCurrentDay()
          .then((currentDay) => sidechainBridgeContract.totalSpentPerDay(currentDay)),
      ),
    ]);
    debug('minPerTx', minPerTx.toString());
    debug('maxPerTx', maxPerTx.toString());
    debug('withinLimit', withinLimit);
    debug('dailyLimit', dailyLimit.toString());
    debug('totalSpentPerDay', totalSpentPerDay.toString());

    if (bnWeiValue.lt(ethersBnToBn(minPerTx))) {
      throw Error(
        `Minimum amount allowed to bridge is ${formatRLC(
          truncateBnWeiToBnNRlc(ethersBnToBn(minPerTx)),
        )} RLC`,
      );
    }
    if (bnWeiValue.gt(ethersBnToBn(maxPerTx))) {
      throw Error(
        `Maximum amount allowed to bridge is ${formatRLC(
          truncateBnWeiToBnNRlc(ethersBnToBn(maxPerTx)),
        )} RLC`,
      );
    }
    if (!withinLimit) {
      throw Error(
        `Amount to bridge would exceed bridge daily limit. ${formatRLC(
          truncateBnWeiToBnNRlc(ethersBnToBn(totalSpentPerDay)),
        )}/${formatRLC(
          truncateBnWeiToBnNRlc(ethersBnToBn(dailyLimit)),
        )} RLC already bridged today`,
      );
    }

    const mainchainBlockNumber = vMainchainBridgeAddress && bridgedContracts
      ? await wrapCall(bridgedContracts.provider.getBlockNumber())
      : 0;

    sendTxHash = await sendNativeToken(contracts, weiValue, vBridgeAddress);
    debug('sendTxHash', sendTxHash);

    if (vMainchainBridgeAddress && bridgedContracts) {
      const waitRelayedMessage = (txHash) => new Promise((resolve) => {
        debug('waitRelayedMessage');
        const mainchainBridge = new Contract(
          vMainchainBridgeAddress,
          foreignBridgeErcToNativeDesc.abi,
          bridgedContracts.provider,
        );
        const cleanListeners = () => mainchainBridge.removeAllListeners('RelayedMessage');
        try {
          mainchainBridge.on(
            mainchainBridge.filters.RelayedMessage(),
            (address, amount, refTxHash, event) => {
              if (refTxHash === txHash) {
                debug('RelayedMessage', event);
                cleanListeners();
                resolve(event);
              }
            },
          );
          bridgedContracts.provider.resetEventsBlock(mainchainBlockNumber);
          debug(`watching events from block ${mainchainBlockNumber}`);
        } catch (e) {
          cleanListeners();
          throw e;
        }
      });
      const event = await waitRelayedMessage(sendTxHash);
      receiveTxHash = event.transactionHash;
    }
    return { sendTxHash, receiveTxHash };
  } catch (error) {
    debug('bridgeToMainchain()', error);
    if (sendTxHash) throw new BridgeError(error, sendTxHash);
    throw error;
  }
};

module.exports = {
  bridgeToMainchain,
  bridgeToSidechain,
  getAddress,
  checkBalances,
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
};
