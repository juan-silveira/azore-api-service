const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

const Document = sequelize.define('Document', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Tamanho em bytes'
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Caminho no storage'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL pública do arquivo'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Categoria do documento (general, kyc, contract, etc)'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags para organização'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadados adicionais do arquivo'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se o arquivo é público'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de expiração do arquivo'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de downloads'
  },
  lastDownloaded: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'documents',
  timestamps: true,
  indexes: [
    {
      fields: ['filename'],
      unique: true
    }
  ]
});

// Relacionamentos
Document.associate = (models) => {
  Document.belongsTo(models.Client, {
    foreignKey: 'clientId',
    targetKey: 'id',
    as: 'client',
    onDelete: 'NO ACTION',
    onUpdate: 'CASCADE'
  });
  
  Document.belongsTo(models.User, {
    foreignKey: 'userId',
    targetKey: 'id',
    as: 'user',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
};

  return Document;
}; 