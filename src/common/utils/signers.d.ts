import {
  Wallet,
  BlockTag,
  SigningKey,
  Provider,
  AbstractSigner,
  Signer,
  TransactionRequest,
  Eip1193Provider,
  Networkish,
  TypedDataDomain,
  TypedDataField,
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

export class BrowserProviderSigner extends AbstractSigner {
  constructor(ethereum: Eip1193Provider, network?: Networkish);
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
