import {
  Wallet,
  BlockTag,
  SigningKey,
  Provider,
  AbstractSigner,
  Signer,
  TransactionRequest,
  TypedDataDomain,
  TypedDataField,
  BrowserProvider,
} from 'ethers';

export class EnhancedWallet extends Wallet {
  constructor(
    privateKey: string | SigningKey,
    provider?: Provider,
    options?: {
      gasPrice?: string;
      getTransactionCount?: (blockTag?: BlockTag) => Promise<number>;
    },
  );
}

/**
 * BrowserProvider wrapped in an AbstractSigner
 */
export class BrowserProviderSignerAdapter extends AbstractSigner {
  constructor(browserProvider: BrowserProvider);
  getAddress(): Promise<string>;
  connect(provider: Provider | null): Signer;
  signMessage(message: string | Uint8Array): Promise<string>;
  signTransaction(tx: TransactionRequest): Promise<string>;
  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, any>,
  ): Promise<string>;
}
