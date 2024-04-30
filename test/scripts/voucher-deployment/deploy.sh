git clone https://github.com/iExecBlockchainComputing/iexec-voucher-contracts.git
cd iexec-voucher-contracts
git checkout develop
git clean -f
npm ci
npm run build

# patch repo
cat ../test/scripts/voucher-deployment/iexec-voucher-contracts-patch/hardhat.config.ts-append >> hardhat.config.ts
cat ../test/scripts/voucher-deployment/iexec-voucher-contracts-patch/deploy.ts-replace > deploy/deploy.ts

# deploy
npx hardhat run deploy/deploy.ts --network bellecour-fork

# update voucher config
echo "export const VOUCHER_HUB_ADDRESS = '$(cat .VoucherHub.address)';" > ../test/bellecour-fork/voucher-config.js