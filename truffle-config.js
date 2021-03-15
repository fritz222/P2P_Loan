

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
      //from: "0xd78c9A30715390ad17cf603C85d5dD906b34b96e" // account address from which to deploy
    },
    //rinkeby: {
    //  provider: () => new HDWalletProvider(mnemonic, infuraURL),
    //  network_id: 4,          // Rinkeby's network id
    //  gas: 9990000,        
    //},
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    
    solc: {
      version: "0.7.4",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
