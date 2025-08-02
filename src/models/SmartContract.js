const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SmartContract = sequelize.define('SmartContract', {
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
    address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/,
        notEmpty: true,
        customValidator(value) {
          // Permitir endereços especiais para tokens nativos
          if (value === '0x0000000000000000000000000000000000000000') {
            return true;
          }
          // Para outros endereços, validar formato padrão
          if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
            throw new Error('Endereço deve ter formato válido: 0x + 40 caracteres hexadecimais');
          }
        }
      }
    },
    abi: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        customValidator(value) {
          // Permitir array vazio para tokens nativos
          if (Array.isArray(value) && value.length === 0) {
            return true;
          }
          // Para outros casos, validar que não está vazio
          if (!value || (Array.isArray(value) && value.length === 0)) {
            throw new Error('ABI deve conter pelo menos uma função ou evento');
          }
        }
      }
    },
    bytecode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Bytecode do contrato (opcional)'
    },
    network: {
      type: DataTypes.ENUM('mainnet', 'testnet'),
      allowNull: false,
      defaultValue: 'testnet',
      validate: {
        isIn: [['mainnet', 'testnet']]
      }
    },
    contractType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tipo do contrato (ex: ERC20, ERC721, Custom)'
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '1.0.0',
      comment: 'Versão do contrato'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Se o contrato foi verificado no explorer'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },

    adminPublicKey: {
      type: DataTypes.STRING(42),
      allowNull: true,
      comment: 'PublicKey do usuário admin do token',
      field: 'adminPublicKey'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Metadados adicionais do contrato'
    }
  }, {
    tableName: 'smart_contracts',
    timestamps: true,
    indexes: [
      {
        name: 'idx_smart_contracts_address_network',
        unique: true,
        fields: ['address', 'network']
      },
      {
        name: 'idx_smart_contracts_address',
        fields: ['address']
      },
      {
        name: 'idx_smart_contracts_network',
        fields: ['network']
      },
      {
        name: 'idx_smart_contracts_type',
        fields: ['contract_type']
      },
      {
        name: 'idx_smart_contracts_active',
        fields: ['is_active']
      },

    ],
    hooks: {
      beforeCreate: (contract) => {
        // Normalizar endereço para lowercase
        if (contract.address) {
          contract.address = contract.address.toLowerCase();
        }
      },
      beforeUpdate: (contract) => {
        // Normalizar endereço para lowercase
        if (contract.address) {
          contract.address = contract.address.toLowerCase();
        }
      }
    }
  });

  // Método para ocultar campos sensíveis
  SmartContract.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Não retornar bytecode por padrão
    delete values.bytecode;
    return values;
  };

  // Métodos estáticos
  SmartContract.findByAddress = function(address) {
    return this.findOne({
      where: {
        address: address.toLowerCase(),
        isActive: true
      }
    });
  };

  SmartContract.findByNetwork = function(network) {
    return this.findAll({
      where: {
        network,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
  };

  SmartContract.findByType = function(contractType) {
    return this.findAll({
      where: {
        contractType,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
  };

  SmartContract.createContract = function(contractData) {
    return this.create(contractData);
  };

  SmartContract.updateContract = function(address, updateData) {
    return this.update(updateData, {
      where: {
        address: address.toLowerCase(),
        isActive: true
      }
    });
  };

  SmartContract.deactivateContract = function(address) {
    return this.update(
      { isActive: false },
      {
        where: {
          address: address.toLowerCase(),
          isActive: true
        }
      }
    );
  };

  SmartContract.activateContract = function(address) {
    return this.update(
      { isActive: true },
      {
        where: {
          address: address.toLowerCase()
        }
      }
    );
  };

  // Método para validar ABI
  SmartContract.validateABI = function(abi) {
    if (!Array.isArray(abi)) {
      throw new Error('ABI deve ser um array');
    }

    const requiredFields = ['type', 'name'];
    const validTypes = ['function', 'constructor', 'fallback', 'receive', 'event', 'error'];

    for (const item of abi) {
      if (!item.type || !validTypes.includes(item.type)) {
        throw new Error(`Tipo inválido no ABI: ${item.type}`);
      }

      if (item.type === 'function' && !item.name) {
        throw new Error('Funções no ABI devem ter um nome');
      }

      if (item.type === 'event' && !item.name) {
        throw new Error('Eventos no ABI devem ter um nome');
      }
    }

    return true;
  };

  // Método para obter funções do ABI
  SmartContract.prototype.getFunctions = function() {
    if (!this.abi) return [];
    return this.abi.filter(item => item.type === 'function');
  };

  // Método para obter eventos do ABI
  SmartContract.prototype.getEvents = function() {
    if (!this.abi) return [];
    return this.abi.filter(item => item.type === 'event');
  };

  // Método para obter função específica por nome
  SmartContract.prototype.getFunction = function(functionName) {
    if (!this.abi) return null;
    return this.abi.find(item => 
      item.type === 'function' && item.name === functionName
    );
  };

  // Método para obter evento específico por nome
  SmartContract.prototype.getEvent = function(eventName) {
    if (!this.abi) return null;
    return this.abi.find(item => 
      item.type === 'event' && item.name === eventName
    );
  };

  return SmartContract;
}; 