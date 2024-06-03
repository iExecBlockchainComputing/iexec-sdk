import Debug from 'debug';
import { gql } from 'graphql-request';
import { throwIfMissing } from '../../utils/validator';

const debug = Debug('iexec:voucher:accounts');

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
    debug('getVoucherAuthorizedAccounts()', error);
    throw error;
  }
};
