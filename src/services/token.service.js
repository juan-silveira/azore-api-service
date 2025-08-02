const { ethers } = require('ethers');
const axios = require('axios');
const blockchainService = require('./blockchain.service');
const contractService = require('./contract.service');
const transactionService = require('./transaction.service');
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

            // Verificar se o gasPayer tem MINTER_ROLE, se não tiver, conceder
      try {
        console.log('🔍 Verificando se gasPayer tem MINTER_ROLE...');
        const hasMinterRoleResult = await contractService.hasRole(contractAddress, 'minter', clientWalletAddress);
        console.log('🔍 Resultado da verificação MINTER_ROLE:', JSON.stringify(hasMinterRoleResult));

        if (!hasMinterRoleResult.data.hasRole) {
          console.log('🔍 GasPayer não tem MINTER_ROLE, concedendo...');
          await contractService.grantRole(contractAddress, 'minter', clientWalletAddress);
          console.log('✅ MINTER_ROLE concedida com sucesso');
        } else {
          console.log('✅ GasPayer já tem MINTER_ROLE');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/conceder MINTER_ROLE:', error.message);
        // Continuar mesmo com erro na verificação de role
      }

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

      // Registrar transação na tabela
      try {
        await transactionService.recordMintTransaction({
          clientId: options.clientId,
          userId: options.userId,
          contractAddress,
          toAddress,
          amount,
          amountWei: amountWei.toString(),
          gasPayer: clientWalletAddress,
          network,
          txHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          gasPrice: result.data.gasPrice,
          blockNumber: result.data.receipt.blockNumber,
          status: result.data.receipt.status === 1 ? 'confirmed' : 'failed'
        });
        console.log('✅ Transação registrada na tabela com sucesso');
      } catch (error) {
        console.error('❌ Erro ao registrar transação na tabela:', error.message);
        // Não falhar a operação se o registro da transação falhar
      }

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
      console.log('🚀 INICIANDO burnFromToken...');
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

      // Verificar se o gasPayer tem BURNER_ROLE, se não tiver, conceder
      console.log('🔍 INICIANDO VERIFICAÇÃO DE BURNER_ROLE...');
      try {
        console.log('🔍 Verificando se gasPayer tem BURNER_ROLE...');
        console.log('🔍 contractService disponível:', !!contractService);
        console.log('🔍 contractService.hasRole disponível:', !!contractService.hasRole);
        const hasBurnerRoleResult = await contractService.hasRole(contractAddress, 'burner', clientWalletAddress);
        console.log('🔍 Resultado da verificação BURNER_ROLE:', JSON.stringify(hasBurnerRoleResult));
        
        if (!hasBurnerRoleResult.data.hasRole) {
          console.log('🔍 GasPayer não tem BURNER_ROLE, concedendo...');
          await contractService.grantRole(contractAddress, 'burner', clientWalletAddress);
          console.log('✅ BURNER_ROLE concedida com sucesso');
        } else {
          console.log('✅ GasPayer já tem BURNER_ROLE');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/conceder BURNER_ROLE:', error.message);
        console.error('❌ Stack trace:', error.stack);
        // Continuar mesmo com erro na verificação de role
      }
      console.log('🔍 FINALIZANDO VERIFICAÇÃO DE BURNER_ROLE...');

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

      // Registrar transação na tabela
      try {
        await transactionService.recordBurnTransaction({
          clientId: options.clientId,
          userId: options.userId,
          contractAddress,
          fromAddress,
          amount,
          amountWei: amountWei.toString(),
          gasPayer: clientWalletAddress,
          network,
          txHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          gasPrice: result.data.gasPrice,
          blockNumber: result.data.receipt.blockNumber,
          status: result.data.receipt.status === 1 ? 'confirmed' : 'failed'
        });
        console.log('✅ Transação registrada na tabela com sucesso');
      } catch (error) {
        console.error('❌ Erro ao registrar transação na tabela:', error.message);
        // Não falhar a operação se o registro da transação falhar
      }

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

      // Verificar se o gasPayer tem TRANSFER_ROLE, se não tiver, conceder
      try {
        console.log('🔍 Verificando se gasPayer tem TRANSFER_ROLE...');
        const hasTransferRoleResult = await contractService.hasRole(contractAddress, 'transfer', clientWalletAddress);
        console.log('🔍 Resultado da verificação TRANSFER_ROLE:', JSON.stringify(hasTransferRoleResult));
        
        if (!hasTransferRoleResult.data.hasRole) {
          console.log('🔍 GasPayer não tem TRANSFER_ROLE, concedendo...');
          await contractService.grantRole(contractAddress, 'transfer', clientWalletAddress);
          console.log('✅ TRANSFER_ROLE concedida com sucesso');
        } else {
          console.log('✅ GasPayer já tem TRANSFER_ROLE');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/conceder TRANSFER_ROLE:', error.message);
        // Continuar mesmo com erro na verificação de role
      }

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

      // Registrar transação na tabela
      try {
        await transactionService.recordTransferTransaction({
          clientId: options.clientId,
          userId: options.userId,
          contractAddress,
          fromAddress,
          toAddress,
          amount,
          amountWei: amountWei.toString(),
          gasPayer: clientWalletAddress,
          network,
          txHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          gasPrice: result.data.gasPrice,
          blockNumber: result.data.receipt.blockNumber,
          status: result.data.receipt.status === 1 ? 'confirmed' : 'failed'
        });
        console.log('✅ Transação registrada na tabela com sucesso');
      } catch (error) {
        console.error('❌ Erro ao registrar transação na tabela:', error.message);
        // Não falhar a operação se o registro da transação falhar
      }

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
        isActive
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (isActive !== undefined) where.isActive = isActive;
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

      // Buscar informações do contrato no banco (incluindo inativos)
      const contract = await this.SmartContract.findByAddressIncludeInactive(contractAddress);
      
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

      // Buscar e atualizar o contrato diretamente (incluindo inativos)
      const contract = await this.SmartContract.findByAddressIncludeInactive(contractAddress);
      
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