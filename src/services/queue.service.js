const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');
const rabbitMQConfig = require('../config/rabbitmq');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');

class QueueService {
  constructor() {
    this.blockchainService = blockchainService;
    this.transactionService = transactionService;
    this.processingJobs = new Map();
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  /**
   * Inicializa o serviço de fila
   */
  async initialize() {
    try {
      await rabbitMQConfig.connect();
      await this.transactionService.initialize();
      await this.startConsumers();
      console.log('Serviço de fila inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar serviço de fila:', error);
      throw error;
    }
  }

  /**
   * Inicia os consumidores das filas
   */
  async startConsumers() {
    // Consumidor para transações da blockchain
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_TRANSACTIONS,
      this.handleBlockchainTransaction.bind(this)
    );

    // Consumidor para consultas da blockchain
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_QUERIES,
      this.handleBlockchainQuery.bind(this)
    );

    // Consumidor para operações de contratos
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.CONTRACT_OPERATIONS,
      this.handleContractOperation.bind(this)
    );

    // Consumidor para operações de carteira
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.WALLET_OPERATIONS,
      this.handleWalletOperation.bind(this)
    );
  }

  /**
   * Adiciona uma transação da blockchain à fila
   */
  async enqueueBlockchainTransaction(transactionData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'blockchain_transaction',
      data: transactionData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_TRANSACTIONS,
      message,
      { priority: this.getPriority(transactionData.type) }
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Adiciona uma consulta da blockchain à fila
   */
  async enqueueBlockchainQuery(queryData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'blockchain_query',
      data: queryData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_QUERIES,
      message,
      { priority: 1 } // Consultas têm prioridade baixa
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Adiciona uma operação de contrato à fila
   */
  async enqueueContractOperation(operationData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'contract_operation',
      data: operationData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.CONTRACT_OPERATIONS,
      message,
      { priority: this.getPriority(operationData.operation) }
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Adiciona uma operação de carteira à fila
   */
  async enqueueWalletOperation(operationData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'wallet_operation',
      data: operationData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.WALLET_OPERATIONS,
      message,
      { priority: this.getPriority(operationData.operation) }
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Processa transações da blockchain
   */
  async handleBlockchainTransaction(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando transação blockchain: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processBlockchainTransaction(message.data);
      
      // Atualizar status do job
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      // Confirmar processamento
      channel.ack(msg);
      
      console.log(`Transação blockchain processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar transação blockchain ${message.id}:`, error);
      
      // Tentar novamente se não excedeu o limite
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        // Aguardar antes de tentar novamente
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.BLOCKCHAIN_TRANSACTIONS,
            message,
            { priority: 10 } // Alta prioridade para retry
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        // Mover para fila de dead letter
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
        console.error(`Transação blockchain falhou definitivamente: ${message.id}`);
      }
    }
  }

  /**
   * Processa consultas da blockchain
   */
  async handleBlockchainQuery(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando consulta blockchain: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processBlockchainQuery(message.data);
      
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      channel.ack(msg);
      console.log(`Consulta blockchain processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar consulta blockchain ${message.id}:`, error);
      
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.BLOCKCHAIN_QUERIES,
            message
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
      }
    }
  }

  /**
   * Processa operações de contratos
   */
  async handleContractOperation(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando operação de contrato: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processContractOperation(message.data);
      
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      channel.ack(msg);
      console.log(`Operação de contrato processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar operação de contrato ${message.id}:`, error);
      
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.CONTRACT_OPERATIONS,
            message,
            { priority: 10 }
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
      }
    }
  }

  /**
   * Processa operações de carteira
   */
  async handleWalletOperation(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando operação de carteira: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processWalletOperation(message.data);
      
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      channel.ack(msg);
      console.log(`Operação de carteira processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar operação de carteira ${message.id}:`, error);
      
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.WALLET_OPERATIONS,
            message,
            { priority: 10 }
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
      }
    }
  }

  /**
   * Processa uma transação da blockchain
   */
  async processBlockchainTransaction(data) {
    const { type, ...transactionData } = data;
    
    try {
      switch (type) {
        case 'mint':
          return await this.processMintTransaction(transactionData);
        case 'burn':
          return await this.processBurnTransaction(transactionData);
        case 'transfer':
          return await this.processTransferTransaction(transactionData);
        case 'send_transaction':
          return await this.processSendTransaction(transactionData);
        default:
          throw new Error(`Tipo de transação não suportado: ${type}`);
      }
    } catch (error) {
      console.error(`Erro ao processar transação ${type}:`, error);
      throw error;
    }
  }

  /**
   * Processa uma transação de mint
   */
  async processMintTransaction(data) {
    const {
      contractAddress,
      toAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Mint via fila',
      clientId,
      userId
    } = data;

    console.log(`🔄 Processando mint: ${amount} tokens para ${toAddress} no contrato ${contractAddress}`);
    console.log(`📋 Dados da transação: clientId=${clientId}, userId=${userId}`);

    try {
      // Executar o mint usando o serviço de tokens
      const tokenService = require('./token.service');
      
      const result = await tokenService.mintToken(
        contractAddress,
        toAddress,
        amount,
        gasPayer,
        network,
        { description }
      );
      
      console.log(`✅ Mint processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);
      
      // Registrar a transação no banco de dados
      if (result.data?.transactionHash && clientId) {
        try {
          const transactionService = require('./transaction.service');
          
          // Converter amount para wei se necessário
          const amountWei = result.data?.amountWei || ethers.parseUnits(amount, 18).toString();
          
          console.log(`📝 Tentando registrar transação no banco com clientId: ${clientId}`);
          
          await transactionService.recordMintTransaction({
            clientId,
            userId,
            contractAddress,
            toAddress,
            amount,
            amountWei,
            gasPayer,
            network,
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            status: 'confirmed'
          });
          
          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
          console.error(`📋 Dados que causaram erro:`, { clientId, userId, txHash: result.data?.transactionHash });
          // Não falhar o processo se o registro no banco falhar
        }
      } else {
        console.log(`⚠️ Não foi possível registrar no banco: clientId=${clientId}, txHash=${result.data?.transactionHash}`);
      }
      
      return {
        success: true,
        type: 'mint',
        txHash: result.data?.transactionHash,
        data: {
          contractAddress,
          toAddress,
          amount,
          gasPayer,
          network,
          description
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar mint:`, error);
      throw new Error(`Falha no mint: ${error.message}`);
    }
  }

  /**
   * Processa uma transação de burn
   */
  async processBurnTransaction(data) {
    const {
      contractAddress,
      fromAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Burn via fila'
    } = data;

    console.log(`🔄 Processando burn: ${amount} tokens de ${fromAddress} no contrato ${contractAddress}`);

    try {
      const tokenService = require('./token.service');
      
      const burnData = {
        contractAddress,
        fromAddress,
        amount,
        gasPayer,
        network,
        description
      };

      const result = await tokenService.burnFromToken(
        contractAddress,
        fromAddress,
        amount,
        gasPayer,
        network,
        { description }
      );
      
      console.log(`✅ Burn processado com sucesso: ${result.txHash || 'sem hash'}`);
      
      return {
        success: true,
        type: 'burn',
        txHash: result.txHash,
        data: burnData,
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar burn:`, error);
      throw new Error(`Falha no burn: ${error.message}`);
    }
  }

  /**
   * Processa uma transação de transfer
   */
  async processTransferTransaction(data) {
    const {
      contractAddress,
      fromAddress,
      toAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Transfer via fila'
    } = data;

    console.log(`🔄 Processando transfer: ${amount} tokens de ${fromAddress} para ${toAddress}`);

    try {
      const tokenService = require('./token.service');
      
      const transferData = {
        contractAddress,
        fromAddress,
        toAddress,
        amount,
        gasPayer,
        network,
        description
      };

      const result = await tokenService.transferFromGasless(
        contractAddress,
        fromAddress,
        toAddress,
        amount,
        gasPayer,
        network,
        { description }
      );
      
      console.log(`✅ Transfer processado com sucesso: ${result.txHash || 'sem hash'}`);
      
      return {
        success: true,
        type: 'transfer',
        txHash: result.txHash,
        data: transferData,
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar transfer:`, error);
      throw new Error(`Falha no transfer: ${error.message}`);
    }
  }

  /**
   * Processa uma transação de envio
   */
  async processSendTransaction(data) {
    const {
      fromAddress,
      toAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Send via fila'
    } = data;

    console.log(`🔄 Processando send: ${amount} de ${fromAddress} para ${toAddress}`);

    try {
      // Aqui você deve integrar com o serviço de transações existente
      const result = await this.blockchainService.sendTransaction(data);
      
      console.log(`✅ Send processado com sucesso: ${result.txHash || 'sem hash'}`);
      
      return {
        success: true,
        type: 'send_transaction',
        txHash: result.txHash,
        data,
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar send:`, error);
      throw new Error(`Falha no send: ${error.message}`);
    }
  }

  /**
   * Processa uma consulta da blockchain
   */
  async processBlockchainQuery(data) {
    const { queryType, ...queryData } = data;
    
    switch (queryType) {
      case 'get_balance':
        return await this.blockchainService.getBalance(
          queryData.address, 
          queryData.network
        );
      case 'get_transaction':
        return await this.blockchainService.getTransaction(
          queryData.txHash, 
          queryData.network
        );
      case 'get_block':
        return await this.blockchainService.getBlock(
          queryData.blockNumber, 
          queryData.network
        );
      default:
        throw new Error(`Tipo de consulta não suportado: ${queryType}`);
    }
  }

  /**
   * Processa uma operação de contrato
   */
  async processContractOperation(data) {
    // Implementar lógica para operações de contratos
    return { success: true, operation: data.operation };
  }

  /**
   * Processa uma operação de carteira
   */
  async processWalletOperation(data) {
    // Implementar lógica para operações de carteira
    return { success: true, operation: data.operation };
  }

  /**
   * Obtém a prioridade baseada no tipo de operação
   */
  getPriority(operationType) {
    const priorities = {
      'mint': 8,
      'burn': 8,
      'transfer': 6,
      'send_transaction': 5,
      'get_balance': 1,
      'get_transaction': 1,
      'get_block': 1
    };
    
    return priorities[operationType] || 5;
  }

  /**
   * Obtém o status de um job
   */
  getJobStatus(jobId) {
    return this.processingJobs.get(jobId) || { status: 'not_found' };
  }

  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queueName] of Object.entries(rabbitMQConfig.queues)) {
      try {
        stats[name] = await rabbitMQConfig.getQueueStats(queueName);
      } catch (error) {
        stats[name] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * Obtém estatísticas dos jobs em processamento
   */
  getProcessingStats() {
    const stats = {
      total: this.processingJobs.size,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    for (const job of this.processingJobs.values()) {
      stats[job.status]++;
    }
    
    return stats;
  }

  /**
   * Limpa jobs antigos (mais de 1 hora)
   */
  cleanupOldJobs() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [jobId, job] of this.processingJobs.entries()) {
      if (job.endTime && job.endTime < oneHourAgo) {
        this.processingJobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
const queueService = new QueueService();

module.exports = queueService; 