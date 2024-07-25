import Debug from 'debug';
import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { fetchVoucherAddress } from './voucherHub.js';
import { checkAllowance } from '../account/allowance.js';
import { bigIntToBn, checkSigner } from '../utils/utils.js';
import { getAddress } from '../wallet/address.js';
import { wrapCall, wrapSend } from '../utils/errorWrappers.js';
import { getVoucherInfo } from './subgraph/voucherInfo.js';
import {
  getVoucherContract,
  getVoucherSubgraphClient,
} from '../utils/voucher-utils.js';

const debug = Debug('iexec:voucher:voucher');

export const fetchVoucherContract = async (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  owner,
) => {
  try {
    const voucherAddress = await fetchVoucherAddress(
      contracts,
      voucherHubAddress,
      owner,
    );
    if (voucherAddress) {
      return getVoucherContract(contracts, voucherAddress);
    }
    return undefined;
  } catch (error) {
    debug('fetchVoucherContract()', error);
    throw error;
  }
};

export const showUserVoucher = async (
  contracts = throwIfMissing(),
  voucherSubgraphURL,
  voucherHubAddress,
  owner = throwIfMissing(),
) => {
  try {
    const vOwner = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .label('owner')
      .validate(owner);
    const graphQLClient = getVoucherSubgraphClient(
      contracts,
      voucherSubgraphURL,
    );
    const voucherAddress = await fetchVoucherAddress(
      contracts,
      voucherHubAddress,
      vOwner,
    );
    if (!voucherAddress) {
      throw Error(`No Voucher found for address ${vOwner}`);
    }
    const voucherContract = await fetchVoucherContract(
      contracts,
      voucherHubAddress,
      vOwner,
    );
    const fetchType = voucherContract.getType();
    const fetchBalance = voucherContract.getBalance();
    const fetchExpirationTimestamp = voucherContract.getExpiration();
    const fetchAllowanceAmount = checkAllowance(
      contracts,
      vOwner,
      voucherAddress,
    );
    const fetchVoucherInfo = getVoucherInfo(graphQLClient, voucherAddress);
    const [type, balance, expirationTimestamp, allowanceAmount, voucherInfo] =
      await Promise.all([
        fetchType,
        fetchBalance,
        fetchExpirationTimestamp,
        fetchAllowanceAmount,
        fetchVoucherInfo,
      ]);
    return {
      owner,
      address: voucherAddress,
      type: bigIntToBn(type),
      balance: bigIntToBn(balance),
      allowanceAmount: bigIntToBn(allowanceAmount),
      expirationTimestamp: bigIntToBn(expirationTimestamp),
      ...voucherInfo,
    };
  } catch (error) {
    debug('showUserVoucher()', error);
    throw error;
  }
};

export const authorizeRequester = async (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  requester,
) => {
  try {
    checkSigner(contracts);
    const userAddress = await getAddress(contracts);
    const vRequester = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .label('requester')
      .validate(requester);
    const voucherContract = await fetchVoucherContract(
      contracts,
      voucherHubAddress,
      userAddress,
    );
    if (!voucherContract) {
      throw Error(`No Voucher found for address ${userAddress}`);
    }
    const isAuthorized = await wrapCall(
      voucherContract.isAccountAuthorized(vRequester),
    );
    if (isAuthorized) {
      throw Error(`${vRequester} is already authorized`);
    }
    const tx = await wrapSend(
      voucherContract
        .connect(contracts.signer)
        .authorizeAccount(vRequester, contracts.txOptions),
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    debug('authorizeRequester()', error);
    throw error;
  }
};

export const revokeRequesterAuthorization = async (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  requester,
) => {
  try {
    checkSigner(contracts);
    const userAddress = await getAddress(contracts);
    const vRequester = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .label('requester')
      .validate(requester);
    const voucherContract = await fetchVoucherContract(
      contracts,
      voucherHubAddress,
      userAddress,
    );
    if (!voucherContract) {
      throw Error(`No Voucher found for address ${userAddress}`);
    }
    const isAuthorized = await wrapCall(
      voucherContract.isAccountAuthorized(vRequester),
    );
    if (!isAuthorized) {
      throw Error(`${vRequester} is not authorized`);
    }
    const tx = await wrapSend(
      voucherContract
        .connect(contracts.signer)
        .unauthorizeAccount(vRequester, contracts.txOptions),
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    debug('revokeRequesterAuthorization()', error);
    throw error;
  }
};
