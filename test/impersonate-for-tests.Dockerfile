FROM ghcr.io/foundry-rs/foundry:latest

# bellecour fork
# add tokens to test wallet (1_000_000_000*10^18 wei = 1000 RLC)
RUN echo 'cast rpc anvil_setBalance 0x7bd4783FDCAD405A28052a0d1f11236A741da593 "0x033b2e3c9fd0803ce8000000" --rpc-url http://bellecour-fork:8545' > set-chain-state.sh
# transfer PoCo ownership to test wallet
RUN echo 'cast rpc anvil_impersonateAccount 0x4611b943aa1d656fc669623b5da08756a7e288e9 --rpc-url http://bellecour-fork:8545' >> set-chain-state.sh
RUN echo 'cast send 0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f "transferOwnership(address)" 0x7bd4783FDCAD405A28052a0d1f11236A741da593 --from 0x4611b943aa1d656fc669623b5da08756a7e288e9 --gas-price 0 --legacy --unlocked --rpc-url http://bellecour-fork:8545' >> set-chain-state.sh
RUN echo 'cast rpc anvil_stopImpersonatingAccount 0x4611b943aa1d656fc669623b5da08756a7e288e9 --rpc-url http://bellecour-fork:8545' >> set-chain-state.sh

# bellecour gas fork
# add tokens to test wallet (1_000_000_000*10^18 wei = 1000 RLC)
RUN echo 'cast rpc anvil_setBalance 0x7bd4783FDCAD405A28052a0d1f11236A741da593 "0x033b2e3c9fd0803ce8000000" --rpc-url http://bellecour-gas-fork:8555' > set-chain-state.sh
# transfer PoCo ownership to test wallet
RUN echo 'cast rpc anvil_impersonateAccount 0x4611b943aa1d656fc669623b5da08756a7e288e9 --rpc-url http://bellecour-gas-fork:8555' >> set-chain-state.sh
RUN echo 'cast send 0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f "transferOwnership(address)" 0x7bd4783FDCAD405A28052a0d1f11236A741da593 --from 0x4611b943aa1d656fc669623b5da08756a7e288e9 --gas-price 0 --legacy --unlocked --rpc-url http://bellecour-gas-fork:8555' >> set-chain-state.sh
RUN echo 'cast rpc anvil_stopImpersonatingAccount 0x4611b943aa1d656fc669623b5da08756a7e288e9 --rpc-url http://bellecour-gas-fork:8555' >> set-chain-state.sh

ENTRYPOINT [ "sh", "set-chain-state.sh" ]