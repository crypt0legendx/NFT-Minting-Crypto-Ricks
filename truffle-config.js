const HDWalletProvider = require('@truffle/hdwallet-provider')

const mnemonic =
  'jar deny prosper gasp flush glass core corn alarm treat leg smart'
const arbProviderUrl = 'http://localhost:8547/'

module.exports = {
  arbitrum: {
    provider: function () {
        return new HDWalletProvider(mnemonic, arbProviderUrl)
    },
    network_id: '*',
  },
}