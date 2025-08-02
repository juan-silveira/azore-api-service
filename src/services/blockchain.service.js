const { ethers } = require('ethers');
const blockchainConfig = require('../config/blockchain');

class BlockchainService {
  constructor() {
    this.config = blockchainConfig;
  }

  /**
   * Testa a conexão com a blockchain
   * @param {string} network - Rede para testar
   * @returns {Promise<Object>} Resultado do teste
   */
  async testConnection(network) {
    return await this.config.testConnection(network);
  }

  /**
   * Obtém informações da rede atual
   * @returns {Object} Informações da rede
   */
  getNetworkInfo() {
    return this.config.getNetworkInfo();
  }

  /**
   * Obtém o saldo de um endereço
   * @param {string} address - Endereço para consultar
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Saldo formatado
   */
  async getBalance(address, network) {
    try {
      // Validar endereço
      if (!ethers.isAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const balanceWei = await this.config.getBalance(address, network);
      const balanceEth = ethers.formatEther(balanceWei);

      return {
        address: address,
        balanceWei: balanceWei,
        balanceEth: balanceEth,
        network: network || this.config.defaultNetwork
      };
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
  async getBlock(blockNumber, network) {
    try {
      const block = await this.config.getBlock(blockNumber, network);
      return {
        ...block,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter bloco: ${error.message}`);
    }
  }

  /**
   * Obtém informações de uma transação
   * @param {string} txHash - Hash da transação
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações da transação
   */
  async getTransaction(txHash, network) {
    try {
      const provider = this.config.getProvider(network);
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        throw new Error('Transação não encontrada');
      }

      const receipt = await provider.getTransactionReceipt(txHash);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        valueEth: ethers.formatEther(tx.value),
        gasPrice: tx.gasPrice.toString(),
        gasLimit: tx.gasLimit.toString(),
        nonce: tx.nonce,
        data: tx.data,
        blockNumber: tx.blockNumber,
        confirmations: tx.confirmations,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        gasUsed: receipt ? receipt.gasUsed.toString() : null,
        effectiveGasPrice: receipt ? receipt.effectiveGasPrice.toString() : null,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter transação: ${error.message}`);
    }
  }

  /**
   * Obtém o preço atual do gás
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Preço do gás
   */
  async getGasPrice(network) {
    try {
      const provider = this.config.getProvider(network);
      const feeData = await provider.getFeeData();
      
      return {
        gasPriceWei: feeData.gasPrice ? feeData.gasPrice.toString() : '0',
        gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
        maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toString() : null,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter preço do gás: ${error.message}`);
    }
  }

  /**
   * Obtém informações da rede
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações da rede
   */
  async getNetwork(network) {
    try {
      const provider = this.config.getProvider(network);
      const networkInfo = await provider.getNetwork();
      
      return {
        name: networkInfo.name,
        chainId: Number(networkInfo.chainId),
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações da rede: ${error.message}`);
    }
  }

  /**
   * Valida se um endereço é válido
   * @param {string} address - Endereço para validar
   * @returns {boolean} True se válido
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Converte um valor de ETH para Wei
   * @param {string|number} ethValue - Valor em ETH
   * @returns {string} Valor em Wei
   */
  ethToWei(ethValue) {
    return ethers.parseEther(ethValue.toString()).toString();
  }

  /**
   * Converte um valor de Wei para ETH
   * @param {string|number} weiValue - Valor em Wei
   * @returns {string} Valor em ETH
   */
  weiToEth(weiValue) {
    return ethers.formatEther(weiValue.toString());
  }
}

module.exports = new BlockchainService(); 