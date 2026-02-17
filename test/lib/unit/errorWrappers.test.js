import { describe, test, expect } from '@jest/globals';
import { BrowserProvider } from 'ethers';
import {
  getRandomWallet,
  InjectedProvider,
  NULL_ADDRESS,
} from '../../test-utils.js';
import {
  wrapPersonalSign,
  wrapSignTypedData,
  wrapSend,
} from '../../../src/common/utils/errorWrappers.js';
import {
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
} from '../../../src/lib/errors.js';

describe('wrapPersonalSign', () => {
  test('detects user signature rejection', async () => {
    const userRejectSigner = await new BrowserProvider(
      new InjectedProvider(
        'https://bellecour.iex.ec',
        getRandomWallet().privateKey,
        {
          mockUserRejection: true,
        },
      ),
    ).getSigner();
    const rejectError = await wrapPersonalSign(
      userRejectSigner.signMessage('foo'),
    ).catch((e) => e);
    expect(rejectError).toBeInstanceOf(Web3ProviderSignMessageError);
    expect(rejectError.isUserRejection).toBe(true);

    const errorSigner = await new BrowserProvider(
      new InjectedProvider(
        'https://bellecour.iex.ec',
        getRandomWallet().privateKey,
        {
          mockError: true,
        },
      ),
    ).getSigner();
    const unknownError = await wrapPersonalSign(
      errorSigner.signMessage('foo'),
    ).catch((e) => e);
    expect(unknownError).toBeInstanceOf(Web3ProviderSignMessageError);
    expect(unknownError.isUserRejection).toBe(undefined);
  });
});

describe('wrapSignTypedData', () => {
  test('detects user signature rejection', async () => {
    const userRejectSigner = await new BrowserProvider(
      new InjectedProvider(
        'https://bellecour.iex.ec',
        getRandomWallet().privateKey,
        {
          mockUserRejection: true,
        },
      ),
    ).getSigner();
    const rejectError = await wrapSignTypedData(
      userRejectSigner.signTypedData(
        { name: 'domain' },
        { custom: [{ name: 'foo', type: 'string' }] },
        { foo: 'bar' },
      ),
    ).catch((e) => e);
    expect(rejectError).toBeInstanceOf(Web3ProviderSignMessageError);
    expect(rejectError.isUserRejection).toBe(true);

    const errorSigner = await new BrowserProvider(
      new InjectedProvider(
        'https://bellecour.iex.ec',
        getRandomWallet().privateKey,
        {
          mockError: true,
        },
      ),
    ).getSigner();
    const unknownError = await wrapSignTypedData(
      errorSigner.signTypedData(
        { name: 'domain' },
        { custom: [{ name: 'foo', type: 'string' }] },
        { foo: 'bar' },
      ),
    ).catch((e) => e);
    expect(unknownError).toBeInstanceOf(Web3ProviderSignMessageError);
    expect(unknownError.isUserRejection).toBe(undefined);
  });
});

describe('wrapSend', () => {
  test('detects user signature rejection', async () => {
    const userRejectSigner = await new BrowserProvider(
      new InjectedProvider(
        'https://bellecour.iex.ec',
        getRandomWallet().privateKey,
        {
          mockUserRejection: true,
        },
      ),
    ).getSigner();
    const rejectError = await wrapSend(
      userRejectSigner.sendTransaction({ to: NULL_ADDRESS }),
    ).catch((e) => e);
    expect(rejectError).toBeInstanceOf(Web3ProviderSendError);
    expect(rejectError.isUserRejection).toBe(true);

    const errorSigner = await new BrowserProvider(
      new InjectedProvider(
        'https://bellecour.iex.ec',
        getRandomWallet().privateKey,
        {
          mockError: true,
        },
      ),
    ).getSigner();
    const unknownError = await wrapSend(
      errorSigner.sendTransaction({ to: NULL_ADDRESS }),
    ).catch((e) => e);
    expect(unknownError).toBeInstanceOf(Web3ProviderSendError);
    expect(unknownError.isUserRejection).toBe(undefined);
  });
});
