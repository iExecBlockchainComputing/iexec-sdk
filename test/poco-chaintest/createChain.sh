rm -rf mainchain
rm -rf sidechain

npm i ganache-cli

mkdir mainchain
(cd mainchain && git clone git@github.com:iExecBlockchainComputing/PoCo-dev.git)
(cd mainchain/PoCo-dev/ && git reset --hard && git checkout v3.mainnet && git pull && npm i && ./truffle deploy)

mkdir sidechain
(cd sidechain && git clone git@github.com:iExecBlockchainComputing/PoCo-dev.git)
(cd sidechain/PoCo-dev/ && git reset --hard && git checkout v3.sidechain && git pull && npm i && ./truffle deploy)

docker build -t iexechub/poco-chaintest:latest .