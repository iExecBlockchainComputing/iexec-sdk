const Debug = require('debug');
const BN = require('bn.js');
const { Contract } = require('ethers');
const { Interface } = require('ethers').utils;
const walletModule = require('./wallet');
const accountModule = require('./account');
const orderModule = require('./order');
const swapInterfaceDesc = require('./abi/uniswapv2/EventInterface.json');
const erc1538Desc = require('./abi/erc1538QueryDelegate/erc1538Interface.json');
const {
  checkEvent,
  getEventFromLogs,
  ethersBnToBn,
  bnToEthersBn,
  NULL_ADDRESS,
} = require('./utils');
const {
  weiAmountSchema,
  nRlcAmountSchema,
  signedApporderSchema,
  signedDatasetorderSchema,
  signedWorkerpoolorderSchema,
  signedRequestorderSchema,
  throwIfMissing,
} = require('./validator');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');

const debug = Debug('iexec:swap');

const getSwapEventValues = (
  txReceipt,
  { rlcContractAddress, fromAddress, toAddress },
) => {
  const transferRlcToIexecContractEvent = txReceipt.events
    && txReceipt.events.find((event) => {
      if (event.event === 'Transfer') {
        if (
          event.address === rlcContractAddress
          && event.args
          && (fromAddress ? event.args.from === fromAddress : event.args.from)
          && (toAddress ? event.args.to === toAddress : event.args.to)
        ) {
          return true;
        }
      }
      return false;
    });
  const swapContractAddress = fromAddress
    ? transferRlcToIexecContractEvent.args.to
    : transferRlcToIexecContractEvent.args.from;
  const swapInterface = new Interface(swapInterfaceDesc.abi);
  const swapEventValues = txReceipt.events
    .filter(event => event.address === swapContractAddress)
    .reduce((acc, event) => {
      try {
        return swapInterface.decodeEventLog('Swap', event.data);
      } catch (e) {
        return acc;
      }
    }, null);
  return swapEventValues;
};

const checkSwapEnabled = async (
  contracts = throwIfMissing(),
  strict = true,
) => {
  let isSwapEnabled;
  try {
    const iexecContract = contracts.getIExecContract();
    const iexecContractAddress = await iexecContract.resolvedAddress;
    const erc1538Proxy = new Contract(
      iexecContractAddress,
      erc1538Desc.abi,
      contracts.provider,
    );
    isSwapEnabled = await erc1538Proxy.functionExists(
      'safeDepositEth(uint256)',
    );
  } catch (error) {
    debug('checkSwapEnabled() error', error);
    throw error;
  }
  if (!isSwapEnabled) {
    if (strict) {
      throw new Error('Ether/RLC swap is not enabled on current chain');
    }
  }
  return isSwapEnabled;
};

const estimateDepositRlcToReceive = async (
  contracts = throwIfMissing(),
  weiToSpend = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vAmount = await weiAmountSchema().validate(weiToSpend);
    if (new BN(vAmount).lte(new BN(0))) throw Error('Amount to spend must be greather than 0');
    const iexecContract = contracts.getIExecContract();
    const nRlcToReceive = await wrapCall(
      iexecContract.estimateDepositEthSent(vAmount),
    );
    return ethersBnToBn(nRlcToReceive);
  } catch (error) {
    debug('estimateDepositRlcToReceive() error', error);
    throw error;
  }
};

const estimateDepositEthToSpend = async (
  contracts = throwIfMissing(),
  nRlcToReceive = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vAmount = await nRlcAmountSchema().validate(nRlcToReceive);
    if (new BN(vAmount).lte(new BN(0))) throw Error('Amount to receive must be greather than 0');
    const iexecContract = contracts.getIExecContract();
    const weiToSpend = await wrapCall(
      iexecContract.estimateDepositTokenWanted(vAmount),
    );
    return ethersBnToBn(weiToSpend);
  } catch (error) {
    debug('estimateDepositEthToSpend() error', error);
    throw error;
  }
};

const estimateWithdrawRlcToSpend = async (
  contracts = throwIfMissing(),
  weiToReceive = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vAmount = await weiAmountSchema().validate(weiToReceive);
    if (new BN(vAmount).lte(new BN(0))) throw Error('Amount to receive must be greather than 0');
    const iexecContract = contracts.getIExecContract();
    const nRlcToSpend = await wrapCall(
      iexecContract.estimateWithdrawEthWanted(vAmount),
    );
    return ethersBnToBn(nRlcToSpend);
  } catch (error) {
    debug('estimateWithdrawRlcToSpend() error', error);
    throw error;
  }
};

const estimateWithdrawEthToReceive = async (
  contracts = throwIfMissing(),
  nRlcToSpend = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vAmount = await nRlcAmountSchema().validate(nRlcToSpend);
    if (new BN(vAmount).lte(new BN(0))) throw Error('Amount to spend must be greather than 0');
    const iexecContract = contracts.getIExecContract();
    const weiToReceive = await wrapCall(
      iexecContract.estimateWithdrawTokenSent(vAmount),
    );
    return ethersBnToBn(weiToReceive);
  } catch (error) {
    debug('estimateWithdrawEthToReceive() error', error);
    throw error;
  }
};

