import Debug from 'debug';
import BN from 'bn.js';
import { Contract } from 'ethers';
import {
  ethersBnToBn,
  truncateBnWeiToBnNRlc,
  bnNRlcToBnWei,
  formatRLC,
  checkSigner,
} from '../utils/utils';
import {
  addressSchema,
  nRlcAmountSchema,
  throwIfMissing,
} from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';
import { BridgeError } from '../utils/errors';
import { Observable, SafeObserver } from '../utils/reactive';
import { abi as ForeignBridgeErcToNativeAbi } from './abi/ForeignBridgeErcToNative.json';
import { abi as HomeBridgeErcToNativeAbi } from './abi/HomeBridgeErcToNative.json';
import { getAddress } from './address';
import { getRlcBalance } from './balance';
import { sendRLC } from './send';

const debug = Debug('iexec:wallet:bridge');

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

export const obsBridgeToSidechain = (
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
        checkSigner(contracts);
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
          ForeignBridgeErcToNativeAbi,
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
          minPerTx: ethersBnToBn(minPerTx),
          maxPerTx: ethersBnToBn(maxPerTx),
          dailyLimit: ethersBnToBn(dailyLimit),
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
                HomeBridgeErcToNativeAbi,
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

export const bridgeToSidechain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { sidechainBridgeAddress, bridgedContracts } = {},
) => {
  checkSigner(contracts);
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

export const obsBridgeToMainchain = (
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
        checkSigner(contracts);
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
          HomeBridgeErcToNativeAbi,
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
          minPerTx: ethersBnToBn(minPerTx),
          maxPerTx: ethersBnToBn(maxPerTx),
          dailyLimit: ethersBnToBn(dailyLimit),
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
          totalSpentPerDay: ethersBnToBn(totalSpentPerDay),
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
            bridgeAddress: vMainchainBridgeAddress,
          });
          const waitRelayedMessage = (txHash) =>
            new Promise((resolve, reject) => {
              const mainchainBridge = new Contract(
                vMainchainBridgeAddress,
                ForeignBridgeErcToNativeAbi,
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

export const bridgeToMainchain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
  { mainchainBridgeAddress, bridgedContracts } = {},
) => {
  checkSigner(contracts);
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
