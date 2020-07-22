## init

```bash
nvm use 10 # node 10 required
git clone git@github.com:iExecBlockchainComputing/PoCo-dev.git
(cd PoCo-dev/ && git checkout v5-alpha && npm i)
```

## build v5-token chain

launch ganache in db mode

```bash
./launchGanache.sh # run ganache in db mode
```

deploy poco

```bash
cp config-token.json PoCo-dev/config/config.json
(cd PoCo-dev/ && ./truffle deploy)
```

```bash
docker build . -t iexechub/poco-chaintest:v5-token # build image with db
docker build -f Dockerfile-1s . -t iexechub/poco-chaintest:v5-token-1s
```

stop ganache

## build v5-native chain

launch ganache in db mode

```bash
./launchGanache.sh # run ganache in db mode
```

deploy poco

```bash
cp config-native.json PoCo-dev/config/config.json
(cd PoCo-dev/ && ./truffle deploy)
```

```bash
docker build . -t iexechub/poco-chaintest:v5-native # build image with db
```

stop ganache
