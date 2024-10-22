import Debug from 'debug';
import { Contract } from 'ethers';
import { version as pocoVersion } from '../generated/@iexec/poco/package.js';
import { networks as iexecProxyNetworks } from '../generated/@iexec/poco/ERC1538Proxy.js';
import iexecTokenDesc from '../generated/@iexec/poco/IexecInterfaceToken.js';
import iexecNativeDesc from '../generated/@iexec/poco/IexecInterfaceNative.js';
import appRegistryDesc from '../generated/@iexec/poco/AppRegistry.js';
import workerpoolRegistryDesc from '../generated/@iexec/poco/WorkerpoolRegistry.js';
import datasetRegistryDesc from '../generated/@iexec/poco/DatasetRegistry.js';
import appDesc from '../generated/@iexec/poco/App.js';
import workerpoolDesc from '../generated/@iexec/poco/Workerpool.js';
import datasetDesc from '../generated/@iexec/poco/Dataset.js';
import rlcDesc from '../generated/@iexec/rlc/RLC.js';
import erlcDesc from '../generated/@iexec/erlc/ERLCTokenSwap.js';

const debug = Debug('iexec:IExecContractsClient');

const enterpriseHubMap = {
  1: '0x0bf375A6238359CE14987C2285B8B099eE8e8709',
  5: '0x0bf375A6238359CE14987C2285B8B099eE8e8709',
};

const nativeNetworks = {
  standard: ['134'],
  enterprise: [],
};

const gasPriceByNetwork = {
  134: 0n,
};

const getHubAddress = (chainId, flavour) => {
  if (flavour === 'enterprise') {
    if (enterpriseHubMap[chainId]) {
      return enterpriseHubMap[chainId];
    }
    throw Error(
      `Missing iExec enterprise contract default address for chain ${chainId}`,
    );
  } else {
    if (
      iexecProxyNetworks &&
      iexecProxyNetworks[chainId] &&
      iexecProxyNetworks[chainId].address
    ) {
      return iexecProxyNetworks[chainId].address;
    }
    throw Error(`Missing iExec contract default address for chain ${chainId}`);
  }
};

const getIsNative = (chainId, flavour) =>
  nativeNetworks[flavour].includes(chainId);

const getGasPriceOverride = (chainId) => gasPriceByNetwork[chainId];

const getTokenDesc = (isNative, flavour) => {
  if (isNative) {
    return undefined;
  }
  if (flavour === 'enterprise') {
    return erlcDesc;
  }
  return rlcDesc;
};

const getContractsDescMap = (isNative, flavour) => ({
  hub: {
    contractDesc: isNative ? iexecNativeDesc : iexecTokenDesc,
  },
  token: {
    contractDesc: getTokenDesc(isNative, flavour),
    hubPropName: 'token',
  },
  app: {
    contractDesc: appDesc,
    registryName: 'appRegistry',
  },
  appRegistry: {
    contractDesc: appRegistryDesc,
    hubPropName: 'appregistry',
  },
  dataset: {
    contractDesc: datasetDesc,
    registryName: 'datasetRegistry',
  },
  datasetRegistry: {
    contractDesc: datasetRegistryDesc,
    hubPropName: 'datasetregistry',
  },
  workerpool: {
    contractDesc: workerpoolDesc,
    registryName: 'workerpoolRegistry',
  },
  workerpoolRegistry: {
    contractDesc: workerpoolRegistryDesc,
    hubPropName: 'workerpoolregistry',
  },
});

const createClient = ({
  ethSigner,
  ethProvider,
  chainId,
  globalHubAddress,
  isNative,
  flavour,
}) => {
  const cachedAddresses = {};

  const contractsDescMap = getContractsDescMap(isNative, flavour);

  const hubAddress = globalHubAddress || getHubAddress(chainId, flavour);

  const getContract = (objName, address) => {
    try {
      const { contractDesc } = contractsDescMap[objName];
      if (!address) {
        throw Error(`no contract address provided`);
      }
      return new Contract(address, contractDesc.abi, ethSigner || ethProvider);
    } catch (error) {
      debug('getContract()', error);
      throw error;
    }
  };

  const getIExecContract = () => getContract('hub', hubAddress);

  const fetchRegistryAddress = async (objName) => {
    try {
      const { registryName } = contractsDescMap[objName];
      if (cachedAddresses[registryName]) {
        return cachedAddresses[registryName];
      }
      const iexecContract = getIExecContract();
      const registryAddress =
        await iexecContract[contractsDescMap[registryName].hubPropName]();
      cachedAddresses[registryName] = registryAddress;
      return registryAddress;
    } catch (error) {
      debug('fetchRegistryAddress()', error);
      throw error;
    }
  };

  const fetchRegistryContract = async (objName) => {
    try {
      const registryAddress = await fetchRegistryAddress(objName);
      return getContract(
        contractsDescMap[objName].registryName,
        registryAddress,
      );
    } catch (error) {
      debug('fetchRegistryContract()', error);
      throw error;
    }
  };

  const fetchTokenAddress = async () => {
    try {
      if (cachedAddresses.token) {
        return cachedAddresses.token;
      }
      const iexecContract = getIExecContract();
      const tokenAddress = await iexecContract.token();
      cachedAddresses.token = tokenAddress;
      return tokenAddress;
    } catch (error) {
      debug('fetchTokenAddress()', error);
      throw error;
    }
  };

  const fetchTokenContract = async () => {
    try {
      const tokenAddress = await fetchTokenAddress();
      return getContract('token', tokenAddress);
    } catch (error) {
      debug('fetchTokenContract()', error);
      throw error;
    }
  };

  return {
    pocoVersion,
    isNative,
    flavour,
    hubAddress,
    getContract,
    getIExecContract,
    fetchRegistryContract,
    ...(!isNative && { fetchTokenContract }),
    ...(!isNative && { fetchTokenAddress }),
    fetchRegistryAddress,
  };
};

class IExecContractsClient {
  constructor({
    provider,
    signer,
    chainId,
    hubAddress,
    useGas = true,
    isNative,
    flavour = 'standard',
    confirms = 1,
  } = {}) {
    const stringChainId = `${chainId}`;
    if (!provider) throw Error('missing provider key');
    if (!stringChainId) throw Error('missing chainId key');
    if (!Number.isInteger(confirms) || confirms <= 0)
      throw Error('invalid confirms');
    if (flavour !== 'standard' && flavour !== 'enterprise')
      throw Error('invalid flavour');

    this._args = {
      provider,
      signer,
      chainId: stringChainId,
      hubAddress,
      useGas,
      isNative,
      flavour,
    };

    const native =
      isNative !== undefined ? !!isNative : getIsNative(stringChainId, flavour);

    const gasPriceOverride =
      useGas === false ? 0n : getGasPriceOverride(stringChainId);

    const client = createClient({
      ethSigner: signer,
      ethProvider: provider,
      chainId: stringChainId,
      globalHubAddress: hubAddress,
      isNative: native,
      flavour,
    });

    this.setSigner = (ethSigner) => {
      const connectedSigner = ethSigner.connect(this.provider);
      Object.assign(
        this,
        new IExecContractsClient({ ...this._args, signer: connectedSigner }),
      );
    };

    Object.assign(this, {
      provider,
      signer,
      chainId: stringChainId,
      txOptions: { gasPrice: gasPriceOverride },
      confirms,
      ...client,
    });
  }
}

export default IExecContractsClient;