const depositEth = async (
  contracts = throwIfMissing(),
  weiToSpend = throwIfMissing(),
  nRlcToReceive = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vToSpend = await weiAmountSchema().validate(weiToSpend);
    if (new BN(vToSpend).lte(new BN(0))) throw Error('wei amount to deposit must be greather than 0');
    const vToReceive = await nRlcAmountSchema().validate(nRlcToReceive);
    if (new BN(vToReceive).lte(new BN(0))) throw Error('nRLC amount to receive must be greather than 0');
    const userAddress = await walletModule.getAddress(contracts);
    const balances = await walletModule.checkBalances(contracts, userAddress);
    const toSpendBN = new BN(vToSpend);
    if (balances.wei.lt(toSpendBN)) throw Error('Deposit amount exceed wallet balance');
    const iexecContract = contracts.getIExecContract();
    const iexecContractAddress = await iexecContract.resolvedAddress;
    const rlcContractAddress = await contracts.fetchRLCAddress();
    const tx = await wrapSend(
      iexecContract.safeDepositEth(vToReceive, {
        value: bnToEthersBn(toSpendBN).toHexString(),
        gasPrice:
          (contracts.txOptions && contracts.txOptions.gasPrice) || undefined,
      }),
    );
    const txReceipt = await wrapWait(tx.wait());
    const mintEvent = txReceipt.events
      && txReceipt.events.find((event) => {
        if (event.event === 'Transfer') {
          if (
            event.address === iexecContractAddress
            && event.args
            && event.args.from === NULL_ADDRESS
            && event.args.to === userAddress
          ) {
            return true;
          }
        }
        return false;
      });
    if (!mintEvent) {
      throw Error(`Deposit ether transaction failed (txHash: ${tx.hash})`);
    }
    const swapEventValues = getSwapEventValues(txReceipt, {
      rlcContractAddress,
      toAddress: iexecContractAddress,
    });
    debug('swapEventValues', swapEventValues);
    if (!swapEventValues || !swapEventValues.amount0In) {
      throw Error(`Deposit ether transaction failed (txHash: ${tx.hash})`);
    }
    const received = ethersBnToBn(mintEvent.args.value);
    const spent = ethersBnToBn(swapEventValues.amount0In);
    return {
      txHash: tx.hash,
      spentWei: spent,
      receivedNRlc: received,
    };
  } catch (error) {
    debug('depositEth() error', error);
    throw error;
  }
};

const withdrawEth = async (
  contracts = throwIfMissing(),
  nRlcToSpend = throwIfMissing(),
  weiToReceive = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vToSpend = await nRlcAmountSchema().validate(nRlcToSpend);
    if (new BN(vToSpend).lte(new BN(0))) throw Error('nRLC amount to withdraw must be greather than 0');
    const vToReceive = await weiAmountSchema().validate(weiToReceive);
    if (new BN(vToReceive).lte(new BN(0))) throw Error('wei amount to receive must be greather than 0');
    const userAddress = await walletModule.getAddress(contracts);
    const { stake } = await accountModule.checkBalance(contracts, userAddress);
    const toSpendBN = new BN(vToSpend);
    if (stake.lt(toSpendBN)) throw Error('Withdraw amount exceed account balance');
    const iexecContract = contracts.getIExecContract();
    const iexecContractAddress = await iexecContract.resolvedAddress;
    const rlcContractAddress = await contracts.fetchRLCAddress();
    const tx = await wrapSend(
      iexecContract.safeWithdrawEth(vToSpend, vToReceive, contracts.txOptions),
    );
    const txReceipt = await wrapWait(tx.wait());
    const swapEventValues = getSwapEventValues(txReceipt, {
      rlcContractAddress,
      fromAddress: iexecContractAddress,
    });
    debug('swapEventValues', swapEventValues);
    if (
      !swapEventValues
      || !swapEventValues.amount0Out
      || !swapEventValues.amount1In
    ) {
      throw Error(`Withdraw ether transaction failed (txHash: ${tx.hash})`);
    }
    const received = ethersBnToBn(swapEventValues.amount0Out);
    const spent = ethersBnToBn(swapEventValues.amount1In);
    return {
      txHash: tx.hash,
      spentNRlc: spent,
      receivedWei: received,
    };
  } catch (error) {
    debug('withdrawEth() error', error);
    throw error;
  }
};

