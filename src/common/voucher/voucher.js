import Debug from 'debug';
import { Contract } from 'ethers';
import { abi } from './abi/Voucher.js';
import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { fetchVoucherAddress } from './voucherHub.js';
import { getGraphQLClient } from '../utils/graphql-utils.js';
import { checkAllowance } from '../account/allowance.js';
import { getVoucherAuthorizedAccounts } from './subgraph/authorizedAccounts.js';
import { getVoucherSponsoredAssets } from './subgraph/sponsoredAssets.js';

const debug = Debug('iexec:voucher:voucher');

const getVoucherContract = (
  contracts = throwIfMissing(),
  voucherAddress = throwIfMissing(),
) => new Contract(voucherAddress, abi, contracts.provider);

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
  voucherSubgraphURL = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  owner = throwIfMissing(),
) => {
  const vOwner = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(owner);
  const voucherAddress = await fetchVoucherAddress(
    contracts,
    voucherHubAddress,
    vOwner,
  );

  if (!voucherAddress) {
    throw new Error('No voucher found for this user');
  }
  const voucherContract = getVoucherContract(contracts, voucherAddress);

  const type = await voucherContract.getType();
  const balance = await voucherContract.getBalance();
  const expirationTimestamp = await voucherContract.getExpiration();
  const allowanceAmount = await checkAllowance(
    contracts,
    vOwner,
    voucherAddress,
  );
  const graphQLClient = getGraphQLClient(voucherSubgraphURL);

  const authorizedAccounts = await getVoucherAuthorizedAccounts(
    graphQLClient,
    voucherAddress,
  );
  const sponsoredAssets = await getVoucherSponsoredAssets(
    graphQLClient,
    voucherAddress,
  );
  const sponsoredApps = sponsoredAssets.filter((asset) => asset.type === 'app');
  const sponsoredDatasets = sponsoredAssets.filter(
    (asset) => asset.type === 'dataset',
  );
  const sponsoredWorkerpools = sponsoredAssets.filter(
    (asset) => asset.type === 'workerpool',
  );

  return {
    owner,
    address: voucherAddress,
    type,
    balance,
    expirationTimestamp,
    sponsoredApps,
    sponsoredDatasets,
    sponsoredWorkerpools,
    allowanceAmount,
    authorizedAccounts,
  };
};
