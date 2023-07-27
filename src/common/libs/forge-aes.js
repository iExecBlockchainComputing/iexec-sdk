import forge from 'node-forge/lib/forge.js';
import aes from 'node-forge/lib/aes.js';

// importing forge modules has side effects on the forge object, make sure the import is not removed by tree-shaking
const forgeAes = forge;
forgeAes.aes = aes;

export default forgeAes;
