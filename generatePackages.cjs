const path = require('path');
const fsPromises = require('fs/promises');
const packageJson = require('./package.json');

console.log(`\ngeneratePackages start`);

const distDir = 'dist';

const mainDir = 'src/lib';
const packageExports = packageJson.exports;

const generatePackage = async (fileName) => {
  const [baseName] = fileName.split('.');
  const dirName = baseName;
  const typeFileName = `${baseName}.d.ts`;
  await fsPromises
    .rmdir(dirName, { recursive: true, force: true })
    .catch(() => {});
  packageExports[`./${baseName}`] = {
    types: `./${path.join(distDir, 'esm', typeFileName)}`,
    import: `./${path.join(distDir, 'esm', fileName)}`,
    require: `./${path.join(distDir, 'cjs', fileName)}`,
    browser: `./${path.join(distDir, 'esm', fileName)}`,
    default: `./${path.join(distDir, 'esm', fileName)}`,
  };
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
    return fsPromises.writeFile(
      'package.json',
      JSON.stringify(packageJson, null, 2).concat('\n'),
    );
  })
  .then(() => {
    console.log('generatePackages done');
  });
