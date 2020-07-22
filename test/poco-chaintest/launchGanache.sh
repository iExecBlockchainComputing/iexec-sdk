rm -rf ganachedb
npm i --no-save ganache-cli
mkdir ganachedb
../../node_modules/.bin/ganache-cli -m "actual surround disorder swim upgrade devote digital misery truly verb slide final" -l 8000000 -i 65535 --hardfork istanbul --db "./ganachedb"
