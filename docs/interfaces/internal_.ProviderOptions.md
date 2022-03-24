[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / ProviderOptions

# Interface: ProviderOptions

[{internal}](../modules/internal_.md).ProviderOptions

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

## Table of contents

### Properties

- [alchemy](internal_.ProviderOptions.md#alchemy)
- [etherscan](internal_.ProviderOptions.md#etherscan)
- [infura](internal_.ProviderOptions.md#infura)
- [quorum](internal_.ProviderOptions.md#quorum)

## Properties

### alchemy

• `Optional` **alchemy**: `string`

[Alchemy](https://alchemyapi.io/) API key

#### Defined in

[src/lib/types.d.ts:144](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/types.d.ts#L144)

___

### etherscan

• `Optional` **etherscan**: `string`

[Etherscan](https://etherscan.io/) API key

#### Defined in

[src/lib/types.d.ts:148](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/types.d.ts#L148)

___

### infura

• `Optional` **infura**: `string` \| { `projectId`: `string` ; `projectSecret`: `string`  }

[INFURA](https://infura.io/) Project ID or { projectId, projectSecret }

#### Defined in

[src/lib/types.d.ts:152](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/types.d.ts#L152)

___

### quorum

• `Optional` **quorum**: `number`

the number of backends that must agree (default: 2 for mainnet, 1 for testnets)

#### Defined in

[src/lib/types.d.ts:167](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/types.d.ts#L167)
