const { Buffer } = require('buffer');
const { randomBytes, sha256 } = require('ethers').utils;
const aesjs = require('aes-js');
const {
  base64Encoded256bitsKeySchema,
  fileBufferSchema,
  throwIfMissing,
} = require('./validator');

const generateAes256Key = () => Buffer.from(randomBytes(32)).toString('base64');

const encryptAes256Cbc = async (
  fileBytes = throwIfMissing(),
  base64Key = throwIfMissing(),
) => {
  const keyBuffer = Buffer.from(
    await base64Encoded256bitsKeySchema().validate(base64Key),
    'base64',
  );
  const fileBuffer = await fileBufferSchema().validate(fileBytes);

  const ivBuffer = Buffer.from(randomBytes(16));

  const aesCbc = new aesjs.ModeOfOperation.cbc(keyBuffer, ivBuffer);

  const pkcs7PaddingLength = 16 - (fileBuffer.length % 16);
  const pkcs7PaddingBuffer = Buffer.alloc(
    pkcs7PaddingLength,
    pkcs7PaddingLength,
  );

  const paddedFileBuffer = Buffer.concat([fileBuffer, pkcs7PaddingBuffer]);

  const encyptedFileBuffer = Buffer.from(aesCbc.encrypt(paddedFileBuffer));

  const ivEncryptedFileBuffer = Buffer.concat([ivBuffer, encyptedFileBuffer]);

  return ivEncryptedFileBuffer;
};

const sha256Sum = async (fileBytes = throwIfMissing()) => {
  const fileBuffer = await fileBufferSchema().validate(fileBytes);
  return sha256(fileBuffer);
};

module.exports = {
  generateAes256Key,
  encryptAes256Cbc,
  sha256Sum,
};
