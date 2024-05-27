import { gql } from 'graphql-request';
import { throwIfMissing } from '../../utils/validator';

export const getVoucherSponsoredAssets = async (
  graphQLClient = throwIfMissing(),
  voucherId,
) => {
  const lowercaseVoucherId = voucherId.toLowerCase();
  const query = gql`
    query getVoucherSponsoredAssets($voucherId: ID!) {
      voucher(id: $voucherId) {
        voucherType {
          eligibleAssets {
            id
            type
          }
        }
      }
    }
  `;

  try {
    const { voucher } = await graphQLClient.request(query, {
      voucherId: lowercaseVoucherId,
    });

    return voucher.voucherType.eligibleAssets;
  } catch (error) {
    console.error(
      'Error fetching sponsored assets from voucher subgraph:',
      error,
    );
    throw error;
  }
};
