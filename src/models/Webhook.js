const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

const Webhook = sequelize.define('Webhook', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  events: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de eventos que o webhook deve receber'
  },
  secret: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Secret para assinar as requisições'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Número máximo de tentativas'
  },
  timeout: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30000,
    comment: 'Timeout em milissegundos'
  },
  lastTriggered: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastSuccess: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalTriggers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalSuccess: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  totalErrors: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'webhooks',
  timestamps: true,
  indexes: []
});

// Relacionamentos
Webhook.associate = (models) => {
  Webhook.belongsTo(models.Client, {
    foreignKey: 'clientId',
    targetKey: 'id',
    as: 'client',
    onDelete: 'NO ACTION',
    onUpdate: 'CASCADE'
  });
};

  return Webhook;
}; 