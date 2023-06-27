import { Buffer } from 'buffer';
import { utils } from 'ethers';
import { cipher, createBuffer } from './forge.js';
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
  const iv = randomBytes(16);
  const aesCbcCipher = cipher.createCipher('AES-CBC', createBuffer(keyBuffer));
  aesCbcCipher.start({ iv: createBuffer(iv) });
  aesCbcCipher.update(createBuffer(fileBuffer));
  aesCbcCipher.finish();
  return Buffer.concat([iv, Buffer.from(aesCbcCipher.output.toHex(), 'hex')]);
};

export const sha256Sum = async (fileBytes = throwIfMissing()) => {
  const fileBuffer = await fileBufferSchema().validate(fileBytes);
  return sha256(fileBuffer);
};
