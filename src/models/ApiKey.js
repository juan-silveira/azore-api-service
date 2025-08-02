const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApiKey = sequelize.define('ApiKey', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      validate: {
        len: [64, 64]
      }
    },
    keyHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'api_keys',
    timestamps: true,
    underscored: true
  });

  ApiKey.associate = (models) => {
    if (models.User) {
      ApiKey.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  // Método para ocultar campos sensíveis
  ApiKey.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Não retornar a chave real, apenas o hash
    delete values.key;
    delete values.keyHash;
    return values;
  };

  // Método estático para encontrar por hash da chave
  ApiKey.findByKeyHash = function(keyHash) {
    return this.findOne({
      where: {
        keyHash,
        isActive: true
      },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        where: { isActive: true },
        include: [{
          model: sequelize.models.Client,
          as: 'client',
          where: { isActive: true }
        }]
      }]
    });
  };

  return ApiKey;
}; 