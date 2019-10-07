const Debug = require('debug');
const fetch = require('cross-fetch');
const BN = require('bn.js');
const { Contract } = require('ethers');
const { Interface } = require('ethers').utils;
const {
  ethersBnToBn,
  bnToEthersBn,
  ethersBigNumberify,
  truncateBnWeiToBnNRlc,
  bnNRlcToBnWei,
  checksummedAddress,
} = require('./utils');
const foreignBridgeErcToNativeDesc = require('./abi/bridge/ForeignBridgeErcToNative.json');
const homeBridgeErcToNativeDesc = require('./abi/bridge/HomeBridgeErcToNative.json');
const { addressSchema, uint256Schema, throwIfMissing } = require('./validator');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');
const { BridgeError } = require('./errors');

const debug = Debug('iexec:wallet');

const ethFaucets = [
  {
    chainName: 'ropsten',
    name: 'faucet.ropsten.be',
    getETH: address => fetch(`http://faucet.ropsten.be:3001/donate/${address}`)
      .then(res => res.json())
      .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'ropsten',
    name: 'ropsten.faucet.b9lab.com',
    getETH: address => fetch('https://ropsten.faucet.b9lab.com/tap', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ toWhom: address }),
    })
      .then(res => res.json())
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
];

const getAddress = async (contracts = throwIfMissing()) => {
  const address = await wrapCall(
    contracts.jsonRpcProvider.getSigner().getAddress(),
  );
  return checksummedAddress(address);
};

const checkBalances = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(address);
    const { isNative } = contracts;
    const getETH = () => contracts.jsonRpcProvider.getBalance(vAddress);
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
    const filteredFaucets = ethFaucets.filter(e => e.chainName === chainName);
    if (filteredFaucets.length === 0) throw Error(`No ETH faucet on chain ${chainName}`);
    const faucetsResponses = await Promise.all(
      filteredFaucets.map(faucet => faucet.getETH(vAddress)),
    );
    const responses = filteredFaucets.reduce((accu, curr, index) => {
      accu.push(
        Object.assign(
          {
            name: curr.name,
          },
          { response: faucetsResponses[index] },
        ),
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
    ).then(res => res.json()),
  },
];

