import Debug from 'debug';
import { Buffer } from 'buffer';
import JSZip from 'jszip';
import forgeAes from '../libs/forge-aes.js';
import forgePki from '../libs/forge-pki.js';
import { getCrypto, privateAsPem } from './crypto.js';

const debug = Debug('iexec:result-utils');

export const decryptResult = async (encResultsZipBuffer, beneficiaryKey) => {
  const { CryptoKey } = await getCrypto();

  let pemPrivateKey;
  if (beneficiaryKey instanceof CryptoKey) {
    pemPrivateKey = await privateAsPem(beneficiaryKey);
  } else {
    pemPrivateKey = Buffer.from(beneficiaryKey).toString();
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
  const zip = await new JSZip().loadAsync(encryptedZipBuffer).catch((error) => {
    debug(error);
    throw Error(`Failed to load encrypted results zip file`);
  });

  // check required files
  const encKeyFileZip = zip.file(ENC_KEY_FILE_NAME);
  if (!encKeyFileZip) {
    throw Error(`Missing ${ENC_KEY_FILE_NAME} file in zip input file`);
  }
  const encResultsFileZip = zip.file(ENC_RESULTS_FILE_NAME);
  if (!encResultsFileZip) {
    throw Error(`Missing ${ENC_RESULTS_FILE_NAME} file in zip input file`);
  }

  // pre allocation best effort check (_data may not exist, uncompressedSize may have an overflow)
  if (
    encKeyFileZip._data &&
    encKeyFileZip._data.uncompressedSize &&
    (encKeyFileZip._data.uncompressedSize < 0 ||
      encKeyFileZip._data.uncompressedSize > ENC_KEY_MAX_SIZE)
  ) {
    throw Error(`${ENC_KEY_FILE_NAME} is too large`);
  }
  if (
    encResultsFileZip._data &&
    encResultsFileZip._data.uncompressedSize &&
    (encResultsFileZip._data.uncompressedSize < 0 ||
      encResultsFileZip._data.uncompressedSize > ENC_RESULTS_MAX_SIZE)
  ) {
    throw Error(`${ENC_RESULTS_FILE_NAME} is too large`);
  }

  debug(`loading ${ENC_KEY_FILE_NAME}`);
  const encryptedResultsKeyArrayBuffer = await encKeyFileZip
    .async('arraybuffer')
    .then((arrayBuffer) => {
      if (arrayBuffer.byteLength > ENC_KEY_MAX_SIZE) {
        throw Error(`Unexpected file size (${arrayBuffer.byteLength} bytes)`);
      }
      return arrayBuffer;
    })
    .catch((error) => {
      throw Error(
        `Failed to load ${ENC_KEY_FILE_NAME} file from zip input file: ${error}`,
      );
    });

  const base64encodedEncryptedAesKey = Buffer.from(
    encryptedResultsKeyArrayBuffer,
  ).toString();

  const encryptedAesKeyBuffer = Buffer.from(
    base64encodedEncryptedAesKey,
    'base64',
  );

  debug('Decrypting results key');
  let aesKeyBuffer;
  try {
    const key = forgePki.pki.privateKeyFromPem(pemPrivateKey);
    const base64EncodedResultsKey = key.decrypt(encryptedAesKeyBuffer);
    aesKeyBuffer = Buffer.from(base64EncodedResultsKey, 'base64');
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results key with beneficiary key');
  }

  debug(`loading ${ENC_RESULTS_FILE_NAME}`);
  const encResultsArrayBuffer = await encResultsFileZip
    .async('arraybuffer')
    .then((arrayBuffer) => {
      if (arrayBuffer.byteLength > ENC_RESULTS_MAX_SIZE) {
        throw Error(`Unexpected file size (${arrayBuffer.byteLength} bytes)`);
      }
      return arrayBuffer;
    })
    .catch((error) => {
      throw Error(
        `Failed to load ${ENC_RESULTS_FILE_NAME} file from zip input file: ${error}`,
      );
    });

  // decrypt AES ECB (with one time AES key)
  debug('Decrypting results');
  try {
    const base64EncodedEncryptedZip = Buffer.from(
      encResultsArrayBuffer,
    ).toString();
    let encryptedOutZipBuffer = Buffer.from(
      base64EncodedEncryptedZip,
      'base64',
    );
    const aesEcbDecipher = forgeAes.cipher.createDecipher(
      'AES-ECB',
      forgeAes.util.createBuffer(aesKeyBuffer),
    );
    aesEcbDecipher.start();

    const CHUNK_SIZE = 10 * 1000 * 1000;
    let decryptionBuffer = Buffer.from([]);
    while (encryptedOutZipBuffer.byteLength > 0) {
      // flush cipher buffer
      const tmpBuffer = Buffer.from(aesEcbDecipher.output.getBytes(), 'binary');
      decryptionBuffer = Buffer.concat([decryptionBuffer, tmpBuffer]);
      // process chunk
      const chunk = encryptedOutZipBuffer.slice(0, CHUNK_SIZE);
      encryptedOutZipBuffer = encryptedOutZipBuffer.slice(CHUNK_SIZE);
      aesEcbDecipher.update(forgeAes.util.createBuffer(chunk));
    }
    aesEcbDecipher.finish();
    const finalizationBuffer = Buffer.from(
      aesEcbDecipher.output.getBytes(),
      'binary',
    );
    return Buffer.concat([decryptionBuffer, finalizationBuffer]);
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results with decrypted results key');
  }
};
