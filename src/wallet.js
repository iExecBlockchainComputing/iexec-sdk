const Debug = require('debug');
const fetch = require('cross-fetch');
const BN = require('bn.js');
const { Contract } = require('ethers');
const {
  ethersBnToBn,
  bnToEthersBn,
  ethersBigNumberify,
  truncateBnWeiToBnNRlc,
  bnNRlcToBnWei,
} = require('./utils');
const foreignBridgeErcToNativeDesc = require('./abi/bridge/ForeignBridgeErcToNative.json');
const homeBridgeErcToNativeDesc = require('./abi/bridge/HomeBridgeErcToNative.json');

const { addressSchema, uint256Schema, throwIfMissing } = require('./validator');

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

const checkBalances = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(address);
    const { isNative } = contracts;
    const getETH = () => contracts.eth.getBalance(vAddress).catch((error) => {
      debug(error);
      return 0;
    });
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
    const ethSigner = contracts.eth.getSigner();
    const tx = await ethSigner.sendTransaction({
      data: '0x',
      to: vAddress,
      value: hexValue,
    });
    await tx.wait();
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
    const rlcAddress = await contracts.fetchRLCAddress();
    const rlcContract = contracts.getRLCContract({ at: rlcAddress });
    const tx = await rlcContract.transfer(vAddress, vAmount);
    await tx.wait();
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

const sweep = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(address);
    const vAddressTo = await addressSchema().validate(to);
    const code = await contracts.eth.getCode(vAddressTo);
    if (code !== '0x') {
      throw new Error('Cannot sweep to a contract');
    }
    let balances = await checkBalances(contracts, vAddress);
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
        balances = await checkBalances(contracts, address);
      }
    }
    const gasPrice = new BN((await contracts.eth.getGasPrice()).toString());
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
) => {
  try {
    const vBridgeAddress = await addressSchema().validate(bridgeAddress);
    const vAmount = await uint256Schema().validate(nRlcAmount);
    if (contracts.isNative) throw Error('Current chain is a sidechain');

    const homeBridgeContract = new Contract(
      vBridgeAddress,
      homeBridgeErcToNativeDesc.abi,
      contracts.eth,
    );
    const [minPerTx, maxPerTx, withinExecutionLimit] = await Promise.all([
      homeBridgeContract.minPerTx(),
      homeBridgeContract.maxPerTx(),
      homeBridgeContract.withinExecutionLimit(vAmount),
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
    if (!withinExecutionLimit) throw Error('Bridge daily limit reached');

    const sendTxHash = await sendRLC(contracts, vAmount, vBridgeAddress);
    return { sendTxHash };
  } catch (error) {
    debug('bridgeToSidechain()', error);
    throw error;
  }
};

const bridgeToMainchain = async (
  contracts = throwIfMissing(),
  bridgeAddress = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
) => {
  try {
    const vBridgeAddress = await addressSchema().validate(bridgeAddress);
    const vAmount = await uint256Schema().validate(nRlcAmount);
    if (!contracts.isNative) throw Error('Current chain is a mainchain');

    const foreignBridgeContract = new Contract(
      vBridgeAddress,
      foreignBridgeErcToNativeDesc.abi,
      contracts.eth,
    );

    const bnWeiValue = bnNRlcToBnWei(new BN(vAmount));
    const weiValue = bnWeiValue.toString();

    const [minPerTx, maxPerTx, withinExecutionLimit] = await Promise.all([
      foreignBridgeContract.minPerTx(),
      foreignBridgeContract.maxPerTx(),
      foreignBridgeContract.withinExecutionLimit(vAmount),
    ]);
    debug('minPerTx', minPerTx.toString());
    debug('maxPerTx', maxPerTx.toString());
    debug('withinExecutionLimit', withinExecutionLimit);

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
    if (!withinExecutionLimit) throw Error('Bridge daily limit reached');

    const sendTxHash = await sendNativeToken(
      contracts,
      weiValue,
      vBridgeAddress,
    );
    return { sendTxHash };
  } catch (error) {
    debug('bridgeToSidechain()', error);
    throw error;
  }
};

module.exports = {
  bridgeToMainchain,
  bridgeToSidechain,
  checkBalances,
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
};
