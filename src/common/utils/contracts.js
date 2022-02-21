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

const toUpperFirst = (str) => ''.concat(str[0].toUpperCase(), str.substr(1));

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
          throw Error('missing iExec proxy configuration');
        }
        return undefined;
      }
      return enterpriseHubMap[chainId];
    }
    if (!iexecProxyNetworks) {
      if (strict) {
        throw Error('missing iExec proxy configuration');
      }
      return undefined;
    }
    if (!(chainId in iexecProxyNetworks)) {
      if (strict) {
        throw Error(
          `missing chainId "${chainId}" in iExec proxy configuration`,
        );
      }
      return undefined;
    }
    if (!('address' in iexecProxyNetworks[chainId])) {
      if (strict) {
        throw Error(
          `missing address in iExec proxy configuration for chainId "${chainId}"`,
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

const getContractAddress = (
  objName,
  desc,
  chainId,
  flavour,
  { strict = true } = {},
) => {
  try {
    if (objName === 'hub') return getHubAddress(chainId, flavour, { strict });
    if (flavour === 'enterprise') {
      if (strict) {
        throw Error('missing enterprise configuration');
      }
      return undefined;
    }
    if (!('networks' in desc)) {
      if (strict) {
        throw Error('missing networks key in contract JSON description');
      }
      return undefined;
    }
    if (!(chainId in desc.networks)) {
      if (strict) {
        throw Error(`missing "${chainId}" key in contract JSON description`);
      }
      return undefined;
    }
    if (!('address' in desc.networks[chainId])) {
      if (strict) {
        throw Error(
          `missing address key in contract JSON description for chainId: ${chainId}`,
        );
      }
      return undefined;
    }
    return desc.networks[chainId].address;
  } catch (error) {
    debug('getContractAddress()', error);
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
    createParams: [
      'owner',
      'name',
      'type',
      'multiaddr',
      'checksum',
      'mrenclave',
    ],
    registryName: 'appRegistry',
  },
  appRegistry: {
    contractDesc: appRegistryDesc,
    hubPropName: 'appregistry',
  },
  dataset: {
    contractDesc: datasetDesc,
    createParams: ['owner', 'name', 'multiaddr', 'checksum'],
    registryName: 'datasetRegistry',
  },
  datasetRegistry: {
    contractDesc: datasetRegistryDesc,
    hubPropName: 'datasetregistry',
  },
  workerpool: {
    contractDesc: workerpoolDesc,
    createParams: ['owner', 'description'],
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
  gasPrice,
}) => {
  debug('chainId', chainId, 'isNative', isNative, 'flavour', flavour);
  const contractsDescMap = getContractsDescMap(isNative, flavour);
  const hubAddress =
    globalHubAddress ||
    getContractAddress(
      'hub',
      contractsDescMap.hub.contractDesc,
      chainId,
      flavour,
      {
        strict: true,
      },
    );

  const getContract =
    (objName) =>
    ({ at } = {}) => {
      try {
        const { contractDesc } = contractsDescMap[objName];
        const atAddress =
          at ||
          getContractAddress(objName, contractDesc, chainId, flavour, {
            strict: false,
          });
        if (!atAddress) {
          throw Error(
            `no contract address provided, and no existing contract address on chain ${chainId}`,
          );
        }
        const contract = new Contract(
          atAddress,
          contractDesc.abi,
          ethSigner || ethProvider,
        );
        return contract;
      } catch (error) {
        debug('getContract()', error);
        throw error;
      }
    };
  const getIExecContract = ({ at = hubAddress } = {}) =>
    getContract('hub')({ at });

  const getRLCContract = getContract('token');

  const getAsyncRegistryContract = async (
    objName,
    { hub = hubAddress } = {},
  ) => {
    const iexecContract = getIExecContract({ at: hub });
    const registryAddress = await iexecContract[
      contractsDescMap[contractsDescMap[objName].registryName].hubPropName
    ]();
    const registryContract = getContract(
      contractsDescMap[objName].registryName,
    )({
      at: registryAddress,
    });
    return registryContract;
  };

  const fetchContractAddress =
    (objName) =>
    async ({ strict = true, hub = hubAddress } = {}) => {
      const { contractDesc, hubPropName } = contractsDescMap[objName];
      if (!hub && strict) {
        throw Error(
          `Hub address missing but needed to fetch ${objName} address`,
        );
      }
      if (!hub) return undefined;

      if (!hubPropName) {
        return hub;
      }
      const defaultHubAddress = getContractAddress(
        'hub',
        contractsDescMap.hub.contractDesc,
        chainId,
        flavour,
        {
          strict: false,
        },
      );
      if (hub === defaultHubAddress) {
        const contractAddress = getContractAddress(
          objName,
          contractDesc,
          chainId,
          flavour,
          {
            strict: false,
          },
        );
        if (contractAddress) return contractAddress;
      }
      const fetchedContractAddress = await getIExecContract({ at: hub })[
        hubPropName
      ]();
      return fetchedContractAddress;
    };

  const fetchIExecAddress = fetchContractAddress('hub');
  const fetchRLCAddress = fetchContractAddress('token');
  const fetchAppRegistryAddress = fetchContractAddress('appRegistry');
  const fetchDatasetRegistryAddress = fetchContractAddress('datasetRegistry');
  const fetchWorkerpoolRegistryAddress =
    fetchContractAddress('workerpoolRegistry');

  const checkDeployedObj =
    (objName) =>
    async (address, { strict = true, hub = hubAddress } = {}) => {
      const iexecContract = getIExecContract({ at: hub });
      const regisrtyHubName =
        contractsDescMap[contractsDescMap[objName].registryName].hubPropName;
      const registryAddress = await iexecContract[regisrtyHubName]();
      const registryContract = getContract(
        contractsDescMap[objName].registryName,
      )({
        at: registryAddress,
      });
      const isRegistered = await registryContract.isRegistered(address);
      if (isRegistered) return true;
      if (strict) {
        throw new Error(
          `No ${objName} contract deployed at address ${address}`,
        );
      }
      return false;
    };

  const createObj =
    (objName) =>
    async (obj, { hub = hubAddress } = {}) => {
      try {
        if (!hub) {
          throw Error(
            `no hub address provided, and no existing hub contract on chain ${chainId}`,
          );
        }
        const registryContract = await getAsyncRegistryContract(objName, {
          hub,
        });
        const args = contractsDescMap[objName].createParams.map((e) => obj[e]);
        const predictFonctionName = 'predict'.concat(toUpperFirst(objName));
        const predictedAddress = await registryContract[predictFonctionName](
          ...args,
        );
        const isDeployed = await checkDeployedObj(objName)(predictedAddress, {
          strict: false,
        });
        if (isDeployed) {
          throw Error(
            `${toUpperFirst(
              objName,
            )} already deployed at address ${predictedAddress}`,
          );
        }
        const createFonctionName = 'create'.concat(toUpperFirst(objName));
        const tx = await registryContract[createFonctionName](...args, {
          gasPrice,
        });
        const txReceipt = await tx.wait();
        return txReceipt;
      } catch (error) {
        debug('createObj()', error);
        throw error;
      }
    };
  const createApp = createObj('app');
  const createDataset = createObj('dataset');
  const createWorkerpool = createObj('workerpool');

  const getObjProps = (objName) => async (at) => {
    try {
      const { contractDesc } = contractsDescMap[objName];
      const objAddress =
        at ||
        getContractAddress(objName, contractDesc, chainId, flavour, {
          strict: false,
        });
      if (!objAddress) {
        throw Error(
          `no contract address provided, and no existing contract on chain ${chainId}`,
        );
      }
      const objContract = new Contract(
        objAddress,
        contractDesc.abi,
        ethProvider,
      );
      const objPropNames = contractDesc.abi
        .filter((e) => e.stateMutability === 'view' && e.inputs.length === 0)
        .map((e) => e.name);
      const objPropsRPC = await Promise.all(
        objPropNames.map((e) => objContract[e]()),
      );
      const objProps = objPropsRPC.reduce(
        (accu, curr, i) =>
          Object.assign(accu, {
            [objPropNames[i]]: curr,
          }),
        {},
      );
      return objProps;
    } catch (error) {
      debug('getObjProps()', error);
      throw error;
    }
  };

  const getUserObjCount =
    (objName) =>
    async (userAddress, { hub = hubAddress } = {}) => {
      try {
        if (!hub) {
          throw Error(
            `no hub address provided, and no existing hub contract on chain ${chainId}`,
          );
        }

        const iexecContract = getIExecContract({ at: hub });
        const registryAddress = await iexecContract[
          contractsDescMap[contractsDescMap[objName].registryName].hubPropName
        ]();
        const registryContract = getContract(
          contractsDescMap[objName].registryName,
        )({
          at: registryAddress,
        });

        const objsCountBN = await registryContract.balanceOf(userAddress);
        return objsCountBN;
      } catch (error) {
        debug('getUserObjCount()', error);
        throw error;
      }
    };

  const createCategory = async (category, { hub = hubAddress } = {}) => {
    try {
      const iexecContract = getIExecContract({ at: hub });
      const categoryOwner = await iexecContract.owner();
      const userAddress = await ethSigner.getAddress();
      if (!(categoryOwner === userAddress)) {
        throw Error(
          `only category owner ${categoryOwner} can create new categories`,
        );
      }

      const args = [
        category.name,
        category.description,
        category.workClockTimeRef,
      ];

      const tx = await iexecContract.createCategory(...args, { gasPrice });
      const txReceipt = await tx.wait();
      return txReceipt;
    } catch (error) {
      debug('createCategory()', error);
      throw error;
    }
  };

  const getCategoryByIndex = async (index, { hub = hubAddress } = {}) => {
    try {
      const iexecContract = getIExecContract({ at: hub });
      const categoryRPC = await iexecContract.viewCategory(index);
      const categoryPropNames = ['name', 'description', 'workClockTimeRef'];
      const category = categoryRPC.reduce(
        (accu, curr, i) =>
          Object.assign(accu, {
            [categoryPropNames[i]]: curr,
          }),
        {},
      );
      return category;
    } catch (error) {
      debug('getCategoryByIndex()', error);
      throw error;
    }
  };

  const checkBalance = async (userAddress, { hub = hubAddress } = {}) => {
    try {
      if (!hub) {
        throw Error(
          `no hub address provided, and no existing hub contract on chain ${chainId}`,
        );
      }
      const iexecContract = getIExecContract({
        at: hub,
      });
      const balancesRPC = await iexecContract.viewAccount(userAddress);
      return balancesRPC;
    } catch (error) {
      debug('checkBalance()', error);
      throw error;
    }
  };

  const getUserObjIdByIndex =
    (objName) =>
    async (userAddress, index, { hub = hubAddress } = {}) => {
      try {
        if (!hub) {
          throw Error(
            `no hub address provided, and no existing hub contract on chain ${chainId}`,
          );
        }
        const iexecContract = getIExecContract({ at: hub });
        const registryAddress = await iexecContract[
          contractsDescMap[contractsDescMap[objName].registryName].hubPropName
        ]();
        const registryContract = getContract(
          contractsDescMap[objName].registryName,
        )({
          at: registryAddress,
        });
        const objAddress = await registryContract.tokenOfOwnerByIndex(
          userAddress,
          index,
        );
        return objAddress;
      } catch (error) {
        debug('getUserObjIdByIndex()', error);
        throw error;
      }
    };

  return {
    pocoVersion,
    isNative,
    flavour,
    hubAddress,
    checkBalance,
    getContract,
    getIExecContract,
    getAsyncRegistryContract,
    // getAsyncTokenContract,

    ...(!isNative && { getRLCContract }),
    ...(!isNative && { fetchRLCAddress }),
    fetchIExecAddress,
    fetchAppRegistryAddress,
    fetchDatasetRegistryAddress,
    fetchWorkerpoolRegistryAddress,
    createObj,
    createApp,
    createDataset,
    createWorkerpool,
    createCategory,
    getObjProps,
    getCategoryByIndex,
    getUserObjIdByIndex,
    getUserObjCount,
    checkDeployedObj,
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
  } = {}) {
    if (!provider) {
      throw Error('missing provider key');
    }
    const stringChainId = `${chainId}`;
    if (!stringChainId) throw Error('missing chainId key');

    this._args = {
      provider,
      signer,
      chainId: stringChainId,
      hubAddress,
      useGas,
      isNative,
      flavour,
    };
    if (flavour !== 'standard' && flavour !== 'enterprise')
      throw Error('invalid flavour');

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
      gasPrice: gasPriceOverride,
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
      ...client,
    });
  }
}

module.exports = IExecContractsClient;
