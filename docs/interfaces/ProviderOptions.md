[iexec](../README.md) / [Exports](../modules.md) / ProviderOptions

# Interface: ProviderOptions

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

## Table of contents

### Properties

- [alchemy](ProviderOptions.md#alchemy)
- [cloudflare](ProviderOptions.md#cloudflare)
- [etherscan](ProviderOptions.md#etherscan)
- [infura](ProviderOptions.md#infura)
- [quorum](ProviderOptions.md#quorum)

## Properties

### alchemy

• `Optional` **alchemy**: `string`

[Alchemy](https://alchemyapi.io/) API key

___

### cloudflare

• `Optional` **cloudflare**: `boolean`

allow Cloudflare provider

___

### etherscan

• `Optional` **etherscan**: `string`

[Etherscan](https://etherscan.io/) API key

___

### infura

• `Optional` **infura**: `string` \| { `projectId`: `string` ; `projectSecret`: `string`  }

[INFURA](https://infura.io/) Project ID or { projectId, projectSecret }

___

### quorum

• `Optional` **quorum**: `number`

the number of backends that must agree (default: 2 for mainnet, 1 for testnets)
