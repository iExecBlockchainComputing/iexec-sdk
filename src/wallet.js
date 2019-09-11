const Debug = require('debug');
const { Web3Provider } = require('ethers').providers;
const fetch = require('cross-fetch');
const BN = require('bn.js');
const { ethersBnToBn, bnToEthersBn } = require('./utils');
const {
  uint256Schema,
  addressSchema,
  hexnumberSchema,
  throwIfMissing,
} = require('./validator');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');

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
    const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
    const getETH = () => contracts.eth.getBalance(vAddress).catch((error) => {
      debug(error);
      return 0;
    });
    const getRLC = () => contracts
      .getRLCContract({
        at: rlcAddress,
      })
      .balanceOf(vAddress)
      .catch((error) => {
        debug(error);
        return 0;
      });

    const [weiBalance, rlcBalance] = await Promise.all([
      wrapCall(getETH()),
      wrapCall(getRLC()),
    ]);
    const balances = {
      wei: ethersBnToBn(weiBalance),
      nRLC: ethersBnToBn(rlcBalance),
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

const sendETH = async (
  contracts = throwIfMissing(),
  value = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(to);
    const vValue = await hexnumberSchema().validate(value);
    const ethSigner = new Web3Provider(contracts.ethProvider).getSigner();
    const tx = await wrapSend(
      ethSigner.sendTransaction({
        data: '0x',
        to: vAddress,
        value: vValue,
      }),
    );
    await wrapWait(tx.wait());
    return tx.hash;
  } catch (error) {
    debug('sendETH()', error);
    throw error;
  }
};

const sendRLC = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing(),
  to = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(to);
    const vAmount = await uint256Schema().validate(amount);
    const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
    const rlcContract = contracts.getRLCContract({ at: rlcAddress });
    const tx = await wrapSend(rlcContract.transfer(vAddress, vAmount));
    await wrapWait(tx.wait());
    return tx.hash;
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
    const balances = await checkBalances(contracts, vAddress);
    let sendRLCTxHash;
    if (balances.nRLC.gt(new BN(0))) {
      sendRLCTxHash = await sendRLC(
        contracts,
        bnToEthersBn(balances.nRLC),
        vAddressTo,
      );
    }
    const txFee = new BN('10000000000000000');
    let sendETHTxHash;
    const sweepETH = balances.wei.sub(txFee);
    if (balances.wei.gt(new BN(txFee))) {
      sendETHTxHash = await sendETH(
        contracts,
        bnToEthersBn(sweepETH).toHexString(),
        vAddressTo,
      );
    }
    return Object.assign({}, { sendRLCTxHash }, { sendETHTxHash });
  } catch (error) {
    debug('sweep()', error);
    throw error;
  }
};

module.exports = {
  checkBalances,
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
};
