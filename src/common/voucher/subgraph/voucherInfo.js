import Debug from 'debug';
import { gql } from 'graphql-request';
import { throwIfMissing } from '../../utils/validator.js';
import { getAddress } from 'ethers';

const debug = Debug('iexec:voucher:info');

export const getVoucherInfo = async (
  graphQLClient = throwIfMissing(),
  voucherId,
) => {
  const lowercaseVoucherId = voucherId.toLowerCase();

  const query = gql`
    query getVoucherInfo($id: ID!) {
      voucher(id: $id) {
        voucherType {
          sponsoredApps: eligibleAssets(where: { type: app }) {
            id
          }
          sponsoredDatasets: eligibleAssets(where: { type: dataset }) {
            id
          }
          sponsoredWorkerpools: eligibleAssets(where: { type: workerpool }) {
            id
          }
        }
        authorizedAccounts {
          id
        }
      }
    }
  `;

  try {
    const response = await graphQLClient.request(query, {
      id: lowercaseVoucherId,
    });
    const voucherInfo = response.voucher;

    const mapIds = (items) =>
      items?.map((item) => getAddress(item.id.toLowerCase())) || [];

    const sponsoredApps = mapIds(voucherInfo?.voucherType?.sponsoredApps);
    const sponsoredDatasets = mapIds(
      voucherInfo?.voucherType?.sponsoredDatasets,
    );
    const sponsoredWorkerpools = mapIds(
      voucherInfo?.voucherType?.sponsoredWorkerpools,
    );
    const authorizedAccounts = mapIds(voucherInfo?.authorizedAccounts);

    return {
      sponsoredApps,
      sponsoredDatasets,
      sponsoredWorkerpools,
      authorizedAccounts,
    };
  } catch (error) {
    debug('getVoucherInfo()', error);
    throw error;
  }
};
