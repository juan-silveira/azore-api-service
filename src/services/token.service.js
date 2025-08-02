const { ethers } = require('ethers');
const axios = require('axios');
const blockchainService = require('./blockchain.service');
const contractService = require('./contract.service');
const databaseConfig = require('../config/database');

class TokenService {
  constructor() {
    this.SmartContract = null;
    this.sequelize = null;
  }

  async initialize() {
    try {
      this.sequelize = await databaseConfig.initialize();
      const SmartContractModel = require('../models/SmartContract');
      this.SmartContract = SmartContractModel(this.sequelize);
      await contractService.initialize();
      console.log('✅ Serviço de tokens inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de tokens:', error.message);
      // Não lançar erro para evitar quebrar a aplicação
      console.log('⚠️ Serviço de tokens inicializado com limitações');
    }
  }

  /**
   * Obtém o saldo de um token ERC20 usando a API do AzoreScan
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} walletAddress - Endereço da carteira
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Saldo do token
   */
  async getTokenBalance(contractAddress, walletAddress, network = 'testnet') {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Endereço da carteira inválido');
      }

      // Determinar URL da API baseada na rede
      const apiUrl = network === 'mainnet' 
        ? 'https://azorescan.com/api'
        : 'https://floripa.azorescan.com/api';

      // Fazer requisição para a API do AzoreScan
      const response = await axios.get(`${apiUrl}`, {
        params: {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: walletAddress
        },
        timeout: 10000
      });

      if (response.data.status === '0') {
        throw new Error(`Erro na API: ${response.data.message}`);
      }

      const balanceWei = response.data.result;
      const balanceEth = ethers.formatUnits(balanceWei, 18);

