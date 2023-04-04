const path = require('path');
const { writeFile, stat, mkdir } = require('fs/promises');

const minifiers = {
  package: ({ name, version, description }) => ({ name, version, description }),
  contract: ({ abi, networks }) => ({ abi, networks }),
};

const sources = [
  ['./package.json', { dir: 'sdk', minifier: minifiers.package }],
  [
    'rlc-faucet-contract/build/contracts/RLC.json',
    { dir: '@iexec/rlc', minifier: minifiers.contract },
  ],
  [
    '@iexec/erlc/build/contracts-min/ERLCTokenSwap.json',
    { dir: '@iexec/erlc', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/package.json',
    { dir: '@iexec/poco', minifier: minifiers.package },
  ],
  [
    '@iexec/poco/build/contracts-min/RegistryEntry.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/ERC1538Proxy.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/IexecInterfaceToken.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/IexecInterfaceNative.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],

  [
    '@iexec/poco/build/contracts-min/AppRegistry.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/WorkerpoolRegistry.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/DatasetRegistry.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/App.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/Workerpool.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@iexec/poco/build/contracts-min/Dataset.json',
    { dir: '@iexec/poco', minifier: minifiers.contract },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json',
    { dir: '@ensdomains/registry', minifier: minifiers.contract },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/registry/FIFSRegistrar.sol/FIFSRegistrar.json',
    { dir: '@ensdomains/registry', minifier: minifiers.contract },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/registry/ReverseRegistrar.sol/ReverseRegistrar.json',
    { dir: '@ensdomains/registry', minifier: minifiers.contract },
  ],
  [
    '@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json',
    { dir: '@ensdomains/resolvers', minifier: minifiers.contract },
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
