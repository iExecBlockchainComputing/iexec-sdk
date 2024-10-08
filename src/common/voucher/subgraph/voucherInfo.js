import Debug from 'debug';
// eslint-disable-next-line import/no-unresolved
import { gql } from 'graphql-request';
import { throwIfMissing } from '../../utils/validator.js';
import { checksummedAddress } from '../../utils/utils.js';

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
          eligibleAssets {
            type: __typename
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
      items?.map((item) => checksummedAddress(item.id.toLowerCase())) || [];

    const sponsoredApps = mapIds(
      voucherInfo?.voucherType?.eligibleAssets.filter(
        ({ type }) => type === 'App',
      ),
    );
    const sponsoredDatasets = mapIds(
      voucherInfo?.voucherType?.eligibleAssets.filter(
        ({ type }) => type === 'Dataset',
      ),
    );
    const sponsoredWorkerpools = mapIds(
      voucherInfo?.voucherType?.eligibleAssets.filter(
        ({ type }) => type === 'Workerpool',
      ),
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
