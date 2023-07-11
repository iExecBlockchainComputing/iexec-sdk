import util from 'node-forge/lib/util.js';
import forgeCipher from 'node-forge/lib/cipher.js';
import forgePki from 'node-forge/lib/pki.js';

export const pki = forgePki;
export const cipher = forgeCipher;
export const { createBuffer } = util;
