[iexec](../README.md) / [Exports](../modules.md) / IExecDatasetModule

# Class: IExecDatasetModule

module exposing dataset methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecDatasetModule`**

## Table of contents

### Constructors

- [constructor](IExecDatasetModule.md#constructor)

### Properties

- [config](IExecDatasetModule.md#config)

### Methods

- [checkDatasetSecretExists](IExecDatasetModule.md#checkdatasetsecretexists)
- [computeEncryptedFileChecksum](IExecDatasetModule.md#computeencryptedfilechecksum)
- [countUserDatasets](IExecDatasetModule.md#countuserdatasets)
- [deployDataset](IExecDatasetModule.md#deploydataset)
- [encrypt](IExecDatasetModule.md#encrypt)
- [generateEncryptionKey](IExecDatasetModule.md#generateencryptionkey)
- [pushDatasetSecret](IExecDatasetModule.md#pushdatasetsecret)
- [showDataset](IExecDatasetModule.md#showdataset)
- [showUserDataset](IExecDatasetModule.md#showuserdataset)
- [fromConfig](IExecDatasetModule.md#fromconfig)

## Constructors

### constructor

• **new IExecDatasetModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### checkDatasetSecretExists

▸ **checkDatasetSecretExists**(`datasetAddress`): `Promise`<`boolean`\>

check if a the dataset secret exists in the Secret Management Service

example:
```js
const isSecretSet = await checkDatasetSecretExists(datasetAddress);
console.log('secret exists:', isSecretSet);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetAddress` | `string` |

#### Returns

`Promise`<`boolean`\>

___

### computeEncryptedFileChecksum

▸ **computeEncryptedFileChecksum**(`encryptedFile`): `Promise`<`string`\>

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

| Name | Type |
| :------ | :------ |
| `encryptedFile` | `Buffer` \| `ArrayBuffer` \| `Uint8Array` |

#### Returns

`Promise`<`string`\>

___

### countUserDatasets

▸ **countUserDatasets**(`userAddress`): `Promise`<`BN`\>

count the datasets owned by an address.

example:
```js
const count = await countUserDatasets(userAddress);
console.log('dataset count:', count);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `userAddress` | `string` |

#### Returns

`Promise`<`BN`\>

___

### deployDataset

▸ **deployDataset**(`dataset`): `Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

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

| Name | Type | Description |
| :------ | :------ | :------ |
| `dataset` | `Object` | - |
| `dataset.checksum` | `string` | sha256sum of the file |
| `dataset.multiaddr` | [`Multiaddress`](../modules/internal_.md#multiaddress) | dataset file download address |
| `dataset.name` | `string` | a name for the dataset |
| `dataset.owner` | `string` | the dataset owner |

#### Returns

`Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

___

### encrypt

▸ **encrypt**(`datasetFile`, `encyptionKey`): `Promise`<`Buffer`\>

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

| Name | Type |
| :------ | :------ |
| `datasetFile` | `Buffer` \| `ArrayBuffer` \| `Uint8Array` |
| `encyptionKey` | `string` |

#### Returns

`Promise`<`Buffer`\>

___

### generateEncryptionKey

▸ **generateEncryptionKey**(): `string`

generate an encryption key to encrypt a dataset

_NB_: this method returns a base64 encoded 256 bits key

example:
```js
const encryptionKey = generateEncryptionKey();
console.log('encryption key:', encryptionKey);
```

#### Returns

`string`

___

### pushDatasetSecret

▸ **pushDatasetSecret**(`datasetAddress`, `encryptionKey`): `Promise`<`boolean`\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

push the dataset's encryption key to the Secret Management Service

**WARNING**: pushed secrets CAN NOT be updated

example:
```js
const pushed = await pushDatasetSecret(datasetAddress, encryptionKey);
console.log('secret pushed:', pushed);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetAddress` | `string` |
| `encryptionKey` | `string` |

#### Returns

`Promise`<`boolean`\>

___

### showDataset

▸ **showDataset**(`datasetAddress`): `Promise`<{ `dataset`: [`Dataset`](../interfaces/internal_.Dataset.md) ; `objAddress`: `string`  }\>

show a deployed dataset details

example:
```js
const { dataset } = await showDataset('0xb9b56f1c78f39504263835342e7affe96536d1ea');
console.log('dataset:', dataset);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetAddress` | `string` |

#### Returns

`Promise`<{ `dataset`: [`Dataset`](../interfaces/internal_.Dataset.md) ; `objAddress`: `string`  }\>

___

### showUserDataset

▸ **showUserDataset**(`index`, `address`): `Promise`<{ `dataset`: [`Dataset`](../interfaces/internal_.Dataset.md) ; `objAddress`: `string`  }\>

show deployed dataset details by index for specified user user

example:
```js
const { dataset } = await showUserDataset(0, userAddress);
console.log('dataset:', dataset);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | [`BNish`](../modules/internal_.md#bnish) |
| `address` | `string` |

#### Returns

`Promise`<{ `dataset`: [`Dataset`](../interfaces/internal_.Dataset.md) ; `objAddress`: `string`  }\>

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecDatasetModule`](IExecDatasetModule.md)

Create an IExecDatasetModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecDatasetModule`](IExecDatasetModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
