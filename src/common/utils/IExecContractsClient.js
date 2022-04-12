const Debug = require('debug');
const iexecProxyNetworks =
  require('@iexec/poco/build/contracts-min/ERC1538Proxy.json').networks;
const rlcDesc = require('rlc-faucet-contract/build/contracts/RLC.json');
const erlcDesc = require('@iexec/erlc/build/contracts-min/ERLCTokenSwap.json');
const { Contract } = require('ethers');
const pocoVersion = require('@iexec/poco/package.json').version;
const iexecTokenDesc = require('@iexec/poco/build/contracts-min/IexecInterfaceToken.json');
const iexecNativeDesc = require('@iexec/poco/build/contracts-min/IexecInterfaceNative.json');
const appRegistryDesc = require('@iexec/poco/build/contracts-min/AppRegistry.json');
const workerpoolRegistryDesc = require('@iexec/poco/build/contracts-min/WorkerpoolRegistry.json');
const datasetRegistryDesc = require('@iexec/poco/build/contracts-min/DatasetRegistry.json');
const appDesc = require('@iexec/poco/build/contracts-min/App.json');
const workerpoolDesc = require('@iexec/poco/build/contracts-min/Workerpool.json');
const datasetDesc = require('@iexec/poco/build/contracts-min/Dataset.json');

const debug = Debug('iexec:contracts');

const enterpriseHubMap = {
  1: '0x0bf375A6238359CE14987C2285B8B099eE8e8709',
  5: '0x0bf375A6238359CE14987C2285B8B099eE8e8709',
};

const nativeNetworks = {
  standard: ['133', '134'],
  enterprise: [],
};

const gasPriceByNetwork = {
  133: '0x0',
  134: '0x0',
};

const getHubAddress = (chainId, flavour, { strict = true } = {}) => {
  try {
    if (flavour === 'enterprise') {
      if (!enterpriseHubMap[chainId]) {
        if (strict) {
          throw Error('Missing iExec proxy configuration');
        }
        return undefined;
      }
      return enterpriseHubMap[chainId];
    }
    if (!iexecProxyNetworks) {
      if (strict) {
        throw Error('Missing iExec proxy configuration');
      }
      return undefined;
    }
    if (!(chainId in iexecProxyNetworks)) {
      if (strict) {
        throw Error(
          `Missing chainId "${chainId}" in iExec proxy configuration`,
        );
      }
      return undefined;
    }
    if (!('address' in iexecProxyNetworks[chainId])) {
      if (strict) {
        throw Error(
          `Missing address in iExec proxy configuration for chainId "${chainId}"`,
        );
      }
      return undefined;
    }
    return iexecProxyNetworks[chainId].address;
  } catch (error) {
    debug('getHubAddress()', error);
    throw error;
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

  const hubAddress =
    globalHubAddress ||
    getHubAddress(chainId, flavour, {
      strict: true,
    });

  const getContract = (objName, address) => {
    try {
      const { contractDesc } = contractsDescMap[objName];
      if (!address) {
        throw Error(`no contract address provided`);
      }
      const contract = new Contract(
        address,
        contractDesc.abi,
        ethSigner || ethProvider,
      );
      return contract;
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
      const registryAddress = await iexecContract[
        contractsDescMap[registryName].hubPropName
      ]();
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
      const registryContract = getContract(
        contractsDescMap[objName].registryName,
        registryAddress,
      );
      return registryContract;
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
      const registryContract = getContract('token', tokenAddress);
      return registryContract;
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
      useGas === false ? '0x0' : getGasPriceOverride(stringChainId);

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

module.exports = IExecContractsClient;
