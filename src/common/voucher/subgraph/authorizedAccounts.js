import { gql } from 'graphql-request';
import { throwIfMissing } from '../../utils/validator';

export const getVoucherAuthorizedAccounts = async (
  graphQLClient = throwIfMissing(),
  voucherId,
) => {
  const lowercaseVoucherId = voucherId.toLowerCase();
  const query = gql`
    query getVoucherAuthorizedAccounts($id: ID!) {
      voucher(id: $id) {
        authorizedAccounts {
          id
        }
      }
    }
  `;

  try {
    const { voucher } = await graphQLClient.request(query, {
      id: lowercaseVoucherId,
    });
    return voucher.authorizedAccounts;
  } catch (error) {
    console.error(
      'Error fetching authorized accounts 0x0bdd3f18f60e95e489ad638df8db746fcc3c71e3',
      error,
    );
    throw error;
  }
};
