const path = require('path');
const fsPromises = require('fs/promises');
const packageJson = require('./package.json');

console.log(`\ngeneratePackages start`);

const distDir = 'dist';

const mainDir = 'src/lib';
const packageExports = packageJson.exports;
const packageFiles = packageJson.files;

const generatePackage = async (fileName) => {
  const [baseName] = fileName.split('.');
  const dirName = baseName;
  const typeFileName = `${baseName}.d.ts`;

  // populate exports path
  packageExports[`./${baseName}`] = {
    types: `./${path.join(distDir, 'esm', 'lib', typeFileName)}`,
    import: `./${path.join(distDir, 'esm', 'lib', fileName)}`,
    require: `./${path.join(distDir, 'cjs', 'lib', fileName)}`,
    browser: `./${path.join(distDir, 'esm', 'lib', fileName)}`,
    default: `./${path.join(distDir, 'esm', 'lib', fileName)}`,
  };

  // create fallback package for unsupported exports map cases
  await fsPromises
    .rmdir(dirName, { recursive: true, force: true })
    .catch(() => {});
  await fsPromises.mkdir(dirName, { recursive: true });
  await fsPromises.writeFile(
    path.join(dirName, 'package.json'),
    JSON.stringify(
      {
        type: 'module',
        types: `../${path.join(distDir, 'esm', 'lib', typeFileName)}`,
        main: `../${path.join(distDir, 'esm', 'lib', fileName)}`,
      },
      null,
      2,
    ).concat('\n'),
  );
  if (!packageFiles.includes(dirName)) {
    packageFiles.push(dirName);
  }
};

fsPromises
  .readdir(mainDir)
  .then((fileNames) =>
    Promise.all(
      fileNames
        .filter(
          (name) =>
            name.split('.').length === 2 &&
            name.endsWith('.js') &&
            name !== 'index.js',
        )
        .map(generatePackage),
    ).then((res) => {
      console.log(`${res.length} packages generated`);
    }),
  )
  .then(() => {
    console.log('updating package.json');
    packageJson.exports = packageExports;
    packageJson.files = packageFiles;
    return fsPromises.writeFile(
      'package.json',
      JSON.stringify(packageJson, null, 2).concat('\n'),
    );
  })
  .then(() => {
    console.log('generatePackages done');
  });
