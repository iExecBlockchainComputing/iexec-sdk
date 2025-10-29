import { describe, test, expect } from '@jest/globals';
import { Network } from 'ethers';
import {
  CHAIN_SPECIFIC_FEATURES,
  checkImplementedOnChain,
  getChainDefaults,
  getId,
} from '../../../src/common/utils/config.js';

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
    expect(getChainDefaults(134)).toEqual({
      bridge: {
        bridgedChainId: '1',
        contract: '0x188A4376a1D818bF2434972Eb34eFd57102a19b7',
      },
      ensPublicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
      ensRegistry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
      host: 'https://bellecour.iex.ec',
      hub: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
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
    expect(getChainDefaults(0)).toEqual({});
  });
  test.skip('experimental networks are accessible with `allowExperimentalNetworks:true` hidden by default', () => {
    expect(getChainDefaults(421614)).toEqual({});
    expect(
      getChainDefaults(421614, { allowExperimentalNetworks: true }).host,
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

describe('checkImplementedOnChain', () => {
  describe(`feature ${CHAIN_SPECIFIC_FEATURES.ENS}`, () => {
    const feature = CHAIN_SPECIFIC_FEATURES.ENS;
    test('is implemented on bellecour', () => {
      expect(() => checkImplementedOnChain(134, feature)).not.toThrow();
    });
    test('is implemented on mainnet', () => {
      expect(() => checkImplementedOnChain(1, feature)).not.toThrow();
    });
    test('is not implemented on arbitrum-mainnet', () => {
      expect(() => checkImplementedOnChain(42161, feature)).toThrow(
        `${feature} is not available on network arbitrum-mainnet`,
      );
    });
    test('is not implemented on arbitrum-sepolia-testnet', () => {
      expect(() => checkImplementedOnChain(421614, feature)).toThrow(
        `${feature} is not available on network arbitrum-sepolia-testnet`,
      );
    });
  });
  describe(`feature ${CHAIN_SPECIFIC_FEATURES.WORKERPOOL_API_URL_REGISTRATION}`, () => {
    const feature = CHAIN_SPECIFIC_FEATURES.WORKERPOOL_API_URL_REGISTRATION;
    test('is implemented on bellecour', () => {
      expect(() => checkImplementedOnChain(134, feature)).not.toThrow();
    });
    test('is implemented on mainnet', () => {
      expect(() => checkImplementedOnChain(1, feature)).not.toThrow();
    });
    test('is not implemented on arbitrum-mainnet', () => {
      expect(() => checkImplementedOnChain(42161, feature)).toThrow(
        `${feature} is not available on network arbitrum-mainnet`,
      );
    });
    test('is not implemented on arbitrum-sepolia-testnet', () => {
      expect(() => checkImplementedOnChain(421614, feature)).toThrow(
        `${feature} is not available on network arbitrum-sepolia-testnet`,
      );
    });
  });
  describe(`feature ${CHAIN_SPECIFIC_FEATURES.VOUCHER}`, () => {
    const feature = CHAIN_SPECIFIC_FEATURES.VOUCHER;
    test('is implemented on bellecour', () => {
      expect(() => checkImplementedOnChain(134, feature)).not.toThrow();
    });
    test('is not implemented on mainnet', () => {
      expect(() => checkImplementedOnChain(1, feature)).toThrow(
        `${feature} is not available on network mainnet`,
      );
    });
    test('is not implemented on arbitrum-mainnet', () => {
      expect(() => checkImplementedOnChain(42161, feature)).toThrow(
        `${feature} is not available on network arbitrum-mainnet`,
      );
    });
    test('is not implemented on arbitrum-sepolia-testnet', () => {
      expect(() => checkImplementedOnChain(421614, feature)).toThrow(
        `${feature} is not available on network arbitrum-sepolia-testnet`,
      );
    });
  });
  describe(`feature ${CHAIN_SPECIFIC_FEATURES.COMPASS}`, () => {
    const feature = CHAIN_SPECIFIC_FEATURES.COMPASS;
    test('is not implemented on bellecour', () => {
      expect(() => checkImplementedOnChain(134, feature)).toThrow(
        `${feature} is not available on network bellecour`,
      );
    });
    test('is not implemented on mainnet', () => {
      expect(() => checkImplementedOnChain(1, feature)).toThrow(
        `${feature} is not available on network mainnet`,
      );
    });
    test('is implemented on arbitrum-mainnet', () => {
      expect(() => checkImplementedOnChain(42161, feature)).not.toThrow();
    });
    test('is implemented on arbitrum-sepolia-testnet', () => {
      expect(() => checkImplementedOnChain(421614, feature)).not.toThrow();
    });
  });
  describe(`feature ${CHAIN_SPECIFIC_FEATURES.XRLC_BRIDGE}`, () => {
    const feature = CHAIN_SPECIFIC_FEATURES.XRLC_BRIDGE;
    test('is implemented on bellecour', () => {
      expect(() => checkImplementedOnChain(134, feature)).not.toThrow();
    });
    test('is implemented on mainnet', () => {
      expect(() => checkImplementedOnChain(1, feature)).not.toThrow();
    });
    test('is not implemented on arbitrum-mainnet', () => {
      expect(() => checkImplementedOnChain(42161, feature)).toThrow(
        `${feature} is not available on network arbitrum-mainnet`,
      );
    });
    test('is not implemented on arbitrum-sepolia-testnet', () => {
      expect(() => checkImplementedOnChain(421614, feature)).toThrow(
        `${feature} is not available on network arbitrum-sepolia-testnet`,
      );
    });
  });
});
