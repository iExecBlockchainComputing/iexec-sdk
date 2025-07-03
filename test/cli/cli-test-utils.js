import { readFile, writeFile } from 'fs/promises';
import { pathExists, remove } from 'fs-extra';
import { join } from 'path';
import { Wallet } from 'ethers';
import { execAsync, getId } from '../test-utils.js';

const IEXEC_JSON = 'iexec.json';
const CHAIN_JSON = 'chain.json';

const { INFURA_PROJECT_ID } = process.env;

export const iexecPath = 'iexec';

export const globalSetup = async (testid = 'shared') => {
  const testDir = `test/tests-working-dir/${testid}`;
  await execAsync(`rm -rf ${testDir}`).catch(() => {});
  await execAsync(`mkdir -p ${testDir}`).catch(() => {});
  process.chdir(testDir);
};

export const globalTeardown = async () => {
  process.chdir('../../..');
};

export const runIExecCliRaw = (cmd) =>
  execAsync(`${cmd} --raw`)
    .catch((e) => e.message)
    .then(JSON.parse);

export const filePath = (fileName) => join(process.cwd(), fileName);

export const checkExists = async (file) => pathExists(file);

export const loadJSONFile = async (fileName) => {
  const fileJSON = await readFile(filePath(fileName), 'utf8');
  return JSON.parse(fileJSON);
};

export const saveJSONToFile = async (json, fileName) => {
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
export const setRandomWallet = () => setWallet();

export const setChainsPocoAdminWallet = (chain) => () =>
  setWallet(chain.pocoAdminWallet.privateKey);

export const removeWallet = () => remove('./wallet.json').catch(() => {});

export const setChain =
  (chain) =>
  (chainOptions = {}, providerOptions = {}) =>
    saveJSONToFile(
      {
        default: 'dev',
        chains: {
          dev: {
            id: chain.chainId,
            host: chain.rpcURL,
            hub: chain.hubAddress,
            sms: chain.smsMap,
            iexecGateway: chain.iexecGatewayURL,
            resultProxy: chain.resultProxyURL,
            ensPublicResolver: chain.ensPublicResolverAddress,
            voucherSubgraph: chain.voucherSubgraphURL,
            voucherHub: chain.voucherHubAddress,
            useGas: chain.useGas,
            native: chain.isNative,
            ...chainOptions,
          },
          bellecour: {},
          mainnet: {},
        },
        providers: {
          infura: INFURA_PROJECT_ID,
          ...providerOptions,
        },
      },
      CHAIN_JSON,
    );

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

const editOrder = (orderName) => async (override) => {
  const iexecJson = await loadJSONFile('iexec.json');
  iexecJson.order[orderName] = {
    ...iexecJson.order[orderName],
    ...Object.fromEntries(
      Object.entries(override).filter((e) => e[1] !== undefined),
    ),
  };
  await saveJSONToFile(iexecJson, 'iexec.json');
};

export const editRequestorder = async ({
  app,
  dataset,
  workerpool,
  appmaxprice,
  workerpoolmaxprice,
  datasetmaxprice,
  category,
  volume,
  tag,
}) =>
  editOrder('requestorder')({
    app,
    dataset,
    workerpool,
    appmaxprice,
    workerpoolmaxprice,
    datasetmaxprice,
    category,
    volume,
    tag,
  });

export const editWorkerpoolorder = async ({ category, volume, tag }) =>
  editOrder('workerpoolorder')({
    category,
    volume,
    tag,
  });

export const editApporder = async ({ tag }) =>
  editOrder('apporder')({
    tag,
  });

export const editDatasetorder = async ({ tag }) =>
  editOrder('datasetorder')({
    tag,
  });

export const setDeployedJson = (deployed) =>
  saveJSONToFile(deployed, 'deployed.json');
