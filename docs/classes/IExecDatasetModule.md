[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecDatasetModule

# Class: IExecDatasetModule

module exposing dataset methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecDatasetModule**(`configOrArgs`, `options?`): `IExecDatasetModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecDatasetModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### checkDatasetSecretExists()

> **checkDatasetSecretExists**(`datasetAddress`): `Promise`\<`boolean`\>

check if a the dataset secret exists in the Secret Management Service

example:
```js
const isSecretSet = await checkDatasetSecretExists(datasetAddress);
console.log('secret exists:', isSecretSet);
```

#### Parameters

##### datasetAddress

`string`

#### Returns

`Promise`\<`boolean`\>

***

### checkDeployedDataset()

> **checkDeployedDataset**(`datasetAddress`): `Promise`\<`Boolean`\>

check if an dataset is deployed at a given address

example:
```js
const isDeployed = await checkDeployedDataset(address);
console.log('dataset deployed', isDeployed);
```

#### Parameters

##### datasetAddress

`string`

#### Returns

`Promise`\<`Boolean`\>

***

### computeEncryptedFileChecksum()

> **computeEncryptedFileChecksum**(`encryptedFile`): `Promise`\<`string`\>

compute the encrypted dataset file's checksum required for dataset deployment

the dataset checksum is the encrypted file checksum, use this method on the encrypted file but DO NOT use it on the original dataset file

_NB_:
- the dataset checksum is the sha256sum of the encrypted dataset file
- the checksum is used in the computation workflow to ensure the dataset's integrity

example:
```js
const encryptedDataset = await encrypt(
 datasetFile,
 encryptionKey,
);
const checksum = await computeEncryptedFileChecksum(
 encryptedDataset,
);
```

#### Parameters

##### encryptedFile

`Buffer` | `Uint8Array` | `ArrayBuffer`

#### Returns

`Promise`\<`string`\>

***

### countUserDatasets()

> **countUserDatasets**(`userAddress`): `Promise`\<[`BN`](../interfaces/BN.md)\>

count the datasets owned by an address.

example:
```js
const count = await countUserDatasets(userAddress);
console.log('dataset count:', count);
```

#### Parameters

##### userAddress

`string`

#### Returns

`Promise`\<[`BN`](../interfaces/BN.md)\>

***

### deployDataset()

> **deployDataset**(`dataset`): `Promise`\<\{ `address`: `string`; `txHash`: `string`; \}\>

**SIGNER REQUIRED**

deploy a dataset contract on the blockchain

example:
```js
const { address } = await deployDataset({
 owner: address,
 name: 'cat.jpeg',
 multiaddr: '/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u',
 checksum: '0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d',
});
console.log('deployed at', address);
```

#### Parameters

##### dataset

[`DatasetDeploymentArgs`](../-internal-/interfaces/DatasetDeploymentArgs.md)

#### Returns

`Promise`\<\{ `address`: `string`; `txHash`: `string`; \}\>

***

### encrypt()

> **encrypt**(`datasetFile`, `encyptionKey`): `Promise`\<`Buffer`\>

encrypt the dataset file with the specified key using AES-256-CBC

_NB_:
- the supplied key must be 256 bits base64 encoded
- DO NOT leak the key and DO NOT use the same key for encrypting different datasets

example:
```js
// somehow load the dataset file
const datasetFile = await readDatasetAsArrayBuffer();
// generate a key DO NOT leak this key
const encryptionKey = generateEncryptionKey();
// encrypt
const encryptedDataset = await encrypt(
 datasetFile,
 encryptionKey,
);
// the encrypted binary can be shared
const binary = new Blob([encryptedDataset]);
```

#### Parameters

##### datasetFile

`Buffer` | `Uint8Array` | `ArrayBuffer`

##### encyptionKey

`string`

#### Returns

`Promise`\<`Buffer`\>

***

### generateEncryptionKey()

> **generateEncryptionKey**(): `string`

generate an encryption key to encrypt a dataset

_NB_: this method returns a base64 encoded 256 bits key

example:
```js
const encryptionKey = generateEncryptionKey();
console.log('encryption key:', encryptionKey);
```

#### Returns

`string`

***

### predictDatasetAddress()

> **predictDatasetAddress**(`dataset`): `Promise`\<`string`\>

predict the dataset contract address given the dataset deployment arguments

example:
```js
const address = await predictDatasetAddress({
 owner: address,
 name: 'cat.jpeg',
 multiaddr: '/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u',
 checksum: '0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d',
});
console.log('address', address);
```

#### Parameters

##### dataset

[`DatasetDeploymentArgs`](../-internal-/interfaces/DatasetDeploymentArgs.md)

#### Returns

`Promise`\<`string`\>

***

### pushDatasetSecret()

> **pushDatasetSecret**(`datasetAddress`, `encryptionKey`): `Promise`\<`boolean`\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

push the dataset's encryption key to the Secret Management Service

**WARNING**: pushed secrets CAN NOT be updated

example:
```js
const pushed = await pushDatasetSecret(datasetAddress, encryptionKey);
console.log('secret pushed:', pushed);
```

#### Parameters

##### datasetAddress

`string`

##### encryptionKey

`string`

#### Returns

`Promise`\<`boolean`\>

***

### showDataset()

> **showDataset**(`datasetAddress`): `Promise`\<\{ `dataset`: [`Dataset`](../-internal-/interfaces/Dataset.md); `objAddress`: `string`; \}\>

show a deployed dataset details

example:
```js
const { dataset } = await showDataset('0xb9b56f1c78f39504263835342e7affe96536d1ea');
console.log('dataset:', dataset);
```

#### Parameters

##### datasetAddress

`string`

#### Returns

`Promise`\<\{ `dataset`: [`Dataset`](../-internal-/interfaces/Dataset.md); `objAddress`: `string`; \}\>

***

### showUserDataset()

> **showUserDataset**(`index`, `address`): `Promise`\<\{ `dataset`: [`Dataset`](../-internal-/interfaces/Dataset.md); `objAddress`: `string`; \}\>

show deployed dataset details by index for specified user user

example:
```js
const { dataset } = await showUserDataset(0, userAddress);
console.log('dataset:', dataset);
```

#### Parameters

##### index

[`BNish`](../type-aliases/BNish.md)

##### address

`string`

#### Returns

`Promise`\<\{ `dataset`: [`Dataset`](../-internal-/interfaces/Dataset.md); `objAddress`: `string`; \}\>

***

### transferDataset()

> **transferDataset**(`datasetAddress`, `to`): `Promise`\<\{ `address`: `string`; `to`: `string`; `txHash`: `string`; \}\>

**ONLY DATASET OWNER**

transfer the ownership of a dataset to the specified address

_NB_: when transferring the ownership to a contract, the receiver contract must implement the ERC721 token receiver interface

example:
```js
const { address, to, txHash } = await transferDataset(datasetAddress, receiverAddress);
console.log(`dataset ${address} ownership transferred to ${address} in tx ${txHash}`);
```

#### Parameters

##### datasetAddress

`string`

##### to

`string`

#### Returns

`Promise`\<\{ `address`: `string`; `to`: `string`; `txHash`: `string`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecDatasetModule`

Create an IExecDatasetModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecDatasetModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
