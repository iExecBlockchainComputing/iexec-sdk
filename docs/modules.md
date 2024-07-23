[iexec](README.md) / Exports

# iexec

## Table of contents

### References

- [BN](modules.md#bn)

### Modules

- [&lt;internal\&gt;](modules/internal_.md)

### Namespaces

- [errors](modules/errors.md)
- [utils](modules/utils.md)

### Classes

- [BrowserProviderSigner](classes/BrowserProviderSigner.md)
- [EnhancedWallet](classes/EnhancedWallet.md)
- [IExec](classes/IExec.md)
- [IExecAccountModule](classes/IExecAccountModule.md)
- [IExecAppModule](classes/IExecAppModule.md)
- [IExecConfig](classes/IExecConfig.md)
- [IExecDatasetModule](classes/IExecDatasetModule.md)
- [IExecDealModule](classes/IExecDealModule.md)
- [IExecENSModule](classes/IExecENSModule.md)
- [IExecHubModule](classes/IExecHubModule.md)
- [IExecModule](classes/IExecModule.md)
- [IExecNetworkModule](classes/IExecNetworkModule.md)
- [IExecOrderModule](classes/IExecOrderModule.md)
- [IExecOrderbookModule](classes/IExecOrderbookModule.md)
- [IExecResultModule](classes/IExecResultModule.md)
- [IExecSecretsModule](classes/IExecSecretsModule.md)
- [IExecStorageModule](classes/IExecStorageModule.md)
- [IExecTaskModule](classes/IExecTaskModule.md)
- [IExecWalletModule](classes/IExecWalletModule.md)
- [IExecWorkerpoolModule](classes/IExecWorkerpoolModule.md)
- [Observable](classes/Observable.md)

### Interfaces

- [Eip1193Provider](interfaces/Eip1193Provider.md)
- [IExecConfigArgs](interfaces/IExecConfigArgs.md)
- [IExecConfigOptions](interfaces/IExecConfigOptions.md)
- [ProviderOptions](interfaces/ProviderOptions.md)

### Type Aliases

- [Address](modules.md#address)
- [Addressish](modules.md#addressish)
- [AnyRecord](modules.md#anyrecord)
- [BNish](modules.md#bnish)
- [Bytes](modules.md#bytes)
- [Bytes32](modules.md#bytes32)
- [Dealid](modules.md#dealid)
- [ENS](modules.md#ens)
- [HumanSingleTag](modules.md#humansingletag)
- [Multiaddress](modules.md#multiaddress)
- [NRLCAmount](modules.md#nrlcamount)
- [OrderHash](modules.md#orderhash)
- [Tag](modules.md#tag)
- [TaskIndex](modules.md#taskindex)
- [Taskid](modules.md#taskid)
- [TeeFramework](modules.md#teeframework)
- [TxHash](modules.md#txhash)
- [WeiAmount](modules.md#weiamount)

## References

### BN

Re-exports [BN](classes/utils.BN.md)

## Type Aliases

### Address

Ƭ **Address**: `string`

ethereum address

example:

```js
const address = '0xF048eF3d7E3B33A465E0599E641BB29421f7Df92';
```

---

### Addressish

Ƭ **Addressish**: [`Address`](modules.md#address) \| [`ENS`](modules.md#ens)

ethereum address or ENS

---

### AnyRecord

Ƭ **AnyRecord**: `Record`<`string`, `any`\>

---

### BNish

Ƭ **BNish**: [`BN`](classes/utils.BN.md) \| `bigint` \| `string` \| `number`

big number like

---

### Bytes

Ƭ **Bytes**: `string`

bytes hex string

example:

```js
const NULL_BYTES = '0x';
```

---

### Bytes32

Ƭ **Bytes32**: `string`

bytes 32 hex string

example:

```js
const bytes32 =
  '0x800e8dca929fd7b6ced10b5f84487c49f7be79b2eed662827eccba258ef883c6';
```

---

### Dealid

Ƭ **Dealid**: [`Bytes32`](modules.md#bytes32)

id of a deal

---

### ENS

Ƭ **ENS**: `string`

ENS

example:

```js
const ensName = 'iexec.eth';
```

---

### HumanSingleTag

Ƭ **HumanSingleTag**: `string`

human redable task tag

example:

```js
const teeTag = 'tee';
```

---

### Multiaddress

Ƭ **Multiaddress**: `string` \| `Buffer`

multiaddress

example:

```js
const url = 'https://example.com/foo.bar';
const ipfs = '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ';
```

---

### NRLCAmount

Ƭ **NRLCAmount**: `number` \| `string` \| [`BN`](classes/utils.BN.md)

nRLC amount (nRLC stands for nano RLC, the smallest sub-division of the RLC token: 1 RLC = 1,000,000,000 RLC).

named units ('nRLC', 'RLC') can be used with the format `${amount} ${unit}`

examples:

```js
// number
const oneNRLC = 1;
const tenRLC = 1000000000;
// string (works for amounts above `Number.MAX_SAFE_INTEGER`)
const tenMillionRLC = '10000000000000000';
// string with unit
const fiveRLC = '5 RLC';
const zeroPointOneRLC = '0.1 RLC';
// BN (from utils)
const tenNRLC = new BN(10);
```

---

### OrderHash

Ƭ **OrderHash**: [`Bytes32`](modules.md#bytes32)

order hash

---

### Tag

Ƭ **Tag**: [`Bytes32`](modules.md#bytes32) \| [`HumanSingleTag`](modules.md#humansingletag)[]

task tag used to specify the runtime

example:

```js
const gpuTag = ['gpu'];
const sconeTeeTag = ['tee', 'scone'];
const gramineTeeTag = ['tee', 'gramine'];
```

---

### TaskIndex

Ƭ **TaskIndex**: `number`

index of a task in a bag of tasks

---

### Taskid

Ƭ **Taskid**: [`Bytes32`](modules.md#bytes32)

id of a task

---

### TeeFramework

Ƭ **TeeFramework**: `"scone"` \| `"gramine"`

Trusted Execution Environment name

---

### TxHash

Ƭ **TxHash**: [`Bytes32`](modules.md#bytes32)

transaction hash

---

### WeiAmount

Ƭ **WeiAmount**: `number` \| `string` \| [`BN`](classes/utils.BN.md)

wei amount (wei is the smallest sub-division of ether: 1 ether = 1,000,000,000,000,000,000 wei).

named units ('wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' or 'eth') can be used with the format `${amount} ${unit}`

examples:

```js
// number
const oneWei = 1;
const tenGigaWei = 1000000000;
// string (works for amounts above `Number.MAX_SAFE_INTEGER`)
const oneEth = '1000000000000000000';
// string with unit
const fiveGigaWei = '5 gwei';
const zeroPointOneEth = '0.1 ether';
// BN (from utils)
const tenWei = new BN(10);
```
