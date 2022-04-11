import { BlockTag, Provider } from '@ethersproject/abstract-provider';
import { Wallet } from '@ethersproject/wallet';
import { BytesLike } from '@ethersproject/bytes';
import {
  ExternallyOwnedAccount,
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';
import { SigningKey } from '@ethersproject/signing-key';

export class EnhancedWallet extends Wallet {
  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    provider?: Provider,
    options?: {
      gasPrice?: string;
      getTransactionCount?: (blockTag?: BlockTag) => Promise<number>;
    },
  );

  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
  ): Promise<string>;
}
