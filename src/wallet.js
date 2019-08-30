const Debug = require('debug');
const fetch = require('cross-fetch');
const BN = require('bn.js');
const { Contract } = require('ethers');
const {
  isEthAddress,
  ethersBnToBn,
  bnToEthersBn,
  ethersBigNumberify,
  truncateBnWeiToBnNRlc,
  bnNRlcToBnWei,
  throwIfMissing,
} = require('./utils');
const foreignBridgeErcToNativeDesc = require('./abi/bridge/ForeignBridgeErcToNative.json');
const homeBridgeErcToNativeDesc = require('./abi/bridge/HomeBridgeErcToNative.json');

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
    isEthAddress(address, { strict: true });
    const { isNative } = contracts;
    const getETH = () => contracts.eth.getBalance(address).catch((error) => {
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
        .balanceOf(address)
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
    isEthAddress(account, { strict: true });
    const filteredFaucets = ethFaucets.filter(e => e.chainName === chainName);
    if (filteredFaucets.length === 0) throw Error(`No ETH faucet on chain ${chainName}`);
    const faucetsResponses = await Promise.all(
      filteredFaucets.map(faucet => faucet.getETH(account)),
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
    isEthAddress(account, { strict: true });
    const faucetsResponses = await Promise.all(
      rlcFaucets.map(faucet => faucet.getRLC(chainName, account)),
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

const sendNativeToken = async (contracts, value, to) => {
  try {
    isEthAddress(to, { strict: true });
    const hexValue = ethersBigNumberify(value).toHexString();
    const ethSigner = contracts.eth.getSigner();
    const tx = await ethSigner.sendTransaction({
      data: '0x',
      to,
      value: hexValue,
    });
    await tx.wait();
    return tx.hash;
  } catch (error) {
    debug('sendNativeToken()', error);
    throw error;
  }
};

const sendERC20 = async (contracts, nRlcAmount, to) => {
  isEthAddress(to, { strict: true });
  try {
    const rlcAddress = await contracts.fetchRLCAddress();
    const rlcContract = contracts.getRLCContract({ at: rlcAddress });
    const tx = await rlcContract.transfer(to, nRlcAmount);
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
    if (contracts.isNative) throw Error('sendETH() is disabled on sidechain, use sendRLC()');
    isEthAddress(to, { strict: true });
    const txHash = await sendNativeToken(contracts, value, to);
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
  isEthAddress(to, { strict: true });
  try {
    if (contracts.isNative) {
      debug('send native token');
      const weiValue = bnNRlcToBnWei(new BN(nRlcAmount)).toString();
      const txHash = await sendNativeToken(contracts, weiValue, to);
      return txHash;
    }
    debug('send ERC20 token');
    const txHash = await sendERC20(contracts, nRlcAmount, to);
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
    isEthAddress(to, { strict: true });
    const code = await contracts.eth.getCode(to);
    if (code !== '0x') {
      throw new Error('Cannot sweep to a contract');
    }
    let balances = await checkBalances(contracts, address);
    const res = {};
    const errors = [];
    if (!contracts.isNative) {
      if (balances.nRLC.gt(new BN(0))) {
        try {
          const sendERC20TxHash = await sendERC20(
            contracts,
            bnToEthersBn(balances.nRLC),
            to,
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
          to,
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
  { sidechainContracts, sidechainBridgeAddress } = {},
) => {
  try {
    isEthAddress(bridgeAddress, { strict: true });
    if (contracts.isNative) throw Error('Current chain is a sidechain');

    const homeBridgeContract = new Contract(
      bridgeAddress,
      homeBridgeErcToNativeDesc.abi,
      contracts.eth,
    );
    const [minPerTx, maxPerTx, withinExecutionLimit] = await Promise.all([
      homeBridgeContract.minPerTx(),
      homeBridgeContract.maxPerTx(),
      homeBridgeContract.withinExecutionLimit(nRlcAmount),
    ]);
    if (new BN(nRlcAmount).lt(ethersBnToBn(minPerTx))) {
      throw Error(
        `Minimum amount allowed to bridge is ${minPerTx.toString()} nRLC`,
      );
    }
    if (new BN(nRlcAmount).gt(ethersBnToBn(maxPerTx))) {
      throw Error(
        `Maximum amount allowed to bridge is ${maxPerTx.toString()} nRLC`,
      );
    }
    if (!withinExecutionLimit) throw Error('Bridge daily limit reached');

    const sendTxHash = await sendRLC(contracts, nRlcAmount, bridgeAddress);
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
  { mainchainContracts, mainchainBridgeAddress } = {},
) => {
  try {
    isEthAddress(bridgeAddress, { strict: true });
    if (!contracts.isNative) throw Error('Current chain is a mainchain');

    const foreignBridgeContract = new Contract(
      bridgeAddress,
      foreignBridgeErcToNativeDesc.abi,
      contracts.eth,
    );
    const [minPerTx, maxPerTx, withinExecutionLimit] = await Promise.all([
      foreignBridgeContract.minPerTx(),
      foreignBridgeContract.maxPerTx(),
      foreignBridgeContract.withinExecutionLimit(nRlcAmount),
    ]);
    debug('minPerTx', minPerTx.toString());
    debug('maxPerTx', maxPerTx.toString());
    debug('withinExecutionLimit', withinExecutionLimit);

    const bnWeiValue = bnNRlcToBnWei(new BN(nRlcAmount));

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

    const weiValue = bnWeiValue.toString();

    const sendTxHash = await sendNativeToken(
      contracts,
      weiValue,
      bridgeAddress,
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
