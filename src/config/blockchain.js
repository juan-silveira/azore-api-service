const { ethers } = require('ethers');

class BlockchainConfig {
  constructor() {
    this.networks = {
      mainnet: {
        rpcUrl: process.env.MAINNET_RPC_URL,
        chainId: parseInt(process.env.MAINNET_CHAIN_ID),
        name: 'Azore Mainnet'
      },
      testnet: {
        rpcUrl: process.env.TESTNET_RPC_URL,
        chainId: parseInt(process.env.TESTNET_CHAIN_ID),
        name: 'Azore Testnet'
      }
    };

    this.defaultNetwork = process.env.DEFAULT_NETWORK || 'testnet';
    this.providers = {};
    this.currentProvider = null;
  }

  /**
   * Obtém o provider para uma rede específica
   * @param {string} network - 'mainnet' ou 'testnet'
   * @returns {ethers.Provider} Provider da rede
   */
  getProvider(network = this.defaultNetwork) {
    if (!this.providers[network]) {
      const networkConfig = this.networks[network];
      if (!networkConfig || !networkConfig.rpcUrl) {
        throw new Error(`Configuração inválida para a rede: ${network}`);
      }

      this.providers[network] = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    }

    return this.providers[network];
  }

  /**
   * Obtém o provider padrão
   * @returns {ethers.Provider} Provider padrão
   */
  getDefaultProvider() {
    if (!this.currentProvider) {
      this.currentProvider = this.getProvider(this.defaultNetwork);
    }
    return this.currentProvider;
  }

  /**
   * Obtém informações da rede atual
   * @returns {Object} Informações da rede
   */
  getNetworkInfo() {
    const networkConfig = this.networks[this.defaultNetwork];
    return {
      name: networkConfig.name,
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.rpcUrl,
      defaultNetwork: this.defaultNetwork
    };
  }

  /**
   * Testa a conexão com a blockchain
   * @param {string} network - Rede para testar
   * @returns {Promise<Object>} Resultado do teste
   */
  async testConnection(network = this.defaultNetwork) {
    try {
      const provider = this.getProvider(network);
      const networkInfo = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const feeData = await provider.getFeeData();

      return {
        success: true,
        network: networkInfo.name,
        chainId: Number(networkInfo.chainId),
        blockNumber: blockNumber.toString(),
        gasPrice: feeData.gasPrice ? feeData.gasPrice.toString() : '0',
        rpcUrl: this.networks[network].rpcUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        network: network,
        rpcUrl: this.networks[network].rpcUrl
      };
    }
  }

  /**
   * Obtém o saldo de um endereço
   * @param {string} address - Endereço para consultar
   * @param {string} network - Rede para consultar
   * @returns {Promise<string>} Saldo em wei
   */
  async getBalance(address, network = this.defaultNetwork) {
    try {
      const provider = this.getProvider(network);
      const balance = await provider.getBalance(address);
      return balance.toString();
    } catch (error) {
      throw new Error(`Erro ao consultar saldo: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um bloco
   * @param {number|string} blockNumber - Número do bloco ou 'latest'
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações do bloco
   */
  async getBlock(blockNumber = 'latest', network = this.defaultNetwork) {
    try {
      const provider = this.getProvider(network);
      
      // Converter o número do bloco para o formato correto
      let blockParam = blockNumber;
      if (blockNumber !== 'latest' && blockNumber !== 'earliest' && blockNumber !== 'pending') {
        blockParam = parseInt(blockNumber);
      }
      
      const block = await provider.getBlock(blockParam);
      
      if (!block) {
        throw new Error('Bloco não encontrado');
      }

      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString()
      };
    } catch (error) {
      throw new Error(`Erro ao obter bloco: ${error.message}`);
    }
  }
}

module.exports = new BlockchainConfig(); 