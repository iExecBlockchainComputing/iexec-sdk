import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Wallet } from 'ethers';
import { execAsync, getId } from './test-utils';

const IEXEC_JSON = 'iexec.json';
const CHAIN_JSON = 'chain.json';

export const globalSetup = async () => {
  await execAsync('rm test/tests-working-dir').catch(() => {});
  await execAsync('mkdir test/tests-working-dir').catch(() => {});
  process.chdir('test/tests-working-dir');
};

export const globalTeardown = async () => {
  process.chdir('../..');
};

const filePath = (fileName) => join(process.cwd(), fileName);

const loadJSONFile = async (fileName) => {
  const fileJSON = await readFile(filePath(fileName), 'utf8');
  return JSON.parse(fileJSON);
};

const saveJSONToFile = async (json, fileName) => {
  const text = JSON.stringify(json, null, 2);
  await writeFile(filePath(fileName), text);
};

export const setWallet = async (privateKey) => {
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
  const jsonWallet = {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
  };
  await saveJSONToFile(jsonWallet, 'wallet.json');
  return jsonWallet;
};

export const setRichWallet = (chain) => () => setWallet(chain.richWallet);

export const setChain = (chain) => (options) => {
  saveJSONToFile(
    {
      default: 'dev',
      chains: {
        dev: {
          id: chain.chainId,
          host: chain.rpcURL,
          hub: chain.hubAddress,
          sms: chain.smsMap,
          iexecGateway: chain.marketURL,
          resultProxy: chain.resultProxyURL,
          ensRegistry: chain.ensRegistryAddress,
          ensPublicResolver: chain.ensPublicResolverAddress,
          ...options,
        },
      },
    },
    CHAIN_JSON,
  );
};

export const setAppUniqueName = async () => {
  const iexecJson = await loadJSONFile(IEXEC_JSON);
  const name = getId();
  iexecJson.app.name = name;
  await saveJSONToFile(iexecJson, IEXEC_JSON);
  return name;
};

export const setDatasetUniqueName = async () => {
  const iexecJson = await loadJSONFile(IEXEC_JSON);
  const name = getId();
  iexecJson.dataset.name = name;
  await saveJSONToFile(iexecJson, IEXEC_JSON);
  return name;
};

export const setWorkerpoolUniqueDescription = async () => {
  const iexecJson = await loadJSONFile(IEXEC_JSON);
  const description = getId();
  iexecJson.workerpool.description = description;
  await saveJSONToFile(iexecJson, IEXEC_JSON);
  return description;
};
