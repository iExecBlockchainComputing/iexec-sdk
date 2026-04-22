[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecConfigOptions

# Interface: IExecConfigOptions

## Properties

### allowExperimentalNetworks?

> `optional` **allowExperimentalNetworks**: `boolean`

if true allows using a provider connected to an experimental networks (default false)

⚠️ experimental networks are networks on which the iExec's stack is partially deployed, experimental networks can be subject to instabilities or discontinuity. Access is provided without warranties.

***

### compassURL?

> `optional` **compassURL**: `string`

**`Experimental`**

override the compass URL to target a custom instance

***

### confirms?

> `optional` **confirms**: `number`

number of block to wait for transactions confirmation (default 1)

***

### hubAddress?

> `optional` **hubAddress**: `string`

override the IExec contract address to target a custom instance

***

### iexecGatewayURL?

> `optional` **iexecGatewayURL**: `string`

override the IExec market URL to target a custom instance

***

### ipfsGatewayURL?

> `optional` **ipfsGatewayURL**: `string`

override the IPFS gateway URL to target a custom instance

***

### ipfsNodeURL?

> `optional` **ipfsNodeURL**: `string`

override the IPFS node URL to target a custom instance

***

### pocoSubgraphURL?

> `optional` **pocoSubgraphURL**: `string`

override the PoCo subgraph URL to target a custom instance

***

### smsURL?

> `optional` **smsURL**: `string`

override the SMS URL to target a custom instance
