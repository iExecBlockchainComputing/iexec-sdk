const path = require('path');
const fsPromises = require('fs').promises;
const packageJson = require('./package.json');

console.log(`\ngeneratePackages start`);

const mainDir = path.join(...packageJson.main.split('/').slice(0, -1));
const packageFiles = packageJson.files;

const generatePackage = async (fileName) => {
  const [baseName] = fileName.split('.');
  const dirName = baseName;
  const typeFileName = `${baseName}.d.ts`;
  await fsPromises
    .rmdir(dirName, { recursive: true, force: true })
    .catch(() => {});
  await fsPromises.mkdir(dirName, { recursive: true });
  await fsPromises.writeFile(
    path.join(dirName, 'package.json'),
    JSON.stringify(
      {
        main: path.join('..', mainDir, fileName),
        types: path.join('..', mainDir, typeFileName),
      },
      null,
      2,
    ).concat('\n'),
  );
  console.log(`generated ${dirName}`);
  const dirPath = `${dirName}/`;
  if (!packageFiles.includes(dirPath)) {
    packageFiles.push(dirPath);
    console.log(`adding ${dirPath} to package files`);
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
    packageJson.files = packageFiles;
    return fsPromises.writeFile(
      'package.json',
      JSON.stringify(packageJson, null, 2).concat('\n'),
    );
  })
  .then(() => {
    console.log('generatePackages done');
  });
