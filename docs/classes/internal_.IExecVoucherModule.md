[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / IExecVoucherModule

# Class: IExecVoucherModule

[<internal>](../modules/internal_.md).IExecVoucherModule

module exposing voucher methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecVoucherModule`**

## Table of contents

### Constructors

- [constructor](internal_.IExecVoucherModule.md#constructor)

### Properties

- [config](internal_.IExecVoucherModule.md#config)

### Methods

- [authorizeRequester](internal_.IExecVoucherModule.md#authorizerequester)
- [getVoucherAddress](internal_.IExecVoucherModule.md#getvoucheraddress)
- [showUserVoucher](internal_.IExecVoucherModule.md#showuservoucher)
- [revokeRequesterAuthorization](internal_.IExecVoucherModule.md#revokerequesterauthorization)
- [fromConfig](internal_.IExecVoucherModule.md#fromconfig)

## Constructors

### constructor

• **new IExecVoucherModule**(`configOrArgs`, `options?`): [`IExecVoucherModule`](internal_.IExecVoucherModule.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Returns

[`IExecVoucherModule`](internal_.IExecVoucherModule.md)

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

▸ **getVoucherAddress**(`owner`): `Promise`<`string`\>

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

`Promise`<`string`\>

___

### showUserVoucher

▸ **showUserVoucher**(`owner`): `Promise`<[`Voucher`](../interfaces/internal_.Voucher.md)\>

returns the user voucher information

example:
```js
const userVoucher = await showUserVoucher(userAddress);
console.log('owner:', userVoucher.owner);
console.log('address:', userVoucher.address);
console.log('balance:', userVoucher.balance);
```

### revokeRequesterAuthorization

▸ **revokeRequesterAuthorization**(`requester`): `Promise`<`string`\>

**SIGNER REQUIRED**

revoke the authorization previously granted to a requester to use the voucher

example:
```js
const txHash = await revokeRequesterAuthorization(requesterAddress);
console.log('tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `owner` | `string` |

#### Returns

`Promise`<[`Voucher`](../interfaces/internal_.Voucher.md)\>

| `requester` | `string` |

#### Returns

`Promise`<`string`\>

___

### fromConfig

▸ **fromConfig**(`config`): `IExecNetworkModule`

Create an IExecVoucherModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

`IExecNetworkModule`

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
