import { Contract, Provider, Signer } from 'ethers';

export default class IExecContractsClient {
  /**
   * Create a client for IExec contracts
   */
  constructor(args: {
    /**
     * ethers Provider
     */
    provider: Provider;
    /**
     * ethers Signer, required to sign transactions and messages
     */
    signer?: Signer;
    /**
     * id of the chain to use (used to resolve IExec contract address)
     */
    chainId: number | string;
    /**
     * override the IExec contract address to target a custom instance
     */
    hubAddress?: string;
    /**
     * if false set the gasPrice to 0 (default true)
     */
    useGas?: boolean;
    /**
     * true if IExec contract use the chain native token
     */
    isNative?: boolean;
    /**
     * number of block to wait for transactions confirmation (default 1)
     */
    confirms?: number;
  });
  /**
   * current Provider
   */
  provider: Provider;
  /**
   * current Signer
   */
  signer?: Signer;
  /**
   * current chainId
   */
  chainId: string;
  /**
   * true if current instance use native token
   */
  isNative: string;
  /**
   * current IExec contract address
   */
  hubAddress: string;
  /**
   * IExec PoCo ABI version
   */
  pocoVersion: string;
  /**
   * transaction options
   */
  txOptions: {
    /**
     * gasPrice override
     */
    gasPrice?: bigint;
  };
  /**
   * number of block to wait for transactions confirmation
   */
  confirms: number;
  /**
   * set the signer
   */
  setSigner(signer: Signer): void;
  /**
   * get a known Contract instance at specified address
   */
  getContract(name: string, address: string): Contract;
  /**
   * get the IExec Contract instance
   */
  getIExecContract(): Contract;
  /**
   * fetch the IExec registry Contract instance of specified resource
   */
  fetchRegistryContract(resourceName: string): Promise<Contract>;
  /**
   * fetch the IExec registry contract address of specified resource
   */
  fetchRegistryAddress(resourceName: string): Promise<string>;
  /**
   * fetch the IExec token Contract instance, not available when isNative is true
   */
  fetchTokenContract?(resourceName: string): Promise<Contract>;
  /**
   * fetch the IExec token contract address, not available when isNative is true
   */
  fetchTokenAddress(resourceName: string): Promise<string>;
}
