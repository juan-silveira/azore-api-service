const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    rateLimit: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      validate: {
        isValidRateLimit(value) {
          const requiredLimits = ['requestsPerMinute', 'requestsPerHour', 'requestsPerDay'];
          
          for (const limit of requiredLimits) {
            if (typeof value[limit] !== 'number' || value[limit] < 1) {
              throw new Error(`Rate limit '${limit}' deve ser um número maior que 0`);
            }
          }
          
          // Validar hierarquia dos limites
          if (value.requestsPerMinute > value.requestsPerHour) {
            throw new Error('requestsPerMinute não pode ser maior que requestsPerHour');
          }
          
          if (value.requestsPerHour > value.requestsPerDay) {
            throw new Error('requestsPerHour não pode ser maior que requestsPerDay');
          }
        }
      }
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última atividade do cliente'
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    indexes: [
      {
        name: 'idx_clients_active',
        fields: ['is_active']
      },
      {
        name: 'idx_clients_last_activity',
        fields: ['last_activity_at']
      }
    ]
  });

  // Associações
  Client.associate = (models) => {
    if (models.User) {
      Client.hasMany(models.User, { foreignKey: 'clientId', as: 'users' });
    }
    if (models.RequestLog) {
      Client.hasMany(models.RequestLog, { foreignKey: 'clientId' });
    }
    if (models.Transaction) {
      Client.hasMany(models.Transaction, { foreignKey: 'clientId' });
    }
    if (models.Wallet) {
      Client.hasMany(models.Wallet, { foreignKey: 'clientId' });
    }
  };

  // Métodos estáticos
  Client.createClient = function(clientData) {
    return this.create(clientData);
  };

  Client.updateClient = function(id, updateData) {
    return this.update(updateData, {
      where: {
        id,
        isActive: true
      }
    });
  };

  Client.deactivateClient = function(id) {
    return this.update(
      { isActive: false },
      {
        where: {
          id,
          isActive: true
        }
      }
    );
  };

  Client.activateClient = function(id) {
    return this.update(
      { isActive: true },
      {
        where: {
          id
        }
      }
    );
  };

  // Métodos de instância
  Client.prototype.updateLastActivity = function() {
    return this.update({ lastActivityAt: new Date() });
  };

  Client.prototype.getUsageStats = async function() {
    const { User, RequestLog } = sequelize.models;
    
    const userCount = await User.count({
      where: {
        clientId: this.id,
        isActive: true
      }
    });

    const requestCount = await RequestLog.count({
      where: {
        clientId: this.id
      }
    });

    return {
      userCount,
      requestCount,
      lastActivity: this.lastActivityAt
    };
  };

  return Client;
}; 