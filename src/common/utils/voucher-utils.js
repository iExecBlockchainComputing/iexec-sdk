import { Contract } from 'ethers';
// eslint-disable-next-line import/no-unresolved
import { GraphQLClient } from 'graphql-request';
import { throwIfMissing } from './validator.js';
import { ConfigurationError } from './errors.js';
import { abi as voucherHubAbi } from '../voucher/abi/VoucherHub.js';
import { abi as voucherAbi } from '../voucher/abi/Voucher.js';

export const getVoucherContract = (
  contracts = throwIfMissing(),
  voucherAddress = throwIfMissing(),
) => new Contract(voucherAddress, voucherAbi, contracts.provider);

export const getVoucherHubContract = (
  contracts = throwIfMissing(),
  voucherHubAddress,
) => {
  if (!voucherHubAddress) {
    throw new ConfigurationError(
      `voucherHubAddress option not set and no default value for your chain ${contracts.chainId}`,
    );
  }
  return new Contract(voucherHubAddress, voucherHubAbi, contracts.provider);
};

export const getVoucherSubgraphClient = (
  contracts = throwIfMissing(),
  voucherSubgraphUrl,
) => {
  if (!voucherSubgraphUrl) {
    throw new ConfigurationError(
      `voucherSubgraphURL option not set and no default value for your chain ${contracts.chainId}`,
    );
  }
  try {
    return new GraphQLClient(voucherSubgraphUrl);
  } catch (error) {
    throw Error(`Failed to create GraphQLClient: ${error.message}`);
  }
};
