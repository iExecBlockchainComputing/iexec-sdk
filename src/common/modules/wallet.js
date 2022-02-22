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
  NULL_BYTES,
} = require('../utils/utils');
const {
  addressSchema,
  uint256Schema,
  nRlcAmountSchema,
  weiAmountSchema,
  throwIfMissing,
} = require('../utils/validator');
const { wrapCall, wrapSend, wrapWait } = require('../utils/errorWrappers');
const { BridgeError } = require('../utils/errors');
const { Observable, SafeObserver } = require('../utils/reactive');
const foreignBridgeErcToNativeDesc = require('../abi/bridge/ForeignBridgeErcToNative.json');
const homeBridgeErcToNativeDesc = require('../abi/bridge/HomeBridgeErcToNative.json');

const debug = Debug('iexec:wallet');

const ethFaucets = [
  {
    chainName: 'ropsten',
    name: 'faucet.ropsten.be',
    getETH: (address) =>
      fetch(`http://faucet.ropsten.be:3001/donate/${address}`)
        .then((res) => res.json())
        .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'ropsten',
    name: 'ropsten.faucet.b9lab.com',
    getETH: (address) =>
      fetch('https://ropsten.faucet.b9lab.com/tap', {
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

const isInWhitelist = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
  { strict = true } = {},
) => {
  if (contracts.flavour !== 'enterprise') {
    throw Error('Cannot check authorized eRLC holders on current chain');
  }
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  try {
    const eRlcContract = await wrapCall(contracts.fetchTokenContract());
    const isKYC = await wrapCall(eRlcContract.isKYC(vAddress));
    if (!isKYC && strict) {
      throw Error(`${vAddress} is not authorized to interact with eRLC`);
    }
    return isKYC;
  } catch (error) {
    debug('isInWhitelist()', error);
    throw error;
  }
};

const getRlcBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  const { isNative } = contracts;
  if (isNative) {
    const weiBalance = await contracts.provider.getBalance(vAddress);
    return truncateBnWeiToBnNRlc(ethersBnToBn(weiBalance));
  }
  const rlcContract = await wrapCall(contracts.fetchTokenContract());
  const nRlcBalance = await wrapCall(rlcContract.balanceOf(vAddress));
  return ethersBnToBn(nRlcBalance);
};

const getEthBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  const weiBalance = await contracts.provider.getBalance(vAddress);
  return ethersBnToBn(weiBalance);
};

const checkBalances = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
    const [weiBalance, rlcBalance] = await Promise.all([
      getEthBalance(contracts, vAddress),
      getRlcBalance(contracts, vAddress),
    ]);
    const balances = {
      wei: weiBalance,
      nRLC: rlcBalance,
    };
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
    if (filteredFaucets.length === 0)
      throw Error(`No ETH faucet on chain ${chainName}`);
    const faucetsResponses = await Promise.all(
      filteredFaucets.map((faucet) => faucet.getETH(vAddress)),
    );
    const responses = filteredFaucets.reduce((accu, curr, index) => {
      accu.push({
        name: curr.name,
        response: faucetsResponses[index],
      });
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
    getRLC: (chainName, address) =>
      fetch(
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
      accu.push({
        name: curr.name,
        response: faucetsResponses[index],
      });
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
    await wrapWait(tx.wait(contracts.confirms));
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
    const rlcContract = await wrapCall(contracts.fetchTokenContract());
    const tx = await wrapSend(
      rlcContract.transfer(vAddress, vAmount, contracts.txOptions),
    );
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('sendERC20()', error);
    throw error;
  }
};

const sendETH = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(to);
    const vAmount = await weiAmountSchema().validate(amount);
    if (contracts.isNative)
      throw Error('sendETH() is disabled on sidechain, use sendRLC()');
    const balance = await getEthBalance(contracts, await getAddress(contracts));
    if (balance.lt(new BN(vAmount))) {
      throw Error('Amount to send exceed wallet balance');
    }
    const txHash = await sendNativeToken(contracts, vAmount, vAddress);
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
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
      await isInWhitelist(contracts, to, { strict: true });
    }
    const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
    const balance = await getRlcBalance(contracts, await getAddress(contracts));
    if (balance.lt(new BN(vAmount))) {
      throw Error('Amount to send exceed wallet balance');
    }
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
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
      await isInWhitelist(contracts, to, { strict: true });
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
    const gasPrice =
      contracts.txOptions && contracts.txOptions.gasPrice
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

const obsBridgeMessages = {
  CHECK_BRIDGE_POLICY: 'CHECK_BRIDGE_POLICY',
  BRIDGE_POLICY_CHECKED: 'BRIDGE_POLICY_CHECKED',
  CHECK_BRIDGE_LIMIT: 'CHECK_BRIDGE_LIMIT',
  BRIDGE_LIMIT_CHECKED: 'BRIDGE_LIMIT_CHECKED',
  SEND_TO_BRIDGE_TX_REQUEST: 'SEND_TO_BRIDGE_TX_REQUEST',
  SEND_TO_BRIDGE_TX_SUCCESS: 'SEND_TO_BRIDGE_TX_SUCCESS',
  WAIT_RECEIVE_TX: 'WAIT_RECEIVE_TX',
  RECEIVE_TX_SUCCESS: 'RECEIVE_TX_SUCCESS',
};

const findBlockNumberBeforeTimestamp = async (
  provider,
  targetTimestamp,
  { step = 100, refBlock } = {},
) => {
  const lastTriedBlock = refBlock || (await wrapCall(provider.getBlock()));
  const triedBlockNumber = Math.max(lastTriedBlock.number - step, 0);
  const triedBlock = await wrapCall(provider.getBlock(triedBlockNumber));
  const triedBlockTimestamp = triedBlock.timestamp;
  const remainingTime = triedBlockTimestamp - targetTimestamp;
  if (remainingTime > 0) {
    const stepTime = Math.max(
      lastTriedBlock.timestamp - triedBlockTimestamp,
      100,
    );
    const nextStep = Math.min(
      Math.ceil((remainingTime / stepTime) * step) + 5,
      1000,
    );
    return findBlockNumberBeforeTimestamp(provider, targetTimestamp, {
      refBlock: triedBlock,
      step: nextStep,
    });
  }
  return triedBlock.number;
};

const obsBridgeToSidechain = (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { sidechainBridgeAddress, bridgedContracts } = {},
) =>
  new Observable((observer) => {
    const safeObserver = new SafeObserver(observer);
    let abort;
    let stopWatchPromise;
    const bridgeToken = async () => {
      try {
        // input validation
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
        const balance = await getRlcBalance(
          contracts,
          await getAddress(contracts),
        );
        if (balance.lt(new BN(vAmount))) {
          throw Error('Amount to bridge exceed wallet balance');
        }

        // check bridge policy
        safeObserver.next({
          message: obsBridgeMessages.CHECK_BRIDGE_POLICY,
        });
        if (abort) return;
        const ercBridgeContract = new Contract(
          vBridgeAddress,
          foreignBridgeErcToNativeDesc.abi,
          contracts.provider,
        );
        const [minPerTx, maxPerTx, dailyLimit] = await Promise.all([
          wrapCall(ercBridgeContract.minPerTx()),
          wrapCall(ercBridgeContract.maxPerTx()),
          wrapCall(ercBridgeContract.dailyLimit()),
        ]);
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.BRIDGE_POLICY_CHECKED,
          minPerTx: minPerTx.toString(),
          maxPerTx: maxPerTx.toString(),
          dailyLimit: dailyLimit.toString(),
        });
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

        // check bridge daily limit
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.CHECK_BRIDGE_LIMIT,
        });
        const currentDay = await wrapCall(ercBridgeContract.getCurrentDay());
        const dayStartTimestamp = currentDay.toNumber() * (60 * 60 * 24);
        const startBlockNumber = await findBlockNumberBeforeTimestamp(
          contracts.provider,
          dayStartTimestamp,
        );
        if (abort) return;
        const erc20Contract = await wrapCall(contracts.fetchTokenContract());
        const transferLogs = await contracts.provider.getLogs({
          fromBlock: startBlockNumber,
          toBlock: 'latest',
          address: erc20Contract.address,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          ],
        });

        const erc20Interface = erc20Contract.interface;
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
          if (abort) return;
          await processTransferLogs(logs, isInvalidTimestamp);
        };
        if (abort) return;
        await processTransferLogs(transferLogs);
        if (abort) return;
        const withinLimit = totalSpentPerDay.lt(ethersBnToBn(dailyLimit));
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.BRIDGE_LIMIT_CHECKED,
          totalSpentPerDay,
        });
        if (!withinLimit) {
          throw Error(
            `Amount to bridge would exceed bridge daily limit. ${formatRLC(
              totalSpentPerDay,
            )}/${formatRLC(dailyLimit)} RLC already bridged today.`,
          );
        }

        // prepare to watch
        const waitReceive = vSidechainBridgeAddress && bridgedContracts;
        const sidechainBlockNumber = waitReceive
          ? await bridgedContracts.provider.getBlockNumber()
          : 0;

        // send to bridge
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.SEND_TO_BRIDGE_TX_REQUEST,
          bridgeAddress: vBridgeAddress,
        });
        const sendTxHash = await sendRLC(contracts, vAmount, vBridgeAddress);
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.SEND_TO_BRIDGE_TX_SUCCESS,
          bridgeAddress: vBridgeAddress,
          txHash: sendTxHash,
        });

        // watch receive
        if (waitReceive) {
          safeObserver.next({
            message: obsBridgeMessages.WAIT_RECEIVE_TX,
            bridgeAddress: vSidechainBridgeAddress,
          });
          const waitAffirmationCompleted = (txHash) =>
            new Promise((resolve, reject) => {
              const sidechainBridge = new Contract(
                vSidechainBridgeAddress,
                homeBridgeErcToNativeDesc.abi,
                bridgedContracts.provider,
              );
              const cleanListeners = () =>
                sidechainBridge.removeAllListeners('AffirmationCompleted');
              stopWatchPromise = () => {
                cleanListeners();
                reject(Error('aborted'));
              };
              try {
                sidechainBridge.on(
                  sidechainBridge.filters.AffirmationCompleted(),
                  (address, amount, refTxHash, event) => {
                    if (refTxHash === txHash) {
                      cleanListeners();
                      resolve(event);
                    }
                  },
                );
                bridgedContracts.provider.resetEventsBlock(
                  sidechainBlockNumber,
                );
                debug(
                  `watching AffirmationCompleted events from block ${sidechainBlockNumber}`,
                );
              } catch (e) {
                cleanListeners();
                throw e;
              }
            });
          if (abort) return;
          const event = await waitAffirmationCompleted(sendTxHash);
          const receiveTxHash = event.transactionHash;
          safeObserver.next({
            message: obsBridgeMessages.RECEIVE_TX_SUCCESS,
            txHash: receiveTxHash,
          });
        }

        // done
        safeObserver.complete();
      } catch (error) {
        debug('obsBridgeToSidechain()', error);
        safeObserver.error(error);
      }
    };
    bridgeToken();
    safeObserver.unsub = () => {
      abort = true;
      if (stopWatchPromise) {
        stopWatchPromise();
      }
    };
    return safeObserver.unsubscribe.bind(safeObserver);
  });

