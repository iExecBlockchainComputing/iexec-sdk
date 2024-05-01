git clone https://github.com/iExecBlockchainComputing/PoCo.git
cd PoCo
git checkout develop
npm i -g hardhat
npm ci
npm run build

# patch repo
cat ../test/scripts/poco-update/iexec-poco-contracts-patch/hardhat.config.ts-append >> hardhat.config.ts
cat ../test/scripts/poco-update/iexec-poco-contracts-patch/update-poco.ts-replace > scripts/update-poco.ts

# deploy
npx hardhat run scripts/update-poco.ts --network bellecour-fork

# cleanup
rm -rf PoCo