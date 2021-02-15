const { Buffer } = require('buffer');
const { randomBytes } = require('ethers').utils;

const generateEncryptionKey = () => Buffer.from(randomBytes(32)).toString('base64');

module.exports = {
  generateEncryptionKey,
};
