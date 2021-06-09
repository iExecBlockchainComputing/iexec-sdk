# iExec Cookbook

## Encrypted dataset creation

```js

// read the original file
// exemple with FileReader in browser
const datasetFileBytes = await new Promise((resolve, reject) => {
  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(file);
  fileReader.onload = e => resolve(e.target.result);
  fileReader.onerror = () =>
    reject(Error(`Failed to read file: ${fileReader.error}`));
  fileReader.onabort = () => reject(Error(`Failed to read file: aborted`));
});

// encrypt the file
const key = iexec.dataset.generateEncryptionKey();
const encryptedFileBuffer = await iexec.dataset.encrypt(datasetFileBytes, key);

// compute the encrypted file checksum
const datasetChecksum = await iexec.dataset.computeChecksum(encryptedFileBuffer);


// upload the encrypted file and get a direct download uri (formated as standard url or multiaddr)
// exemple with ipfs package
const multiaddr = await new Promise((resolve, reject) => {
  try {
    const uploadResult = await ipfs.add(encrypted);
    const { cid } = uploadResult;
    return = `/ipfs/${cid.toSting()}`;
  } catch (e) {
    reject(Error(`Failed to upload encrypted file: ${e}`));
  }
})

// get the dataset checksum
const checksum = await iexec.dataset.computeChecksum(encryptedFileBuffer);


// deploy the dataset on the blockchain
const { address } = await iexec.dataset.deployDataset({
  owner: await iexec.wallet.getAddress(), // set the current wallet as owner
  name: file.name,
  multiaddr,
  checksum
});

// push the dataset decryption key to the SMS
await iexec.dataset.pushDatasetSecret(datasetAddress, key);

// define usage policy in a datsetorder
const datasetorder = await iexec.order.signDatasetorder(
  await iexec.order.createDatasetorder({
    dataset: address,
    tag: ['tee'], // use tag tee to ensure your dataset will never be used by apps running outside a Trusted Execution Environment
    datasetprice: 0, // you may want to receive an income when someone use your dataset
    volume: 1000000000, // total number of use of the dataset order
    apprestrict: 'my-trusted-app.eth' // restrict the usage of your dataset to a trusted app (no apprestrict will let any app being able to use your dataset and leave your data unprotected against malicious apps)
  })
);

// publish the datasetorder to the marketplace
await iexec.order.publishDatasetorder(datasetorder);
```
