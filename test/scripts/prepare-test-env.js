import { writeFileSync } from 'fs';

const bellecourForkUrl =
  process.env.BELLECOUR_FORK_URL || 'https://bellecour.iex.ec';
const arbitrumSepoliaForkUrl =
  process.env.ARBITRUM_SEPOLIA_FORK_URL ||
  'https://sepolia-rollup.arbitrum.io/rpc';

const [bellecourForkBlock, arbitrumSepoliaForkBlock] = await Promise.all([
  getCurrentBlockNumber(bellecourForkUrl),
  getCurrentBlockNumber(arbitrumSepoliaForkUrl),
]);

console.log('Creating .env file for docker-compose test-stack');
writeFileSync(
  '.env',
  `############ THIS FILE IS GENERATED ############
# run "node prepare-test-env.js" to regenerate #
################################################

# blockchain node to use as the reference for the local fork
BELLECOUR_FORK_URL=${bellecourForkUrl}
# block number to fork from
BELLECOUR_FORK_BLOCK=${bellecourForkBlock}

# blockchain node to use as the reference for the local fork
ARBITRUM_SEPOLIA_FORK_URL=${arbitrumSepoliaForkUrl}
# block number to fork from
ARBITRUM_SEPOLIA_FORK_BLOCK=${arbitrumSepoliaForkBlock}`,
);

async function getCurrentBlockNumber(forkUrl) {
  const blockNumber = await fetch(forkUrl, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((jsonRes) => {
      console.log(
        `Current block number of ${forkUrl} is ${JSON.stringify(jsonRes)}`,
      );
      const forkBlockNumber = parseInt(jsonRes.result.substring(2), 16);
      return forkBlockNumber;
    })
    .catch((e) => {
      throw new Error(
        `Failed to get current block number from ${forkUrl}: ${e}`,
      );
    });
  return blockNumber;
}
