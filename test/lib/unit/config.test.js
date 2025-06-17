import { describe, test, expect } from '@jest/globals';
import { Network } from 'ethers';
import { getChainDefaults, getId } from '../../../src/common/utils/config.js';

describe('getId()', () => {
  test('chain id as number returns id', () => {
    expect(getId(134)).toBe(134);
  });
  test('chain id as string returns id', () => {
    expect(getId('134')).toBe(134);
  });
  test('chain name returns id', () => {
    expect(getId('bellecour')).toBe(134);
  });
});

describe('getChainDefaults', () => {
  test('id 134 returns bellecour config', () => {
    expect(getChainDefaults({ id: 134 })).toEqual({
      bridge: {
        bridgedChainId: '1',
        contract: '0x188A4376a1D818bF2434972Eb34eFd57102a19b7',
      },
      ensPublicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
      ensRegistry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
      host: 'https://bellecour.iex.ec',
      hub: undefined,
      iexecGateway: 'https://api.market.v8-bellecour.iex.ec',
      ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
      name: 'bellecour',
      pocoSubgraph: 'https://thegraph.iex.ec/subgraphs/name/bellecour/poco-v5',
      resultProxy: 'https://result.v8-bellecour.iex.ec',
      sms: {
        gramine: 'https://sms.gramine.v8-bellecour.iex.ec',
        scone: 'https://sms.iex.ec',
      },
      voucherHub: '0x3137B6DF4f36D338b82260eDBB2E7bab034AFEda',
      voucherSubgraph:
        'https://thegraph.iex.ec/subgraphs/name/bellecour/iexec-voucher',
    });
  });
  test('unknown id returns empty object', () => {
    expect(getChainDefaults({ id: 0 })).toEqual({});
  });
  test('experimental networks are accessible with `allowExperimental:true` hidden by default', () => {
    expect(getChainDefaults({ id: 421614 })).toEqual({});
    expect(
      getChainDefaults({ id: 421614, allowExperimental: true }).host,
    ).toBeDefined();
  });
});

describe('Networks', () => {
  test('ethers Networks is populated with bellecour', () => {
    const networkFromId = Network.from(134);
    expect(networkFromId.chainId).toBe(134n);
    expect(networkFromId.name).toBe('bellecour');

    const networkFromName = Network.from('bellecour');
    expect(networkFromName.chainId).toBe(134n);
    expect(networkFromName.name).toBe('bellecour');
  });
});