      return {
        success: true,
        message: 'Saldo do token obtido com sucesso',
        data: {
          contractAddress: contractAddress.toLowerCase(),
          walletAddress: walletAddress.toLowerCase(),
          balanceWei: balanceWei,
          balanceEth: balanceEth,
          network: network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo do token: ${error.message}`);
    }
  }

  /**
   * Executa função mint do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} toAddress - Endereço que receberá os tokens
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} clientWalletAddress - Endereço da carteira do client que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async mintToken(contractAddress, toAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }
      if (!ethers.isAddress(gasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // gasPayer é o endereço do client que paga a transação
      const clientWalletAddress = gasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Executar função mint através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'mint',
        [toAddress, amountWei],
        clientWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      return {
        success: true,
        message: 'Tokens mintados com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          toAddress: toAddress.toLowerCase()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao mintar tokens: ${error.message}`);
    }
  }

  /**
   * Executa função burnFrom do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de onde os tokens serão queimados
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} clientWalletAddress - Endereço da carteira do client que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async burnFromToken(contractAddress, fromAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(gasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // gasPayer é o endereço do client que paga a transação
      const clientWalletAddress = gasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Executar função burnFrom através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'burnFrom',
        [fromAddress, amountWei],
        clientWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      return {
        success: true,
        message: 'Tokens queimados com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          fromAddress: fromAddress.toLowerCase()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao queimar tokens: ${error.message}`);
    }
  }

  /**
   * Executa função transferFromGasless do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de origem
   * @param {string} toAddress - Endereço de destino
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} clientWalletAddress - Endereço da carteira do client que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async transferFromGasless(contractAddress, fromAddress, toAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }
      if (!ethers.isAddress(gasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // gasPayer é o endereço do client que paga a transação
      const clientWalletAddress = gasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Executar função transferFromGasless através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'transferFromGasless',
        [fromAddress, toAddress, amountWei],
        clientWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      return {
        success: true,
        message: 'Transferência sem gás executada com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          fromAddress: fromAddress.toLowerCase(),
          toAddress: toAddress.toLowerCase()
        }
      };
    } catch (error) {
      throw new Error(`Erro na transferência sem gás: ${error.message}`);
    }
  }

  /**
   * Registra um contrato de token no sistema
   */
  async registerToken(tokenData) {
    try {
      const { address, network = 'testnet', adminPublicKey, website, description } = tokenData;

      // Validar endereço
      if (!ethers.isAddress(address)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Validar adminPublicKey
      if (!ethers.isAddress(adminPublicKey)) {
        throw new Error('adminPublicKey inválido');
      }

      // Usar o serviço de contratos para registrar
      const contractData = {
        address,
        network,
        adminPublicKey: adminPublicKey.toLowerCase(),
        contractType: 'ERC20', // Assumindo que todos os tokens registrados são ERC20
        metadata: {
          website,
          description,
          explorer: network === 'mainnet' ? 'https://azorescan.com' : 'https://floripa.azorescan.com'
        }
      };

      const result = await contractService.registerContract(contractData);
      
      return {
        success: true,
        message: 'Token registrado com sucesso',
        data: {
          ...result.data,
          tokenInfo: {
            isUpdate: false, // Será atualizado pelo contractService
            address: address.toLowerCase(),
            network,
            adminPublicKey: adminPublicKey.toLowerCase()
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao registrar token: ${error.message}`);
    }
  }

  /**
   * Lista todos os tokens registrados
   */
  async listTokens(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        network,
        contractType,
        isActive = true
      } = options;

      const offset = (page - 1) * limit;
      const where = { isActive };

      if (network) where.network = network;
      if (contractType) where.contractType = contractType;

      // Buscar tokens diretamente no banco
      const { count, rows } = await this.SmartContract.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Tokens listados com sucesso',
        data: {
          tokens: rows,
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar tokens: ${error.message}`);
    }
  }

  /**
   * Desativa um token
   */
  async deactivateToken(contractAddress) {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar e atualizar o contrato diretamente
      const contract = await this.SmartContract.findByAddress(contractAddress);
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      await contract.update({ isActive: false });
      
      return {
        success: true,
        message: 'Token desativado com sucesso',
        data: {
          address: contractAddress.toLowerCase(),
          isActive: false
        }
      };
    } catch (error) {
      throw new Error(`Erro ao desativar token: ${error.message}`);
    }
  }

  /**
   * Ativa um token
   */
  async activateToken(contractAddress) {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar e atualizar o contrato diretamente (incluindo inativos)
      const contract = await this.SmartContract.findOne({
        where: {
          address: contractAddress.toLowerCase()
        }
      });
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      await contract.update({ isActive: true });
      
      return {
        success: true,
        message: 'Token ativado com sucesso',
        data: {
          address: contractAddress.toLowerCase(),
          isActive: true
        }
      };
    } catch (error) {
      throw new Error(`Erro ao ativar token: ${error.message}`);
    }
  }

  /**
   * Obtém informações básicas do token
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Informações do token
   */
  async getTokenInfo(contractAddress, network = 'testnet') {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar informações do contrato no banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter informações da blockchain
      const provider = blockchainService.config.getProvider(network);
      const contractInstance = new ethers.Contract(contractAddress, contract.abi, provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contractInstance.name(),
        contractInstance.symbol(),
        contractInstance.decimals(),
        contractInstance.totalSupply()
      ]);
      
      return {
        success: true,
        message: 'Informações do token obtidas com sucesso',
        data: {
          address: contractAddress.toLowerCase(),
          name,
          symbol,
          decimals: decimals.toString(),
          totalSupply: totalSupply.toString(),
          network: network,
          contractType: contract.contractType,
          isActive: contract.isActive,
          metadata: contract.metadata
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do token: ${error.message}`);
    }
  }

  /**
   * Atualiza informações do token
   */
  async updateTokenInfo(contractAddress, metadata) {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar e atualizar o contrato diretamente
      const contract = await this.SmartContract.findByAddress(contractAddress);
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Atualizar metadados
      const updatedMetadata = {
        ...contract.metadata,
        ...metadata
      };

      await contract.update({ metadata: updatedMetadata });
      
      return {
        success: true,
        message: 'Informações do token atualizadas com sucesso',
        data: {
          address: contractAddress.toLowerCase(),
          metadata: updatedMetadata
        }
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar informações do token: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo da moeda nativa AZE
   * @param {string} walletAddress - Endereço da carteira
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Saldo da moeda AZE
   */
  async getAzeBalance(walletAddress, network = 'testnet') {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Endereço da carteira inválido');
      }
      // Obter provider da rede
      const provider = blockchainService.config.getProvider(network);
      // Consultar saldo
      const balanceWei = await provider.getBalance(walletAddress);
      const balanceEth = ethers.formatUnits(balanceWei, 18);
      return {
        success: true,
        message: 'Saldo da moeda AZE obtido com sucesso',
        data: {
          walletAddress: walletAddress.toLowerCase(),
          balanceWei: balanceWei.toString(),
          balanceEth: balanceEth,
          network: network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo da moeda AZE: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de tokens
   * @returns {Promise<Object>} Resultado do teste
   */
  async testService() {
    try {
      // Token de teste na testnet
      const testTokenAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
      const testWalletAddress = '0x95aDDd264023038D7Aa77B0974Ef3C4dc43E3bd6';

      // Teste básico de conectividade
      const balanceTest = await this.getTokenBalance(testTokenAddress, testWalletAddress, 'testnet');

      return {
        success: true,
        message: 'Teste do serviço de tokens realizado com sucesso',
        data: {
          balanceTest: balanceTest.success,
          testTokenAddress,
          testWalletAddress,
          serviceStatus: 'operational'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de tokens',
        error: error.message,
        data: {
          serviceStatus: 'error',
          error: error.message
        }
      };
    }
  }
}

module.exports = new TokenService(); 