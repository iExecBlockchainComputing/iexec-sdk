import forge from 'node-forge/lib/forge.js';
import pki from 'node-forge/lib/pki.js';

// importing forge modules has side effects on the forge object, make sure the import is not removed by tree-shaking
const forgePki = forge;
forgePki.pki = pki;

export default forgePki;
