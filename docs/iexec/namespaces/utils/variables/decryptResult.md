[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [utils](../README.md) / decryptResult

# Variable: decryptResult()

> `const` **decryptResult**: (`encrypted`, `beneficiaryKey`) => `Promise`\<`Buffer`\>

decrypt an encrypted result file

example:
```js
// somehow load the beneficiary RSA private key
const beneficiaryKey = await loadBeneficiaryKey();
const response = await iexec.task.fetchResults('0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19');
const encFileBuffer = await response.arrayBuffer();
const decryptedFileBuffer = await decryptResult(encFileBuffer, beneficiaryKey);
const binary = new Blob([decryptedFileBuffer]);
```

## Parameters

### encrypted

`Buffer` | `ArrayBuffer` | `Uint8Array` | `string`

### beneficiaryKey

`Buffer` | `ArrayBuffer` | `Uint8Array` | `CryptoKey` | `string`

## Returns

`Promise`\<`Buffer`\>
