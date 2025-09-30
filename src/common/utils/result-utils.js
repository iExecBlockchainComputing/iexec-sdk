import Debug from 'debug';
import { Buffer } from 'buffer';
import JSZip from 'jszip';
import forgeAes from '../libs/forge-aes.js';
import forgePki from '../libs/forge-pki.js';
import { getCrypto, privateAsPem } from './crypto.js';

const debug = Debug('iexec:result-utils');

export const decryptResult = async (encResultsZipBuffer, beneficiaryKey) => {
  const { CryptoKey } = await getCrypto();

  let pemRsaPrivateKey;
  if (beneficiaryKey instanceof CryptoKey) {
    pemRsaPrivateKey = await privateAsPem(beneficiaryKey);
  } else {
    pemRsaPrivateKey = Buffer.from(beneficiaryKey).toString();
  }
  let rsaPrivateKey;
  try {
    rsaPrivateKey = forgePki.pki.privateKeyFromPem(pemRsaPrivateKey);
  } catch (error) {
    throw new Error('Invalid beneficiary key', { cause: error });
  }

  const ENC_KEY_FILE_NAME = 'aes-key.rsa';
  const ENC_RESULTS_FILE_NAME = 'iexec_out.zip.aes';
  const ENC_KEY_MAX_SIZE = 1000;
  const ENC_RESULTS_MAX_SIZE = 1000000000; // 1GB

  const encryptedZipBuffer = Buffer.from(encResultsZipBuffer);

  /**
   * Sonar hotspot
   *
   * - path traversal
   * https://stuk.github.io/jszip/documentation/api_jszip/load_async.html
   * > Since v3.8.0 this method will santize relative path components (i.e. ..) in loaded filenames to avoid “zip slip” attacks. For example: ../../../example.txt → example.txt, src/images/../example.txt → src/example.txt. The original filename is available on each zip entry as unsafeOriginalName.
   *
   * - zip bomb
   * Only 2 files are uncompressed.
   * Best effort size check is performed before buffer allocation, resulting buffer size is checked to ensure big file will not be written on disc.
   * When best effort size check fails to detect large file, buffer allocation could flood the memory.
   */
  // eslint-disable-next-line sonarjs/no-unsafe-unzip
  const zip = await new JSZip().loadAsync(encryptedZipBuffer).catch((error) => {
    debug(error);
    throw new Error(`Failed to load encrypted results zip file`);
  });

  // check required files
  const encKeyFileZip = zip.file(ENC_KEY_FILE_NAME);
  if (!encKeyFileZip) {
    throw new Error(`Missing ${ENC_KEY_FILE_NAME} file in zip input file`);
  }
  const encResultsFileZip = zip.file(ENC_RESULTS_FILE_NAME);
  if (!encResultsFileZip) {
    throw new Error(`Missing ${ENC_RESULTS_FILE_NAME} file in zip input file`);
  }

  // pre allocation best effort check (_data may not exist, uncompressedSize may have an overflow)
  if (
    encKeyFileZip._data &&
    encKeyFileZip._data.uncompressedSize &&
    (encKeyFileZip._data.uncompressedSize < 0 ||
      encKeyFileZip._data.uncompressedSize > ENC_KEY_MAX_SIZE)
  ) {
    throw new Error(`${ENC_KEY_FILE_NAME} is too large`);
  }
  if (
    encResultsFileZip._data &&
    encResultsFileZip._data.uncompressedSize &&
    (encResultsFileZip._data.uncompressedSize < 0 ||
      encResultsFileZip._data.uncompressedSize > ENC_RESULTS_MAX_SIZE)
  ) {
    throw new Error(`${ENC_RESULTS_FILE_NAME} is too large`);
  }

  debug(`loading ${ENC_KEY_FILE_NAME}`);
  const encryptedResultsKeyArrayBuffer = await encKeyFileZip
    .async('arraybuffer')
    .then((arrayBuffer) => {
      if (arrayBuffer.byteLength > ENC_KEY_MAX_SIZE) {
        throw new Error(
          `Unexpected file size (${arrayBuffer.byteLength} bytes)`,
        );
      }
      return arrayBuffer;
    })
    .catch((error) => {
      throw new Error(
        `Failed to load ${ENC_KEY_FILE_NAME} file from zip input file: ${error}`,
      );
    });

  const encryptedAesKeyBuffer = Buffer.from(encryptedResultsKeyArrayBuffer);
  debug('Decrypting results key');
  let aesKeyBuffer;
  const aesKeyDecryptionErrors = [];
  try {
    try {
      const resultsKey = rsaPrivateKey.decrypt(encryptedAesKeyBuffer);
      aesKeyBuffer = Buffer.from(resultsKey, 'binary');
    } catch (error) {
      aesKeyDecryptionErrors.push(error);
      debug(
        'standard result key decryption failed, trying base64 encoded encrypted key (legacy)',
      );
      const base64encodedEncryptedAesKey = Buffer.from(
        encryptedResultsKeyArrayBuffer,
      ).toString();
      const encryptedAesKeyBuffer = Buffer.from(
        base64encodedEncryptedAesKey,
        'base64',
      );
      const base64EncodedResultsKey = rsaPrivateKey.decrypt(
        encryptedAesKeyBuffer,
      );
      aesKeyBuffer = Buffer.from(base64EncodedResultsKey, 'base64');
    }
  } catch (error) {
    aesKeyDecryptionErrors.push(error);
    debug(`decryption errors: ${aesKeyDecryptionErrors}`);
    throw new Error('Failed to decrypt results key with beneficiary key');
  }

  debug(`loading ${ENC_RESULTS_FILE_NAME}`);
  const encResultsArrayBuffer = await encResultsFileZip
    .async('arraybuffer')
    .then((arrayBuffer) => {
      if (arrayBuffer.byteLength > ENC_RESULTS_MAX_SIZE) {
        throw new Error(
          `Unexpected file size (${arrayBuffer.byteLength} bytes)`,
        );
      }
      return arrayBuffer;
    })
    .catch((error) => {
      throw new Error(
        `Failed to load ${ENC_RESULTS_FILE_NAME} file from zip input file: ${error}`,
      );
    });

  // decrypt AES (with one time AES key)
  debug(`Decrypting results`);
  try {
    let aesDecipher;
    let encryptedOutZipBuffer;
    switch (aesKeyBuffer.byteLength * 8) {
      case 256:
        // current result encryption was based on aes-256-cbc IV is stored in the 16 first bytes of the payload
        debug(`aes-256-cbc mode detected`);
        aesDecipher = forgeAes.cipher.createDecipher(
          'AES-CBC',
          forgeAes.util.createBuffer(aesKeyBuffer),
        );
        aesDecipher.start({
          iv: forgeAes.util.createBuffer(encResultsArrayBuffer.slice(0, 16)),
        });
        encryptedOutZipBuffer = Buffer.from(encResultsArrayBuffer.slice(16));
        break;
      case 128:
        // legacy result encryption was based on aes-128-ecb with aes encrypted payload encoded in base64
        debug(`Legacy mode aes-128-ecb mode detected`);
        aesDecipher = forgeAes.cipher.createDecipher(
          'AES-ECB',
          forgeAes.util.createBuffer(aesKeyBuffer),
        );
        aesDecipher.start();
        encryptedOutZipBuffer = Buffer.from(
          Buffer.from(encResultsArrayBuffer).toString(),
          'base64',
        );
        break;
      default:
        throw new Error('Failed to determine result encryption mode');
    }

    const CHUNK_SIZE = 10 * 1000 * 1000;
    let decryptionBuffer = Buffer.from([]);
    while (encryptedOutZipBuffer.byteLength > 0) {
      // flush cipher buffer
      const tmpBuffer = Buffer.from(aesDecipher.output.getBytes(), 'binary');
      decryptionBuffer = Buffer.concat([decryptionBuffer, tmpBuffer]);
      // process chunk
      const chunk = encryptedOutZipBuffer.subarray(0, CHUNK_SIZE);
      encryptedOutZipBuffer = encryptedOutZipBuffer.subarray(CHUNK_SIZE);
      aesDecipher.update(forgeAes.util.createBuffer(chunk));
    }
    aesDecipher.finish();
    const finalizationBuffer = Buffer.from(
      aesDecipher.output.getBytes(),
      'binary',
    );
    return Buffer.concat([decryptionBuffer, finalizationBuffer]);
  } catch (error) {
    debug(error);
    throw new Error('Failed to decrypt results with decrypted results key');
  }
};
