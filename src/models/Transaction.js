const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID do cliente que iniciou a transação',
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID do usuário que iniciou a transação',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    requestLogId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID do log da requisição que gerou a transação',
      references: {
        model: 'request_logs',
        key: 'id'
      }
    },

    contractId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID do contrato envolvido na transação',
      references: {
        model: 'smart_contracts',
        key: 'id'
      }
    },
    network: {
      type: DataTypes.ENUM('mainnet', 'testnet'),
      allowNull: false,
      comment: 'Rede blockchain onde a transação foi executada'
    },
    transactionType: {
      type: DataTypes.ENUM('transfer', 'contract_deploy', 'contract_call', 'contract_read'),
      allowNull: false,
      comment: 'Tipo da transação'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status da transação'
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      unique: true,
      comment: 'Hash da transação na blockchain',
      validate: {
        is: /^0x[a-fA-F0-9]{64}$/
      }
    },
    blockNumber: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Número do bloco onde a transação foi confirmada'
    },
    fromAddress: {
      type: DataTypes.STRING(42),
      allowNull: true,
      comment: 'Endereço de origem da transação',
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/
      }
    },
    toAddress: {
      type: DataTypes.STRING(42),
      allowNull: true,
      comment: 'Endereço de destino da transação',
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/
      }
    },
    value: {
      type: DataTypes.DECIMAL(65, 0),
      allowNull: true,
      comment: 'Valor da transação em Wei'
    },
    gasPrice: {
      type: DataTypes.DECIMAL(65, 0),
      allowNull: true,
      comment: 'Preço do gas em Wei'
    },
    gasLimit: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Limite de gas da transação'
    },
    gasUsed: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Gas utilizado na transação'
    },
    nonce: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nonce da transação'
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dados da transação (input data)'
    },
    functionName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nome da função chamada no contrato'
    },
    functionParams: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Parâmetros da função chamada'
    },
    receipt: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Receipt completo da transação'
    },
    error: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detalhes do erro, se houver'
    },
    confirmations: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Número de confirmações da transação'
    },
    estimatedGas: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Gas estimado para a transação'
    },
    actualGasCost: {
      type: DataTypes.DECIMAL(65, 0),
      allowNull: true,
      comment: 'Custo real do gas em Wei'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora de submissão da transação'
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora de confirmação da transação'
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora de falha da transação'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Metadados adicionais da transação'
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        name: 'idx_transactions_client_id',
        fields: ['client_id']
      },
      {
        name: 'idx_transactions_tx_hash',
        fields: ['tx_hash'],
        unique: true
      },
      {
        name: 'idx_transactions_status',
        fields: ['status']
      },
      {
        name: 'idx_transactions_network',
        fields: ['network']
      },
      {
        name: 'idx_transactions_type',
        fields: ['transaction_type']
      },
      {
        name: 'idx_transactions_from_address',
        fields: ['from_address']
      },
      {
        name: 'idx_transactions_to_address',
        fields: ['to_address']
      },
      {
        name: 'idx_transactions_block_number',
        fields: ['block_number']
      },
      {
        name: 'idx_transactions_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_transactions_confirmed_at',
        fields: ['confirmed_at']
      },
      {
        name: 'idx_transactions_client_status',
        fields: ['client_id', 'status']
      },
      {
        name: 'idx_transactions_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_transactions_network_status',
        fields: ['network', 'status']
      }
    ],
    hooks: {
      beforeCreate: (transaction) => {
        // Validar endereços sem alterar case
        if (transaction.fromAddress) {
          if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.fromAddress)) {
            throw new Error('Endereço de origem inválido');
          }
        }
        if (transaction.toAddress) {
          if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.toAddress)) {
            throw new Error('Endereço de destino inválido');
          }
        }
        
        // Definir submittedAt se não fornecido
        if (!transaction.submittedAt) {
          transaction.submittedAt = new Date();
        }
      },
      beforeUpdate: (transaction) => {
        // Validar endereços sem alterar case
        if (transaction.changed('fromAddress') && transaction.fromAddress) {
          if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.fromAddress)) {
            throw new Error('Endereço de origem inválido');
          }
        }
        if (transaction.changed('toAddress') && transaction.toAddress) {
          if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.toAddress)) {
            throw new Error('Endereço de destino inválido');
          }
        }
        
        // Atualizar timestamps baseado no status
        if (transaction.changed('status')) {
          if (transaction.status === 'confirmed') {
            transaction.confirmedAt = new Date();
          } else if (transaction.status === 'failed') {
            transaction.failedAt = new Date();
          }
        }
      }
    }
  });

  // Associação
  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Client, { foreignKey: 'clientId' });
    Transaction.belongsTo(models.User, { foreignKey: 'userId' });
  };

  // Métodos estáticos
  Transaction.findByTxHash = function(txHash) {
    return this.findOne({
      where: {
        txHash: txHash
      }
    });
  };

  Transaction.findByClientId = function(clientId, options = {}) {
    const { page = 1, limit = 50, status, network, transactionType, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    const where = { clientId };
    
    if (status) where.status = status;
    if (network) where.network = network;
    if (transactionType) where.transactionType = transactionType;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    return this.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  };

  Transaction.findByStatus = function(status, options = {}) {
    const { page = 1, limit = 50, network, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    const where = { status };
    
    if (network) where.network = network;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    return this.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
  };

  Transaction.findPending = function(options = {}) {
    const { network, limit = 100 } = options;
    
    const where = { status: 'pending' };
    if (network) where.network = network;
    
    return this.findAll({
      where,
      limit: parseInt(limit),
      order: [['createdAt', 'ASC']]
    });
  };

  Transaction.getStats = function(options = {}) {
    const { startDate, endDate, clientId, network } = options;
    
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    if (clientId) where.clientId = clientId;
    if (network) where.network = network;
    
    return this.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'confirmed\' THEN 1 END')), 'confirmedCount'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'pending\' THEN 1 END')), 'pendingCount'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = \'failed\' THEN 1 END')), 'failedCount'],
        [sequelize.fn('SUM', sequelize.col('actual_gas_cost')), 'totalGasCost'],
        [sequelize.fn('AVG', sequelize.col('gas_used')), 'avgGasUsed']
      ],
      raw: true
    });
  };

  Transaction.getStatusStats = function(options = {}) {
    const { startDate, endDate, clientId, network } = options;
    
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    if (clientId) where.clientId = clientId;
    if (network) where.network = network;
    
    return this.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };

  Transaction.getTypeStats = function(options = {}) {
    const { startDate, endDate, clientId, network } = options;
    
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    if (clientId) where.clientId = clientId;
    if (network) where.network = network;
    
    return this.findAll({
      where,
      attributes: [
        'transactionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['transactionType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };

  // Métodos de instância
  Transaction.prototype.getFormattedResponse = function() {
    return {
      id: this.id,
      clientId: this.clientId,
      network: this.network,
      transactionType: this.transactionType,
      status: this.status,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      value: this.value,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      gasUsed: this.gasUsed,
      functionName: this.functionName,
      functionParams: this.functionParams,
      confirmations: this.confirmations,
      actualGasCost: this.actualGasCost, // Mantém camelCase para a API
      submittedAt: this.submittedAt,
      confirmedAt: this.confirmedAt,
      failedAt: this.failedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  Transaction.prototype.isConfirmed = function() {
    return this.status === 'confirmed';
  };

  Transaction.prototype.isPending = function() {
    return this.status === 'pending';
  };

  Transaction.prototype.isFailed = function() {
    return this.status === 'failed';
  };

  Transaction.prototype.updateStatus = function(status, additionalData = {}) {
    const updateData = { status, ...additionalData };
    
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'failed') {
      updateData.failedAt = new Date();
    }
    
    return this.update(updateData);
  };

  return Transaction;
}; 