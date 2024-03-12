import { Wallet } from 'ethers';
import { IExec } from '../../src/lib';
import { getSignerFromPrivateKey } from '../../src/lib/utils';
import { getId, getRandomWallet } from '../test-utils';
import { TEE_FRAMEWORKS } from '../../src/common/utils/constant';

export const ONE_ETH = 10n ** 18n;

export const ONE_RLC = 10n ** 9n;

export const ONE_GWEI = 10n ** 9n;

export const getTestConfig =
  (chain) =>
  ({ privateKey, readOnly = false, options = {} } = {}) => {
    const configOptions = {
      bridgeAddress: options.bridgeAddress ?? chain.bridgeAddress,
      bridgedNetworkConf:
        options.bridgedNetworkConf ?? chain.bridgedNetworkConf,
      confirms: options.confirms ?? chain.confirms,
      defaultTeeFramework:
        options.defaultTeeFramework ?? chain.defaultTeeFramework,
      ensPublicResolverAddress:
        options.ensPublicResolverAddress ?? chain.ensPublicResolverAddress,
      ensRegistryAddress:
        options.ensRegistryAddress ?? chain.ensRegistryAddress,
      enterpriseSwapConf:
        options.enterpriseSwapConf ?? chain.enterpriseSwapConf,
      hubAddress: options.hubAddress ?? chain.hubAddress,
      iexecGatewayURL: options.iexecGatewayURL ?? chain.iexecGatewayURL,
      ipfsGatewayURL: options.ipfsGatewayURL ?? chain.ipfsGatewayURL,
      isNative: options.isNative ?? chain.isNative,
      providerOptions: options.providerOptions ?? chain.providerOptions,
      resultProxyURL: options.resultProxyURL ?? chain.resultProxyURL,
      smsURL: options.smsURL ?? chain.smsMap,
      useGas: options.useGas ?? chain.useGas,
    };

    if (readOnly) {
      return {
        iexec: new IExec({ ethProvider: chain.rpcURL }, configOptions),
      };
    }

    const wallet = privateKey ? new Wallet(privateKey) : getRandomWallet();
    const ethProvider = getSignerFromPrivateKey(
      chain.rpcURL,
      wallet.privateKey,
    );
    return {
      iexec: new IExec({ ethProvider }, configOptions),
      wallet,
    };
  };

export const deployRandomApp = async (iexec, { owner, teeFramework } = {}) =>
  iexec.app.deployApp({
    owner: owner || (await iexec.wallet.getAddress()),
    name: `app${getId()}`,
    type: 'DOCKER',
    multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
    checksum:
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    mrenclave: teeFramework && {
      framework: teeFramework,
      version: 'v1',
      fingerprint: 'fingerprint',
      ...(teeFramework.toLowerCase() === TEE_FRAMEWORKS.SCONE && {
        entrypoint: 'entrypoint.sh',
        heapSize: 4096,
      }),
    },
  });

export const deployRandomDataset = async (iexec, { owner } = {}) =>
  iexec.dataset.deployDataset({
    owner: owner || (await iexec.wallet.getAddress()),
    name: `dataset${getId()}`,
    multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    checksum:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  });

export const deployRandomWorkerpool = async (iexec, { owner } = {}) =>
  iexec.workerpool.deployWorkerpool({
    owner: owner || (await iexec.wallet.getAddress()),
    description: `workerpool${getId()}`,
  });