const estimateMatchOrderEthToSpend = async (
  contracts = throwIfMissing(),
  apporder = throwIfMissing(),
  datasetorder = orderModule.NULL_DATASETORDER,
  workerpoolorder = throwIfMissing(),
  requestorder = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const [
      vApporder,
      vDatasetorder,
      vWorkerpoolorder,
      vRequestorder,
    ] = await Promise.all([
      signedApporderSchema().validate(apporder),
      signedDatasetorderSchema().validate(datasetorder),
      signedWorkerpoolorderSchema().validate(workerpoolorder),
      signedRequestorderSchema().validate(requestorder),
    ]);
    const volume = await orderModule.getMatchableVolume(
      contracts,
      vApporder,
      vDatasetorder,
      vWorkerpoolorder,
      vRequestorder,
    );
    const nRlcValue = volume.mul(
      new BN(apporder.appprice)
        .add(new BN(datasetorder.datasetprice))
        .add(new BN(workerpoolorder.workerpoolprice)),
    );
    const weiToSpend = nRlcValue.isZero()
      ? nRlcValue
      : await estimateDepositEthToSpend(contracts, nRlcValue);
    return { weiToSpend, volume, nRlcValue };
  } catch (error) {
    debug('estimateMatchOrderEthToSpend() error', error);
    throw error;
  }
};

const matchOrdersWithEth = async (
  contracts = throwIfMissing(),
  appOrder = throwIfMissing(),
  datasetOrder = orderModule.NULL_DATASETORDER,
  workerpoolOrder = throwIfMissing(),
  requestOrder = throwIfMissing(),
  weiToSpend = throwIfMissing(),
) => {
  try {
    await checkSwapEnabled(contracts);
    const vToSpend = await weiAmountSchema().validate(weiToSpend);
    if (new BN(vToSpend).isZero()) {
      throw Error(
        "Value to spend can't be 0, if no RLC is required use matchOrders() instead of matchOrdersWithEth()",
      );
    }
    const [
      vAppOrder,
      vDatasetOrder,
      vWorkerpoolOrder,
      vRequestOrder,
    ] = await Promise.all([
      signedApporderSchema().validate(appOrder),
      signedDatasetorderSchema().validate(datasetOrder),
      signedWorkerpoolorderSchema().validate(workerpoolOrder),
      signedRequestorderSchema().validate(requestOrder),
    ]);

    // check matchability
    await orderModule.getMatchableVolume(
      contracts,
      vAppOrder,
      vDatasetOrder,
      vWorkerpoolOrder,
      vRequestOrder,
    );

    const appOrderStruct = orderModule.signedOrderToStruct(
      orderModule.APP_ORDER,
      vAppOrder,
    );
    const datasetOrderStruct = orderModule.signedOrderToStruct(
      orderModule.DATASET_ORDER,
      vDatasetOrder,
    );
    const workerpoolOrderStruct = orderModule.signedOrderToStruct(
      orderModule.WORKERPOOL_ORDER,
      vWorkerpoolOrder,
    );
    const requestOrderStruct = orderModule.signedOrderToStruct(
      orderModule.REQUEST_ORDER,
      vRequestOrder,
    );
    const iexecContract = contracts.getIExecContract();
    const iexecContractAddress = await iexecContract.resolvedAddress;
    const rlcContractAddress = await contracts.fetchRLCAddress();
    const balances = await walletModule.checkBalances(
      contracts,
      await walletModule.getAddress(contracts),
    );
    const toSpendBN = new BN(vToSpend);
    if (balances.wei.lt(toSpendBN)) throw Error('Ether amount to swap exceed wallet balance');
    const tx = await wrapSend(
      iexecContract.matchOrdersWithEth(
        appOrderStruct,
        datasetOrderStruct,
        workerpoolOrderStruct,
        requestOrderStruct,
        {
          value: bnToEthersBn(toSpendBN).toHexString(),
          gasPrice:
            (contracts.txOptions && contracts.txOptions.gasPrice) || undefined,
        },
      ),
    );
    const txReceipt = await wrapWait(tx.wait());
    const matchEvent = 'OrdersMatched';
    if (!checkEvent(matchEvent, txReceipt.events)) throw Error(`${matchEvent} not confirmed (tx: ${tx.hash})`);
    const { dealid, volume } = getEventFromLogs(
      matchEvent,
      txReceipt.events,
    ).args;
    const swapEventValues = getSwapEventValues(txReceipt, {
      rlcContractAddress,
      toAddress: iexecContractAddress,
    });
    debug('swapEventValues', swapEventValues);
    if (
      !swapEventValues
      || !swapEventValues.amount0In
      || !swapEventValues.amount1Out
    ) {
      throw Error(`Failed to retrieve swap values (tx: ${tx.hash})`);
    }
    const spent = ethersBnToBn(swapEventValues.amount0In);
    const received = ethersBnToBn(swapEventValues.amount1Out);
    return {
      dealid,
      volume: ethersBnToBn(volume),
      txHash: tx.hash,
      spentWei: spent,
      nRlcValue: received,
    };
  } catch (error) {
    debug('matchOrdersWithEth() error', error);
    throw error;
  }
};

module.exports = {
  checkSwapEnabled,
  estimateDepositRlcToReceive,
  estimateDepositEthToSpend,
  estimateWithdrawRlcToSpend,
  estimateWithdrawEthToReceive,
  estimateMatchOrderEthToSpend,
  depositEth,
  withdrawEth,
  matchOrdersWithEth,
};
