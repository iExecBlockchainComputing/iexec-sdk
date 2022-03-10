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

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecModule.d.ts#L20)

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:175](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L175)

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
| `encryptedFile` | `Buffer` \| `Uint8Array` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecDatasetModule.d.ts:163](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L163)

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:91](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L91)

___

### deployDataset

▸ **deployDataset**(`dataset`): `Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:52](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L52)

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
| `datasetFile` | `Buffer` \| `Uint8Array` |
| `encyptionKey` | `string` |

#### Returns

`Promise`<`Buffer`\>

#### Defined in

[src/lib/IExecDatasetModule.d.ts:139](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L139)

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:116](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L116)

___

### pushDatasetSecret

▸ **pushDatasetSecret**(`datasetAddress`, `encryptionKey`): `Promise`<`boolean`\>

**ONLY DATASET OWNER**

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:189](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L189)

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:79](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L79)

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

#### Defined in

[src/lib/IExecDatasetModule.d.ts:101](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecDatasetModule.d.ts#L101)

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecModule`](IExecModule.md)

Create an IExecModule using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecModule`](IExecModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)

#### Defined in

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecModule.d.ts#L24)
