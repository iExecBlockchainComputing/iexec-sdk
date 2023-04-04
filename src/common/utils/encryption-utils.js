import { Buffer } from 'buffer';
import { utils } from 'ethers';
import aesJs from 'aes-js';
import {
  base64Encoded256bitsKeySchema,
  fileBufferSchema,
  throwIfMissing,
} from './validator.js';

const { randomBytes, sha256 } = utils;

export const generateAes256Key = () =>
  Buffer.from(randomBytes(32)).toString('base64');

export const encryptAes256Cbc = async (
  fileBytes = throwIfMissing(),
  base64Key = throwIfMissing(),
) => {
  const keyBuffer = Buffer.from(
    await base64Encoded256bitsKeySchema().validate(base64Key),
    'base64',
  );
  const fileBuffer = await fileBufferSchema().validate(fileBytes);

  const ivBuffer = Buffer.from(randomBytes(16));

  const aesCbc = new aesJs.ModeOfOperation.cbc(keyBuffer, ivBuffer);

  const pkcs7PaddingLength = 16 - (fileBuffer.length % 16);
  const pkcs7PaddingBuffer = Buffer.alloc(
    pkcs7PaddingLength,
    pkcs7PaddingLength,
  );

  const paddedFileBuffer = Buffer.concat([fileBuffer, pkcs7PaddingBuffer]);

  const encryptedFileBuffer = Buffer.from(aesCbc.encrypt(paddedFileBuffer));

  return Buffer.concat([ivBuffer, encryptedFileBuffer]);
};

export const sha256Sum = async (fileBytes = throwIfMissing()) => {
  const fileBuffer = await fileBufferSchema().validate(fileBytes);
  return sha256(fileBuffer);
};
