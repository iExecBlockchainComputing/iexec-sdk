import { Buffer } from 'buffer';
import { utils } from 'ethers';
import forgeAes from '../libs/forge-aes.js';
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
  let fileBuffer = await fileBufferSchema().validate(fileBytes);

  const iv = randomBytes(16);
  const aesCbcCipher = forgeAes.cipher.createCipher(
    'AES-CBC',
    forgeAes.util.createBuffer(keyBuffer),
  );
  aesCbcCipher.start({ iv: forgeAes.util.createBuffer(iv) });

  const CHUNK_SIZE = 10 * 1000 * 1000;
  let encryptionBuffer = Buffer.from([]);
  while (fileBuffer.byteLength > 0) {
    // flush cipher buffer
    const tmpBuffer = Buffer.from(aesCbcCipher.output.getBytes(), 'binary');
    encryptionBuffer = Buffer.concat([encryptionBuffer, tmpBuffer]);
    // process chunk
    const chunk = fileBuffer.slice(0, CHUNK_SIZE);
    fileBuffer = fileBuffer.slice(CHUNK_SIZE);
    aesCbcCipher.update(forgeAes.util.createBuffer(chunk));
  }
  aesCbcCipher.finish();
  const finalizationBuffer = Buffer.from(
    aesCbcCipher.output.getBytes(),
    'binary',
  );
  return Buffer.concat([iv, encryptionBuffer, finalizationBuffer]);
};

export const sha256Sum = async (fileBytes = throwIfMissing()) => {
  const fileBuffer = await fileBufferSchema().validate(fileBytes);
  return sha256(fileBuffer);
};
