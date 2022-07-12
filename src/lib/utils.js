const {
  BN,
  parseEth,
  parseRLC,
  formatEth,
  formatRLC,
  encodeTag,
  decodeTag,
  sumTags,
  decryptResult,
} = require('../common/utils/utils');
const { NULL_ADDRESS, NULL_BYTES32 } = require('../common/utils/constant');
const { getSignerFromPrivateKey } = require('../common/utils/signers');

module.exports = {
  NULL_ADDRESS,
  NULL_BYTES32,
  BN,
  parseEth,
  parseRLC,
  formatEth,
  formatRLC,
  encodeTag,
  decodeTag,
  sumTags,
  getSignerFromPrivateKey,
  decryptResult,
};
