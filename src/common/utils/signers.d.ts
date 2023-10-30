
import { Wallet, BlockTag, TypedDataDomain, TypedDataField, SigningKey, Provider } from 'ethers';


export class EnhancedWallet extends Wallet {
  constructor(
    privateKey: string | SigningKey,
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
