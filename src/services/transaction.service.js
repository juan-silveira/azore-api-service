const { ethers } = require('ethers');
const databaseConfig = require('../config/database');

class TransactionService {
  constructor() {
    this.Transaction = null;
    this.sequelize = null;
  }

  async initialize() {
    this.sequelize = databaseConfig.getSequelize();
    const TransactionModel = require('../models/Transaction');
    this.Transaction = TransactionModel(this.sequelize);
  }

  /**
   * Cria um registro de transação
   */
  async createTransaction(transactionData) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      const transaction = await this.Transaction.create(transactionData);
      return transaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma transação com dados da blockchain
   */
  async updateTransaction(transactionId, updateData) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      const transaction = await this.Transaction.findByPk(transactionId);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      await transaction.update(updateData);
      return transaction;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma transação pelo hash
   */
  async updateTransactionByHash(txHash, updateData) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      const transaction = await this.Transaction.findOne({
        where: { txHash }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      await transaction.update(updateData);
      return transaction;
    } catch (error) {
      console.error('Erro ao atualizar transação por hash:', error.message);
      throw error;
    }
  }

  /**
   * Registra uma transação de mint
   */
  async recordMintTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      toAddress,
      amount,
      amountWei,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'mint',
      functionParams: [toAddress, amountWei],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'mint',
        contractAddress,
        toAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        targetAddress: toAddress,
        amount: amount.toString()
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Registra uma transação de burn
   */
  async recordBurnTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      fromAddress,
      amount,
      amountWei,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'burnFrom',
      functionParams: [fromAddress, amountWei],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'burn',
        contractAddress,
        fromAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        targetAddress: fromAddress,
        amount: amount.toString()
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Registra uma transação de transfer
   */
  async recordTransferTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      fromAddress,
      toAddress,
      amount,
      amountWei,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'transferFromGasless',
      functionParams: [fromAddress, toAddress, amountWei],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'transfer',
        contractAddress,
        fromAddress,
        toAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amount.toString()
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Registra uma transação de grant role
   */
  async recordGrantRoleTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      role,
      targetAddress,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'grantRole',
      functionParams: [role, targetAddress],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'grant_role',
        contractAddress,
        role,
        targetAddress,
        gasPayer
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Registra uma transação de revoke role
   */
  async recordRevokeRoleTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      role,
      targetAddress,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'revokeRole',
      functionParams: [role, targetAddress],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'revoke_role',
        contractAddress,
        role,
        targetAddress,
        gasPayer
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Busca transações por cliente
   */
  async getTransactionsByClient(clientId, options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.findByClientId(clientId, options);
    } catch (error) {
      console.error('Erro ao buscar transações do cliente:', error.message);
      throw error;
    }
  }

  /**
   * Busca transação por hash
   */
  async getTransactionByHash(txHash) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.findByTxHash(txHash);
    } catch (error) {
      console.error('Erro ao buscar transação por hash:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de transações
   */
  async getTransactionStats(options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.getStats(options);
    } catch (error) {
      console.error('Erro ao obter estatísticas de transações:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas por status
   */
  async getStatusStats(options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.getStatusStats(options);
    } catch (error) {
      console.error('Erro ao obter estatísticas por status:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas por tipo
   */
  async getTypeStats(options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.getTypeStats(options);
    } catch (error) {
      console.error('Erro ao obter estatísticas por tipo:', error.message);
      throw error;
    }
  }

  /**
   * Testa o serviço
   */
  async testService() {
    try {
      await this.initialize();
      return {
        success: true,
        message: 'TransactionService inicializado com sucesso',
        data: {
          service: 'TransactionService',
          status: 'ready',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao inicializar TransactionService',
        error: error.message
      };
    }
  }
}

module.exports = new TransactionService(); 