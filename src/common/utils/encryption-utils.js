import { Buffer } from 'buffer';
import { utils } from 'ethers';
import { ModeOfOperation } from 'aes-js';
import {
  base64Encoded256bitsKeySchema,
  fileBufferSchema,
  throwIfMissing,
} from './validator';

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

  const aesCbc = new ModeOfOperation.cbc(keyBuffer, ivBuffer);

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

export const sha256Sum = async (fileBytes = throwIfMissing()) => {
  const fileBuffer = await fileBufferSchema().validate(fileBytes);
  return sha256(fileBuffer);
};
