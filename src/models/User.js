const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    cpf: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [11, 14]
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [10, 20]
      }
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'public_key',
      validate: {
        notEmpty: true
      }
    },
    privateKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'private_key',
      validate: {
        notEmpty: true
      }
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      validate: {
        notEmpty: true
      }
    },
    // Campos de autenticação
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255]
      }
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data da última alteração de senha'
    },
    isFirstAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Indica se é o primeiro acesso (precisa trocar senha)'
    },
    sessionToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      comment: 'Token da sessão ativa'
    },
    sessionExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de expiração da sessão'
    },
    sessionTimeout: {
      type: DataTypes.INTEGER,
      defaultValue: 600, // 10 minutos em segundos
      allowNull: false,
      comment: 'Timeout da sessão em segundos (0 = sem expiração)'
    },
    // Roles
    isApiAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Indica se o usuário tem permissões de API_ADMIN'
    },
    isClientAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Indica se o usuário tem permissões de CLIENT_ADMIN'
    },
    roles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array de roles do usuário (API_ADMIN, CLIENT_ADMIN)',
      validate: {
        isValidRoles(value) {
          if (!Array.isArray(value)) {
            throw new Error('roles deve ser um array');
          }
          
          const validRoles = ['API_ADMIN', 'CLIENT_ADMIN'];
          for (const role of value) {
            if (!validRoles.includes(role)) {
              throw new Error(`Role '${role}' não é válida. Roles válidas: ${validRoles.join(', ')}`);
            }
          }
        }
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        wallets: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        contracts: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        transactions: {
          create: true,
          read: true,
          update: false,
          delete: false
        },
        admin: {
          fullAccess: false,
          clients: {
            read: false,
            create: false,
            update: false,
            delete: false
          },
          users: {
            read: false,
            create: false,
            update: false,
            delete: false
          }
        }
      },
      validate: {
        isValidPermissions(value) {
          const requiredSections = ['wallets', 'contracts', 'transactions'];
          const requiredPermissions = ['create', 'read', 'update', 'delete'];
          
          for (const section of requiredSections) {
            if (!value[section]) {
              throw new Error(`Seção '${section}' é obrigatória nas permissões`);
            }
            
            for (const permission of requiredPermissions) {
              if (typeof value[section][permission] !== 'boolean') {
                throw new Error(`Permissão '${permission}' na seção '${section}' deve ser um boolean`);
              }
            }
          }

          // Validar permissões de admin se existirem
          if (value.admin) {
            if (typeof value.admin.fullAccess !== 'boolean') {
              throw new Error('Permissão admin.fullAccess deve ser um boolean');
            }

            const adminSections = ['clients', 'users'];
            for (const section of adminSections) {
              if (value.admin[section]) {
                for (const permission of requiredPermissions) {
                  if (typeof value.admin[section][permission] !== 'boolean') {
                    throw new Error(`Permissão admin.${section}.${permission} deve ser um boolean`);
                  }
                }
              }
            }
          }
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Metadados adicionais do usuário'
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última atividade do usuário'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        name: 'idx_users_email',
        fields: ['email']
      },
      {
        name: 'idx_users_cpf',
        fields: ['cpf'],
        unique: true
      },
      {
        name: 'idx_users_client_id',
        fields: ['client_id']
      },
      {
        name: 'idx_users_active',
        fields: ['is_active']
      },
      {
        name: 'idx_users_last_activity',
        fields: ['last_activity_at']
      }
    ],
    hooks: {
      beforeCreate: (user) => {
        // Normalizar email
        if (user.email) {
          user.email = user.email.toLowerCase();
        }
        
        // Normalizar CPF (remover pontos e traços)
        if (user.cpf) {
          user.cpf = user.cpf.replace(/[.-]/g, '');
        }
        
        // Normalizar telefone (remover caracteres especiais)
        if (user.phone) {
          user.phone = user.phone.replace(/[^\d]/g, '');
        }
      },
      beforeUpdate: (user) => {
        // Normalizar email se alterado
        if (user.email && user.changed && user.changed('email')) {
          user.email = user.email.toLowerCase();
        }
        
        // Normalizar CPF se alterado
        if (user.cpf && user.changed && user.changed('cpf')) {
          user.cpf = user.cpf.replace(/[.-]/g, '');
        }
        
        // Normalizar telefone se alterado
        if (user.phone && user.changed && user.changed('phone')) {
          user.phone = user.phone.replace(/[^\d]/g, '');
        }
      }
    }
  });

  // Associações
  User.associate = (models) => {
    User.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    if (models.Wallet) {
      User.hasMany(models.Wallet, { foreignKey: 'userId' });
    }
    if (models.Transaction) {
      User.hasMany(models.Transaction, { foreignKey: 'userId' });
    }
    if (models.ApiKey) {
      User.hasMany(models.ApiKey, { foreignKey: 'userId', as: 'apiKeys' });
    }
  };

  // Hooks para criptografia de senha
  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await user.hashPassword(user.password);
      user.passwordChangedAt = new Date();
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await user.hashPassword(user.password);
      user.passwordChangedAt = new Date();
    }
  });

  // Método para ocultar campos sensíveis
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Não retornar chave privada e senha por padrão
    delete values.privateKey;
    delete values.password;
    return values;
  };

  // Método para retornar dados completos incluindo chave privada
  User.prototype.toJSONWithPrivateKey = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  // Métodos estáticos
  User.findByEmail = function(email) {
    if (!email) {
      return null;
    }
    return this.findOne({
      where: {
        email: email.toLowerCase()
      },
      include: ['client']
    });
  };

  User.findByCpf = function(cpf) {
    if (!cpf) {
      return null;
    }
    const normalizedCpf = cpf.replace(/[.-]/g, '');
    return this.findOne({
      where: {
        cpf: normalizedCpf
      },
      include: ['client']
    });
  };

  User.findByPublicKey = function(publicKey) {
    if (!publicKey) {
      return null;
    }
    return this.findOne({
      where: {
        publicKey: publicKey
      },
      include: ['client']
    });
  };

  User.findByClientId = function(clientId) {
    return this.findAll({
      where: {
        clientId,
        isActive: true
      },
      include: ['client']
    });
  };

  User.createUser = function(userData) {
    return this.create(userData);
  };

  User.updateUser = function(id, updateData) {
    return this.update(updateData, {
      where: {
        id,
        isActive: true
      }
    });
  };

  User.deactivateUser = function(id) {
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

  User.activateUser = function(id) {
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
  User.prototype.updateLastActivity = function() {
    return this.update({ lastActivityAt: new Date() });
  };

  User.prototype.getUsageStats = async function() {
    const { Wallet, Transaction } = sequelize.models;
    
    const walletCount = await Wallet.count({
      where: {
        userId: this.id
      }
    });

    const transactionCount = await Transaction.count({
      where: {
        userId: this.id
      }
    });

    return {
      wallets: walletCount,
      transactions: transactionCount,
      lastActivity: this.lastActivityAt
    };
  };

  // Métodos para gerenciar roles
  User.prototype.hasRole = function(role) {
    return this.roles.includes(role);
  };

  User.prototype.hasAnyRole = function(roles) {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    return this.roles.some(role => roles.includes(role));
  };

  User.prototype.addRole = function(role) {
    if (!this.roles.includes(role)) {
      this.roles.push(role);
      this.isApiAdmin = this.roles.includes('API_ADMIN');
      this.isClientAdmin = this.roles.includes('CLIENT_ADMIN');
      return this.save();
    }
    return Promise.resolve(this);
  };

  User.prototype.removeRole = function(role) {
    const index = this.roles.indexOf(role);
    if (index > -1) {
      this.roles.splice(index, 1);
      this.isApiAdmin = this.roles.includes('API_ADMIN');
      this.isClientAdmin = this.roles.includes('CLIENT_ADMIN');
      return this.save();
    }
    return Promise.resolve(this);
  };

  User.prototype.setRoles = function(roles) {
    this.roles = roles;
    this.isApiAdmin = this.roles.includes('API_ADMIN');
    this.isClientAdmin = this.roles.includes('CLIENT_ADMIN');
    return this.save();
  };

  // Métodos para verificar permissões baseadas em roles
  User.prototype.isApiAdminUser = function() {
    return this.isApiAdmin || this.roles.includes('API_ADMIN');
  };

  User.prototype.isClientAdminUser = function() {
    return this.isClientAdmin || this.roles.includes('CLIENT_ADMIN');
  };

  User.prototype.canManageApiKeys = function() {
    return this.isApiAdminUser() || this.isClientAdminUser();
  };

  User.prototype.canAccessAdminRoutes = function() {
    return this.isApiAdminUser();
  };

  User.prototype.canAccessClientAdminRoutes = function() {
    return this.isApiAdminUser() || this.isClientAdminUser();
  };

  User.prototype.hasPermission = function(resource, action) {
    if (!this.permissions || !this.permissions[resource]) {
      return false;
    }
    
    return this.permissions[resource][action] === true;
  };

  // Métodos de autenticação
  User.prototype.hashPassword = async function(password) {
    return crypto.pbkdf2Sync(password, this.email, 10000, 64, 'sha512').toString('hex');
  };

  User.prototype.verifyPassword = async function(password) {
    const hashedPassword = await this.hashPassword(password);
    return this.password === hashedPassword;
  };

  User.prototype.generateSessionToken = function() {
    return crypto.randomBytes(32).toString('hex');
  };

  User.prototype.createSession = function() {
    const token = this.generateSessionToken();
    const expiresAt = this.sessionTimeout > 0 
      ? new Date(Date.now() + (this.sessionTimeout * 1000))
      : null;
    
    this.sessionToken = token;
    this.sessionExpiresAt = expiresAt;
    return this.save();
  };

  User.prototype.refreshSession = function() {
    if (this.sessionTimeout > 0) {
      this.sessionExpiresAt = new Date(Date.now() + (this.sessionTimeout * 1000));
      return this.save();
    }
    return Promise.resolve(this);
  };

  User.prototype.invalidateSession = function() {
    this.sessionToken = null;
    this.sessionExpiresAt = null;
    return this.save();
  };

  User.prototype.isSessionValid = function() {
    if (!this.sessionToken || !this.sessionExpiresAt) {
      return false;
    }
    return new Date() < this.sessionExpiresAt;
  };

  // Métodos estáticos de autenticação
  User.authenticate = async function(email, password) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }
    
    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      return null;
    }
    
    return user;
  };

  User.findBySessionToken = function(sessionToken) {
    return this.findOne({
      where: {
        sessionToken: sessionToken,
        isActive: true
      },
      include: ['client']
    });
  };

  return User;
}; 