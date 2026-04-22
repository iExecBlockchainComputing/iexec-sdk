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
     * id of the chain
     */
    chainId: number | string;
    /**
     * IExec contract address
     */
    hubAddress: string;
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
   * current IExec contract address
   */
  hubAddress: string;
  /**
   * IExec PoCo ABI version
   */
  pocoVersion: string;
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
   * fetch the IExec token Contract instance
   */
  fetchTokenContract?(resourceName: string): Promise<Contract>;
  /**
   * fetch the IExec token contract address
   */
  fetchTokenAddress(resourceName: string): Promise<string>;
}
