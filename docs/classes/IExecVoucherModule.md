[iexec](../README.md) / [Exports](../modules.md) / IExecVoucherModule

# Class: IExecVoucherModule

module exposing voucher methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecVoucherModule`**

## Table of contents

### Constructors

- [constructor](IExecVoucherModule.md#constructor)

### Properties

- [config](IExecVoucherModule.md#config)

### Methods

- [authorizeRequester](IExecVoucherModule.md#authorizerequester)
- [getVoucherAddress](IExecVoucherModule.md#getvoucheraddress)
- [revokeRequesterAuthorization](IExecVoucherModule.md#revokerequesterauthorization)
- [showUserVoucher](IExecVoucherModule.md#showuservoucher)
- [fromConfig](IExecVoucherModule.md#fromconfig)

## Constructors

### constructor

• **new IExecVoucherModule**(`configOrArgs`, `options?`): [`IExecVoucherModule`](IExecVoucherModule.md)

Create an IExecModule instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecVoucherModule`](IExecVoucherModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### authorizeRequester

▸ **authorizeRequester**(`requester`): `Promise`<`string`\>

**SIGNER REQUIRED**

authorize a requester to use the voucher

example:
```js
const txHash = await authorizeRequester(requesterAddress);
console.log('tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requester` | `string` |

#### Returns

`Promise`<`string`\>

___

### getVoucherAddress

▸ **getVoucherAddress**(`owner`): `Promise`<``null`` \| `string`\>

returns the address of the voucher contract for the specified address if the address owns a voucher

example:
```js
const voucherAddress = await getVoucherAddress(ownerAddress);
console.log('voucher contract address:', voucherAddress);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `owner` | `string` |

#### Returns

`Promise`<``null`` \| `string`\>

___

### revokeRequesterAuthorization

▸ **revokeRequesterAuthorization**(`requester`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requester` | `string` |

#### Returns

`Promise`<`string`\>

___

### showUserVoucher

▸ **showUserVoucher**(`owner`): `Promise`<[`VoucherInfo`](../interfaces/internal_.VoucherInfo.md)\>

returns the user voucher information

example:
```js
const userVoucher = await showUserVoucher(userAddress);
console.log('address:', userVoucher.address);
console.log('balance:', userVoucher.balance);
console.log('expiration:', userVoucher.expirationTimestamp);
console.log('sponsored apps:', userVoucher.sponsoredApps);
console.log('sponsored datasets:', userVoucher.sponsoredDatasets);
console.log('sponsored workerpools:', userVoucher.sponsoredWorkerpools);
console.log('allowance on user account:', userVoucher.allowanceAmount);
console.log('authorized accounts:', userVoucher.authorizedAccounts);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `owner` | `string` |

#### Returns

`Promise`<[`VoucherInfo`](../interfaces/internal_.VoucherInfo.md)\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecVoucherModule`](IExecVoucherModule.md)

Create an IExecVoucherModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecVoucherModule`](IExecVoucherModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
