const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const RequestLog = sequelize.define('RequestLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID do cliente que fez a requisição (null para rotas públicas)',
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['GET', 'POST', 'PUT', 'DELETE', 'PATCH']]
      }
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    query: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Parâmetros da query string'
    },
    body: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Corpo da requisição (filtrado para dados sensíveis)'
    },
    headers: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Headers da requisição (filtrado para dados sensíveis)'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Endereço IP do cliente'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'User-Agent do cliente'
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 100,
        max: 599
      }
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tempo de resposta em milissegundos',
      validate: {
        min: 0
      }
    },
    responseSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tamanho da resposta em bytes',
      validate: {
        min: 0
      }
    },
    error: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detalhes do erro, se houver'
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo de recurso acessado (wallets, contracts, etc.)'
    },
    resourceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID do recurso acessado'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Ação realizada (create, read, update, delete)'
    },
    network: {
      type: DataTypes.ENUM('mainnet', 'testnet'),
      allowNull: true,
      comment: 'Rede blockchain utilizada'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Metadados adicionais da requisição'
    }
  }, {
    tableName: 'request_logs',
    timestamps: true,
    indexes: [
      {
        name: 'idx_request_logs_client_id',
        fields: ['client_id']
      },
      {
        name: 'idx_request_logs_method',
        fields: ['method']
      },
      {
        name: 'idx_request_logs_path',
        fields: ['path']
      },
      {
        name: 'idx_request_logs_status_code',
        fields: ['status_code']
      },
      {
        name: 'idx_request_logs_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_request_logs_resource_type',
        fields: ['resource_type']
      },
      {
        name: 'idx_request_logs_network',
        fields: ['network']
      },
      {
        name: 'idx_request_logs_client_created',
        fields: ['client_id', 'created_at']
      },
      {
        name: 'idx_request_logs_status_created',
        fields: ['status_code', 'created_at']
      }
    ],
    hooks: {
      beforeCreate: (log) => {
        // Filtrar dados sensíveis do body
        if (log.body) {
          const sensitiveFields = ['password', 'privateKey', 'apiKey', 'secret', 'token'];
          const filteredBody = { ...log.body };
          
          sensitiveFields.forEach(field => {
            if (filteredBody[field]) {
              filteredBody[field] = '[REDACTED]';
            }
          });
          
          log.body = filteredBody;
        }
        
        // Filtrar dados sensíveis dos headers
        if (log.headers) {
          const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
          const filteredHeaders = { ...log.headers };
          
          sensitiveHeaders.forEach(header => {
            if (filteredHeaders[header]) {
              filteredHeaders[header] = '[REDACTED]';
            }
          });
          
          log.headers = filteredHeaders;
        }
        
        // Determinar resourceType e action baseado no path
        if (log.path) {
          const pathParts = log.path.split('/').filter(part => part);
          
          if (pathParts.length >= 3 && pathParts[1] === 'api') {
            log.resourceType = pathParts[2]; // wallets, contracts, etc.
            
            // Determinar ação baseada no método e path
            if (log.method === 'GET') {
              if (pathParts.length === 3) {
                log.action = 'list';
              } else {
                log.action = 'read';
              }
            } else if (log.method === 'POST') {
              log.action = 'create';
            } else if (log.method === 'PUT') {
              log.action = 'update';
            } else if (log.method === 'DELETE') {
              log.action = 'delete';
            } else if (log.method === 'PATCH') {
              log.action = 'update';
            }
          }
        }
      }
    }
  });

  // Associação
  RequestLog.associate = (models) => {
    RequestLog.belongsTo(models.Client, { foreignKey: 'clientId' });
  };

  // Métodos estáticos
  RequestLog.findByClientId = function(clientId, options = {}) {
    const { page = 1, limit = 50, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    const where = { clientId };
    
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

  RequestLog.findByResourceType = function(resourceType, options = {}) {
    const { page = 1, limit = 50, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    const where = { resourceType };
    
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

  RequestLog.findErrors = function(options = {}) {
    const { page = 1, limit = 50, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    const where = {
      statusCode: { [sequelize.Op.gte]: 400 }
    };
    
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

  RequestLog.getStats = function(options = {}) {
    const { startDate, endDate, clientId, resourceType } = options;
    
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    if (clientId) where.clientId = clientId;
    if (resourceType) where.resourceType = resourceType;
    
    return this.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRequests'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avgResponseTime'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 400 THEN 1 ELSE NULL END')), 'errorCount'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code < 400 THEN 1 ELSE NULL END')), 'successCount']
      ],
      raw: true
    });
  };

  RequestLog.getMethodStats = function(options = {}) {
    const { startDate, endDate, clientId } = options;
    
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    if (clientId) where.clientId = clientId;
    
    return this.findAll({
      where,
      attributes: [
        'method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['method'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };

  RequestLog.getResourceTypeStats = function(options = {}) {
    const { startDate, endDate, clientId } = options;
    
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.$gte = new Date(startDate);
      if (endDate) where.createdAt.$lte = new Date(endDate);
    }
    
    if (clientId) where.clientId = clientId;
    
    return this.findAll({
      where,
      attributes: [
        'resourceType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['resourceType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };

  // Métodos de instância
  RequestLog.prototype.getFormattedResponse = function() {
    return {
      id: this.id,
      clientId: this.clientId,
      method: this.method,
      path: this.path,
      statusCode: this.statusCode,
      responseTime: this.responseTime,
      resourceType: this.resourceType,
      action: this.action,
      network: this.network,
      createdAt: this.createdAt,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent
    };
  };

  return RequestLog;
}; 