const getRLC = async (
  chainName = throwIfMissing(),
  account = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(account);
    const faucetsResponses = await Promise.all(
      rlcFaucets.map(faucet => faucet.getRLC(chainName, vAddress)),
    );
    const responses = rlcFaucets.reduce((accu, curr, index) => {
      accu.push(
        Object.assign(
          {
            name: curr.name,
          },
          { response: faucetsResponses[index] },
        ),
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
    const vAddress = await addressSchema().validate(to);
    const vValue = await uint256Schema().validate(value);
    const hexValue = ethersBigNumberify(vValue).toHexString();
    const ethSigner = contracts.jsonRpcProvider.getSigner();
    const tx = await wrapSend(
      ethSigner.sendTransaction({
        data: '0x',
        to: vAddress,
        value: hexValue,
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
  const vAddress = await addressSchema().validate(to);
  const vAmount = await uint256Schema().validate(nRlcAmount);
  try {
    const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
    const rlcContract = contracts.getRLCContract({ at: rlcAddress });
    const tx = await wrapSend(rlcContract.transfer(vAddress, vAmount));
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
    const vAddress = await addressSchema().validate(to);
    const vValue = await uint256Schema().validate(value);
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
    const vAddress = await addressSchema().validate(to);
    const vAmount = await uint256Schema().validate(nRlcAmount);
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
    const vAddressTo = await addressSchema().validate(to);
    const userAddress = await getAddress(contracts);
    const code = await contracts.jsonRpcProvider.getCode(vAddressTo);
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
          debug(error);
          errors.push(`Failed to transfert ERC20': ${error.message}`);
          throw Error(
            `Failed to sweep ERC20, sweep aborted. errors: ${errors}`,
          );
        }
        balances = await checkBalances(contracts, userAddress);
      }
    }
    const gasPrice = new BN(
      (await contracts.jsonRpcProvider.getGasPrice()).toString(),
    );
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
    const vBridgeAddress = await addressSchema().validate(bridgeAddress);
    const vSidechainBridgeAddress = sidechainBridgeAddress
      ? await addressSchema().validate(sidechainBridgeAddress)
      : undefined;
    const vAmount = await uint256Schema().validate(nRlcAmount);
    if (contracts.isNative) throw Error('Current chain is a sidechain');

    const ercBridgeContract = new Contract(
      vBridgeAddress,
      foreignBridgeErcToNativeDesc.abi,
      contracts.jsonRpcProvider,
    );
    const [minPerTx, maxPerTx, currentDay, dailyLimit] = await Promise.all([
      wrapCall(ercBridgeContract.minPerTx()),
      wrapCall(ercBridgeContract.maxPerTx()),
      wrapCall(ercBridgeContract.getCurrentDay()),
      wrapCall(ercBridgeContract.dailyLimit()),
    ]);
    if (new BN(vAmount).lt(ethersBnToBn(minPerTx))) {
      throw Error(
        `Minimum amount allowed to bridge is ${minPerTx.toString()} nRLC`,
      );
    }
    if (new BN(vAmount).gt(ethersBnToBn(maxPerTx))) {
      throw Error(
        `Maximum amount allowed to bridge is ${maxPerTx.toString()} nRLC`,
      );
    }
    // check daily amount transfered to bridge
    const dayStartTimestamp = currentDay.toNumber() * (60 * 60 * 24);
    debug('dayStartTimestamp', dayStartTimestamp);
    const currentBlockNumber = await wrapCall(
      contracts.jsonRpcProvider.getBlockNumber(),
    );
    debug('currentBlockNumber', currentBlockNumber);
    const currentBlock = await wrapCall(
      contracts.jsonRpcProvider.getBlock(currentBlockNumber),
    );
    const findBlockNumberByTimestamp = async (
      lastTriedBlock,
      targetTimestamp,
      step,
    ) => {
      const triedBlockNumber = Math.max(lastTriedBlock.number - step, 0);
      const triedBlock = await wrapCall(
        contracts.jsonRpcProvider.getBlock(triedBlockNumber),
      );
      const triedBlockTimestamp = triedBlock.timestamp;
      const remainingTime = triedBlockTimestamp - targetTimestamp;
      debug('remainingTime', remainingTime);
      if (remainingTime > 0) {
        debug('triedBlockTimestamp', triedBlockTimestamp);
        const stepTime = currentBlock.timestamp - triedBlockTimestamp;
        debug('stepTime', stepTime);
        const nextStep = Math.ceil((remainingTime / stepTime) * step) + 10;
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
    const transferLogs = await contracts.jsonRpcProvider.getLogs({
      fromBlock: startBlockNumber,
      toBlock: 'latest',
      address: erc20Address,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      ],
    });
    const erc20Interface = new Interface(erc20conctract.interface.abi);
    let totalSpentPerDay = new BN(0);
    const processTransferLogs = async (logs, checkTimestamp = true) => {
      if (logs.length === 0) return;
      let isInvalidTimestamp = checkTimestamp;
      if (checkTimestamp) {
        const logTimestamp = (await wrapCall(
          contracts.jsonRpcProvider.getBlock(logs[0].blockNumber),
        )).timestamp;
        isInvalidTimestamp = logTimestamp < dayStartTimestamp;
      }
      if (!isInvalidTimestamp) {
        const parsedLog = erc20Interface.parseLog(logs[0]);
        if (parsedLog.values.to === vBridgeAddress) {
          totalSpentPerDay = totalSpentPerDay.add(
            ethersBnToBn(parsedLog.values.value),
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
        `Amount to bridge would exceed bridge daily limit. ${totalSpentPerDay}/${dailyLimit} nRLC already bridged today.`,
      );
    }

    const sidechainBlockNumber = vSidechainBridgeAddress && bridgedContracts
      ? await bridgedContracts.jsonRpcProvider.getBlockNumber()
      : 0;

    sendTxHash = await sendRLC(contracts, vAmount, vBridgeAddress);
    debug('sendTxHash', sendTxHash);

    if (vSidechainBridgeAddress && bridgedContracts) {
      const waitAffirmationCompleted = txHash => new Promise((resolve) => {
        debug('waitAffirmationCompleted');
        const sidechainBridge = new Contract(
          vSidechainBridgeAddress,
          homeBridgeErcToNativeDesc.abi,
          bridgedContracts.jsonRpcProvider,
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
          bridgedContracts.jsonRpcProvider.resetEventsBlock(
            sidechainBlockNumber,
          );
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
    const vBridgeAddress = await addressSchema().validate(bridgeAddress);
    const vMainchainBridgeAddress = mainchainBridgeAddress
      ? await addressSchema().validate(mainchainBridgeAddress)
      : undefined;
    const vAmount = await uint256Schema().validate(nRlcAmount);
    if (!contracts.isNative) throw Error('Current chain is a mainchain');

    const sidechainBridgeContract = new Contract(
      vBridgeAddress,
      homeBridgeErcToNativeDesc.abi,
      contracts.jsonRpcProvider,
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
          .then(currentDay => sidechainBridgeContract.totalSpentPerDay(currentDay)),
      ),
    ]);
    debug('minPerTx', minPerTx.toString());
    debug('maxPerTx', maxPerTx.toString());
    debug('withinLimit', withinLimit);
    debug('dailyLimit', dailyLimit.toString());
    debug('totalSpentPerDay', totalSpentPerDay.toString());

    if (bnWeiValue.lt(ethersBnToBn(minPerTx))) {
      throw Error(
        `Minimum amount allowed to bridge is ${truncateBnWeiToBnNRlc(
          ethersBnToBn(minPerTx),
        )} nRLC`,
      );
    }
    if (bnWeiValue.gt(ethersBnToBn(maxPerTx))) {
      throw Error(
        `Maximum amount allowed to bridge is ${truncateBnWeiToBnNRlc(
          ethersBnToBn(maxPerTx),
        )} nRLC`,
      );
    }
    if (!withinLimit) {
      throw Error(
        `Amount to bridge would exceed bridge daily limit. ${truncateBnWeiToBnNRlc(
          ethersBnToBn(totalSpentPerDay),
        )}/${truncateBnWeiToBnNRlc(
          ethersBnToBn(dailyLimit),
        )} nRLC already bridged today`,
      );
    }

    const mainchainBlockNumber = vMainchainBridgeAddress && bridgedContracts
      ? await wrapCall(bridgedContracts.jsonRpcProvider.getBlockNumber())
      : 0;

    sendTxHash = await sendNativeToken(contracts, weiValue, vBridgeAddress);
    debug('sendTxHash', sendTxHash);

    if (vMainchainBridgeAddress && bridgedContracts) {
      const waitRelayedMessage = txHash => new Promise((resolve) => {
        debug('waitRelayedMessage');
        const mainchainBridge = new Contract(
          vMainchainBridgeAddress,
          foreignBridgeErcToNativeDesc.abi,
          bridgedContracts.jsonRpcProvider,
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
          bridgedContracts.jsonRpcProvider.resetEventsBlock(
            mainchainBlockNumber,
          );
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
