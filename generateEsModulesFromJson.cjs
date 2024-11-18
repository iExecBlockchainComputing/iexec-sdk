const path = require('path');
const { writeFile, stat, mkdir } = require('fs/promises');

const minifiers = {
  package: ({ name, version, description }) => ({ name, version, description }),
  abi: ({ abi }) => ({ abi }),
  truffleDeployment: ({ abi, networks }) => ({
    abi,
    networks: Object.fromEntries(
      Object.entries(networks).map(([chainId, { address }]) => [
        chainId,
        { address },
      ]),
    ),
  }),
  hardhatDeployment: ({ address }) => ({ address }),
};

const sources = [
  ['./package.json', { dir: 'sdk', minifier: minifiers.package }],
  [
    'rlc-faucet-contract/build/contracts/RLC.json',
    { dir: '@iexec/rlc', minifier: minifiers.truffleDeployment },
  ],
  [
    '@iexec/poco/package.json',
    { dir: '@iexec/poco', minifier: minifiers.package },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/RegistryEntry.sol/RegistryEntry.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    // warn /build/
    '@iexec/poco/build/contracts-min/ERC1538Proxy.json',
    { dir: '@iexec/poco', minifier: minifiers.truffleDeployment },
  ],
  [
    '@iexec/poco/artifacts/contracts/IexecInterfaceToken.sol/IexecInterfaceToken.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/IexecInterfaceNative.sol/IexecInterfaceNative.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/apps/AppRegistry.sol/AppRegistry.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/workerpools/WorkerpoolRegistry.sol/WorkerpoolRegistry.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/datasets/DatasetRegistry.sol/DatasetRegistry.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/apps/App.sol/App.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/workerpools/Workerpool.sol/Workerpool.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/poco/artifacts/contracts/registries/datasets/Dataset.sol/Dataset.json',
    { dir: '@iexec/poco', minifier: minifiers.abi },
  ],
  [
    '@iexec/voucher-contracts/artifacts/contracts/beacon/Voucher.sol/Voucher.json',
    { dir: '@iexec/voucher-contracts', minifier: minifiers.abi },
  ],
  [
    '@iexec/voucher-contracts/artifacts/contracts/VoucherHub.sol/VoucherHub.json',
    { dir: '@iexec/voucher-contracts', minifier: minifiers.abi },
  ],
  [
    '@iexec/voucher-contracts/deployments/bellecour/VoucherHubERC1967Proxy.json',
    {
      dir: '@iexec/voucher-contracts/deployments/bellecour',
      minifier: minifiers.hardhatDeployment,
    },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json',
    { dir: '@ensdomains/registry', minifier: minifiers.abi },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/registry/FIFSRegistrar.sol/FIFSRegistrar.json',
    { dir: '@ensdomains/registry', minifier: minifiers.abi },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/reverseRegistrar/ReverseRegistrar.sol/ReverseRegistrar.json',
    { dir: '@ensdomains/registry', minifier: minifiers.abi },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json',
    { dir: '@ensdomains/resolvers', minifier: minifiers.abi },
  ],
];

const createEsModule = (jsonObj) => {
  let module =
    '// this file is auto generated do not edit it\n/* eslint-disable */\n';
  Object.entries(jsonObj).forEach(([key, value]) => {
    module += `export const ${key} = ${JSON.stringify(value)};\n`;
  });
  module += `export default { ${Object.keys(jsonObj).join(', ')} };`;
  return module;
};

console.log('converting json files to es modules');

sources.map(async ([src, options]) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const jsonObj = require(src);
  const minifiedJsonObj = options.minifier
    ? options.minifier(jsonObj)
    : jsonObj;
  const name =
    (options && options.name) ||
    `${src.split('/').pop().split('.json').shift()}.js`;
  const module = createEsModule(minifiedJsonObj);
  const outDir = path.join(`src/common/generated`, options && options.dir);

  const outDirExists = await stat(outDir)
    .then((outDirStat) => outDirStat.isDirectory())
    .catch(() => false);
  if (!outDirExists) {
    await mkdir(outDir, {
      recursive: true,
    });
  }
  const outPath = path.join(outDir, name);
  await writeFile(outPath, module);
  console.log(`${src} => ${outPath}`);
});