const bridgeToSidechain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { sidechainBridgeAddress, bridgedContracts } = {},
) => {
  let sendTxHash;
  let receiveTxHash;
  try {
    await new Promise((resolve, reject) => {
      obsBridgeToSidechain(contracts, bridgeAddress, nRlcAmount, {
        sidechainBridgeAddress,
        bridgedContracts,
      }).subscribe({
        next: ({ message, ...data }) => {
          if (message === obsBridgeMessages.SEND_TO_BRIDGE_TX_SUCCESS) {
            sendTxHash = data.txHash;
          }
          if (message === obsBridgeMessages.RECEIVE_TX_SUCCESS) {
            receiveTxHash = data.txHash;
          }
          debug(message, data);
        },
        error: reject,
        complete: resolve,
      });
    });
    return { sendTxHash, receiveTxHash };
  } catch (error) {
    debug('bridgeToSidechain()', error);
    if (sendTxHash) throw new BridgeError(error, sendTxHash);
    throw error;
  }
};

const obsBridgeToMainchain = (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { mainchainBridgeAddress, bridgedContracts } = {},
) =>
  new Observable((observer) => {
    const safeObserver = new SafeObserver(observer);
    let abort;
    let stopWatchPromise;
    const bridgeToken = async () => {
      try {
        // input validation
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
        const balance = await getRlcBalance(
          contracts,
          await getAddress(contracts),
        );
        if (balance.lt(new BN(vAmount))) {
          throw Error('Amount to bridge exceed wallet balance');
        }
        const sidechainBridgeContract = new Contract(
          vBridgeAddress,
          homeBridgeErcToNativeDesc.abi,
          contracts.provider,
        );
        const bnWeiValue = bnNRlcToBnWei(new BN(vAmount));
        const weiValue = bnWeiValue.toString();

        // check bridge policy
        safeObserver.next({
          message: obsBridgeMessages.CHECK_BRIDGE_POLICY,
        });
        if (abort) return;
        const [minPerTx, maxPerTx, dailyLimit] = await Promise.all([
          wrapCall(sidechainBridgeContract.minPerTx()),
          wrapCall(sidechainBridgeContract.maxPerTx()),
          wrapCall(sidechainBridgeContract.dailyLimit()),
        ]);
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.BRIDGE_POLICY_CHECKED,
          minPerTx: minPerTx.toString(),
          maxPerTx: maxPerTx.toString(),
          dailyLimit: dailyLimit.toString(),
        });
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

        // check bridge daily limit
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.CHECK_BRIDGE_LIMIT,
        });
        const [withinLimit, totalSpentPerDay] = await Promise.all([
          wrapCall(sidechainBridgeContract.withinLimit(weiValue)),
          wrapCall(
            sidechainBridgeContract
              .getCurrentDay()
              .then((currentDay) =>
                sidechainBridgeContract.totalSpentPerDay(currentDay),
              ),
          ),
        ]);
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.BRIDGE_LIMIT_CHECKED,
          totalSpentPerDay,
        });
        if (!withinLimit) {
          throw Error(
            `Amount to bridge would exceed bridge daily limit. ${formatRLC(
              truncateBnWeiToBnNRlc(ethersBnToBn(totalSpentPerDay)),
            )}/${formatRLC(
              truncateBnWeiToBnNRlc(ethersBnToBn(dailyLimit)),
            )} RLC already bridged today`,
          );
        }

        // prepare to watch
        const waitReceive = vMainchainBridgeAddress && bridgedContracts;
        const mainchainBlockNumber = waitReceive
          ? await wrapCall(bridgedContracts.provider.getBlockNumber())
          : 0;

        // send to bridge
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.SEND_TO_BRIDGE_TX_REQUEST,
          bridgeAddress: vBridgeAddress,
        });
        const sendTxHash = await sendNativeToken(
          contracts,
          weiValue,
          vBridgeAddress,
        );
        if (abort) return;
        safeObserver.next({
          message: obsBridgeMessages.SEND_TO_BRIDGE_TX_SUCCESS,
          bridgeAddress: vBridgeAddress,
          txHash: sendTxHash,
        });

        // watch receive
        if (waitReceive) {
          safeObserver.next({
            message: obsBridgeMessages.WAIT_RECEIVE_TX,
            bridgeAddress: vMainchainBridgeAddress,
          });
          const waitRelayedMessage = (txHash) =>
            new Promise((resolve, reject) => {
              const mainchainBridge = new Contract(
                vMainchainBridgeAddress,
                foreignBridgeErcToNativeDesc.abi,
                bridgedContracts.provider,
              );
              const cleanListeners = () =>
                mainchainBridge.removeAllListeners('RelayedMessage');
              stopWatchPromise = () => {
                cleanListeners();
                reject(Error('aborted'));
              };
              try {
                mainchainBridge.on(
                  mainchainBridge.filters.RelayedMessage(),
                  (address, amount, refTxHash, event) => {
                    if (refTxHash === txHash) {
                      cleanListeners();
                      resolve(event);
                    }
                  },
                );
                bridgedContracts.provider.resetEventsBlock(
                  mainchainBlockNumber,
                );
                debug(
                  `watching RelayedMessage events from block ${mainchainBlockNumber}`,
                );
              } catch (e) {
                cleanListeners();
                throw e;
              }
            });
          if (abort) return;
          const event = await waitRelayedMessage(sendTxHash);
          const receiveTxHash = event.transactionHash;
          safeObserver.next({
            message: obsBridgeMessages.RECEIVE_TX_SUCCESS,
            txHash: receiveTxHash,
          });
        }

        // done
        safeObserver.complete();
      } catch (error) {
        debug('obsBridgeToMainchain()', error);
        safeObserver.error(error);
      }
    };
    bridgeToken();
    safeObserver.unsub = () => {
      abort = true;
      if (stopWatchPromise) {
        stopWatchPromise();
      }
    };
    return safeObserver.unsubscribe.bind(safeObserver);
  });

