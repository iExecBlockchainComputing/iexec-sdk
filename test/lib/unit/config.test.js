import { describe, test, expect } from '@jest/globals';
import { getChainDefaults, getId } from '../../../src/common/utils/config.js';

describe('getId()', () => {
  test('chain id as number returns id', () => {
    expect(getId(421614)).toBe(421614);
  });
  test('chain id as string returns id', () => {
    expect(getId('421614')).toBe(421614);
  });
  test('chain name returns id', () => {
    expect(getId('arbitrum-sepolia-testnet')).toBe(421614);
  });
});

describe('getChainDefaults', () => {
  test('id 421614 returns arbitrum-sepolia-testnet config', () => {
    expect(getChainDefaults(421614)).toEqual({
      host: 'https://sepolia-rollup.arbitrum.io/rpc',
      hub: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
      iexecGateway: 'https://api-market.arbitrum-sepolia-testnet.iex.ec',
      ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
      ipfsNode: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
      name: 'arbitrum-sepolia-testnet',
      pocoSubgraph:
        'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/2GCj8gzLCihsiEDq8cYvC5nUgK6VfwZ6hm3Wj8A3kcxz',
      sms: 'https://sms.arbitrum-sepolia-testnet.iex.ec',
      compass: 'https://compass.arbitrum-sepolia-testnet.iex.ec',
    });
  });
  test('unknown id returns empty object', () => {
    expect(getChainDefaults(0)).toEqual({});
  });
  // skipped because no experimental networks are currently defined
  test.skip('experimental networks are accessible with `allowExperimentalNetworks:true` hidden by default', () => {
    expect(getChainDefaults(421614)).toEqual({});
    expect(
      getChainDefaults(421614, { allowExperimentalNetworks: true }).host,
    ).toBeDefined();
  });
});
