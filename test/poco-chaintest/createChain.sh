rm -rf mainchain
rm -rf sidechain

npm i ganache-cli

mkdir mainchain
(cd mainchain && git clone git@github.com:iExecBlockchainComputing/PoCo-dev.git)
(cd mainchain/PoCo-dev/ && git checkout v3.mainnet && npm i && ./truffle deploy)

mkdir sidechain
(cd sidechain && git clone git@github.com:iExecBlockchainComputing/PoCo-dev.git)
(cd sidechain/PoCo-dev/ && git checkout v3.sidechain && npm i && ./truffle deploy)

docker build -t iexechub/poco-chaintest:latest .