const bridgeToMainchain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { mainchainBridgeAddress, bridgedContracts } = {},
) => {
  let sendTxHash;
  let receiveTxHash;
  try {
    await new Promise((resolve, reject) => {
      obsBridgeToMainchain(contracts, bridgeAddress, nRlcAmount, {
        mainchainBridgeAddress,
        bridgedContracts,
      }).subscribe({
        next: ({ message, ...data }) => {
          if (message === obsBridgeMessages.SEND_TO_BRIDGE_TX_SUCCESS) {
            sendTxHash = data.txHash;
          }
          if (message === obsBridgeMessages.RECEIVE_TX_SUCCESS) {
            receiveTxHash = data.txHash;
          }
          debug(message, data);
        },
        error: reject,
        complete: resolve,
      });
    });
    return { sendTxHash, receiveTxHash };
  } catch (error) {
    debug('bridgeToMainchain()', error);
    if (sendTxHash) throw new BridgeError(error, sendTxHash);
    throw error;
  }
};

const wrapEnterpriseRLC = async (
  contracts = throwIfMissing(),
  enterpriseContracts,
  nRlcAmount = throwIfMissing(),
) => {
  if (contracts.flavour !== 'standard' || contracts.isNative) {
    throw Error('Unable to wrap RLC into eRLC on current chain');
  }
  if (!enterpriseContracts) {
    throw Error('Unable to find eRLC on current chain');
  }
  const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
  await isInWhitelist(enterpriseContracts, await getAddress(contracts), {
    strict: true,
  });
  const balance = await getRlcBalance(contracts, await getAddress(contracts));
  if (balance.lt(new BN(vAmount))) {
    throw Error('Amount to wrap exceed wallet balance');
  }
  try {
    const eRlcAddress = await wrapCall(enterpriseContracts.fetchTokenAddress());
    const rlcContract = await wrapCall(contracts.fetchTokenContract());
    const tx = await wrapSend(
      rlcContract.approveAndCall(
        eRlcAddress,
        vAmount,
        NULL_BYTES,
        contracts.txOptions,
      ),
    );
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('wrapEnterpriseRLC()', error);
    throw error;
  }
};

const unwrapEnterpriseRLC = async (
  contracts = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
) => {
  if (contracts.flavour !== 'enterprise' || contracts.isNative) {
    throw Error('Unable to unwrap eRLC into RLC on current chain');
  }
  const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
  await isInWhitelist(contracts, await getAddress(contracts), { strict: true });
  const balance = await getRlcBalance(contracts, await getAddress(contracts));
  if (balance.lt(new BN(vAmount))) {
    throw Error('Amount to unwrap exceed wallet balance');
  }
  try {
    const eRlcContract = await wrapCall(contracts.fetchTokenContract());
    const tx = await wrapSend(eRlcContract.withdraw(vAmount));
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('unwrapEnterpriseRLC()', error);
    throw error;
  }
};

module.exports = {
  bridgeToMainchain,
  bridgeToSidechain,
  obsBridgeToMainchain,
  obsBridgeToSidechain,
  getAddress,
  isInWhitelist,
  checkBalances,
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
  wrapEnterpriseRLC,
  unwrapEnterpriseRLC,
};
