const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    publicAddress: {
      type: DataTypes.STRING(42), // Endereço Ethereum tem 42 caracteres (0x + 40 hex)
      allowNull: false,
      unique: true,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/, // Validação de endereço Ethereum
        notEmpty: true
      }
    },
    encryptedPrivateKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    externalSystemId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID do usuário no sistema externo'
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID do cliente que criou a carteira (futuro)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última vez que a carteira foi usada'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Metadados adicionais da carteira'
    }
  }, {
    tableName: 'wallets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['public_address']
      },
      {
        fields: ['external_system_id']
      },
      {
        fields: ['client_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: (wallet) => {
        // Garantir que o endereço está em lowercase
        if (wallet.publicAddress) {
          wallet.publicAddress = wallet.publicAddress.toLowerCase();
        }
      },
      beforeUpdate: (wallet) => {
        // Garantir que o endereço está em lowercase
        if (wallet.publicAddress) {
          wallet.publicAddress = wallet.publicAddress.toLowerCase();
        }
      }
    }
  });

  // Métodos de instância
  Wallet.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Nunca retornar a chave privada criptografada
    delete values.encryptedPrivateKey;
    
    return values;
  };

  // Métodos estáticos
  Wallet.findByAddress = function(address) {
    return this.findOne({
      where: {
        publicAddress: address.toLowerCase(),
        isActive: true
      }
    });
  };

  Wallet.findByExternalId = function(externalSystemId) {
    return this.findAll({
      where: {
        externalSystemId,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
  };

  Wallet.findByClientId = function(clientId) {
    return this.findAll({
      where: {
        clientId,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
  };

  Wallet.createWallet = function(walletData) {
    return this.create(walletData);
  };

  Wallet.updateLastUsed = function(address) {
    return this.update(
      { lastUsedAt: new Date() },
      { 
        where: { 
          publicAddress: address.toLowerCase(),
          isActive: true
        }
      }
    );
  };

  Wallet.deactivate = function(address) {
    return this.update(
      { isActive: false },
      { 
        where: { 
          publicAddress: address.toLowerCase()
        }
      }
    );
  };

  Wallet.activate = function(address) {
    return this.update(
      { isActive: true },
      { 
        where: { 
          publicAddress: address.toLowerCase()
        }
      }
    );
  };

  // Validações customizadas
  Wallet.validateAddress = function(address) {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  };

  Wallet.validatePrivateKey = function(privateKey) {
    const privateKeyRegex = /^0x[a-fA-F0-9]{64}$/;
    return privateKeyRegex.test(privateKey);
  };

  // Associação
  Wallet.associate = (models) => {
    Wallet.belongsTo(models.Client, { foreignKey: 'clientId' });
  };

  return Wallet;
}; 