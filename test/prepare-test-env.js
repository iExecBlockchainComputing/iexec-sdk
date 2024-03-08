import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const forkUrl = process.env.BELLECOUR_FORK_URL || 'https://bellecour.iex.ec';

fetch(forkUrl, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: 2.0,
    method: 'eth_blockNumber',
    params: [],
    id: 1,
  }),
})
  .then((res) => res.json())
  .then((jsonRes) => {
    const forkBlockNumber = parseInt(jsonRes.result.substring(2), 16);
    if (process.env.DRONE) {
      const LOCAL_STACK_ENV_DIR = 'local-stack-env';
      console.log(
        `Creating ${LOCAL_STACK_ENV_DIR} directory for drone test-stack`,
      );
      mkdirSync(LOCAL_STACK_ENV_DIR, { recursive: true });
      writeFileSync(join(LOCAL_STACK_ENV_DIR, 'BELLECOUR_FORK_URL'), forkUrl);
      writeFileSync(
        join(LOCAL_STACK_ENV_DIR, 'BELLECOUR_FORK_BLOCK'),
        `${forkBlockNumber}`,
      );
    } else {
      console.log('Creating .env file for docker-compose test-stack');
      writeFileSync(
        '.env',
        `############ THIS FILE IS GENERATED ############
# run "node prepare-test-env.js" to regenerate #
################################################

# blockchain node to use as the reference for the local fork
BELLECOUR_FORK_URL=${forkUrl}
# block number to fork from
BELLECOUR_FORK_BLOCK=${forkBlockNumber}`,
      );
    }
  })
  .catch((e) => {
    throw Error(`Failed to get current block number from ${forkUrl}: ${e}`);
  });
