import Debug from 'debug';
import { Contract } from 'ethers';
import { version as pocoVersion } from '../generated/@iexec/poco/package.js';
import iexecTokenDesc from '../generated/@iexec/poco/IexecInterfaceToken.js';
import appRegistryDesc from '../generated/@iexec/poco/AppRegistry.js';
import workerpoolRegistryDesc from '../generated/@iexec/poco/WorkerpoolRegistry.js';
import datasetRegistryDesc from '../generated/@iexec/poco/DatasetRegistry.js';
import appDesc from '../generated/@iexec/poco/App.js';
import workerpoolDesc from '../generated/@iexec/poco/Workerpool.js';
import datasetDesc from '../generated/@iexec/poco/Dataset.js';
import rlcDesc from '../generated/@iexec/rlc/RLC.js';

const debug = Debug('iexec:IExecContractsClient');

const contractsDescMap = {
  hub: {
    contractDesc: iexecTokenDesc,
  },
  token: {
    contractDesc: rlcDesc,
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
};

const createClient = ({ ethSigner, ethProvider, hubAddress }) => {
  const cachedAddresses = {};
  if (!hubAddress) throw new Error('Missing iExec contract address');

  const getContract = (objName, address) => {
    try {
      const { contractDesc } = contractsDescMap[objName];
      if (!address) {
        throw new Error(`no contract address provided`);
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
    hubAddress,
    getContract,
    getIExecContract,
    fetchRegistryContract,
    fetchTokenContract,
    fetchTokenAddress,
    fetchRegistryAddress,
  };
};

class IExecContractsClient {
  constructor({ provider, signer, chainId, hubAddress, confirms = 1 } = {}) {
    const stringChainId = `${chainId}`;
    if (!provider) throw new Error('missing provider key');
    if (!hubAddress) throw new Error('missing hubAddress key');
    if (!stringChainId) throw new Error('missing chainId key');
    if (!Number.isInteger(confirms) || confirms <= 0)
      throw new Error('invalid confirms');

    this._args = {
      provider,
      signer,
      chainId: stringChainId,
      hubAddress,
    };

    const client = createClient({
      ethSigner: signer,
      ethProvider: provider,
      hubAddress,
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
      confirms,
      ...client,
    });
  }
}

export default IExecContractsClient;
