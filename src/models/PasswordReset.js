const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP de onde foi solicitado o reset'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent do navegador'
    }
  }, {
    tableName: 'password_resets',
    timestamps: true,
    indexes: [
      {
        name: 'idx_password_resets_email',
        fields: ['email']
      },
      {
        name: 'idx_password_resets_token_hash',
        fields: ['token_hash'],
        unique: true
      },
      {
        name: 'idx_password_resets_expires_at',
        fields: ['expires_at']
      },
      {
        name: 'idx_password_resets_is_used',
        fields: ['is_used']
      }
    ],
    hooks: {
      beforeCreate: (passwordReset) => {
        // Gerar token se não fornecido
        if (!passwordReset.token) {
          passwordReset.token = crypto.randomBytes(32).toString('hex');
        }
        
        // Gerar hash do token
        passwordReset.tokenHash = crypto.createHash('sha256').update(passwordReset.token).digest('hex');
        
        // Normalizar email
        if (passwordReset.email) {
          passwordReset.email = passwordReset.email.toLowerCase();
        }
      }
    }
  });

  // Associações
  PasswordReset.associate = (models) => {
    // Pode ser associado a Client ou User no futuro
  };

  // Métodos estáticos
  PasswordReset.findByToken = function(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return this.findOne({
      where: {
        tokenHash,
        isUsed: false,
        expiresAt: {
          [this.sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  };

  PasswordReset.findByEmail = function(email) {
    if (!email) {
      return null;
    }
    return this.findAll({
      where: {
        email: email.toLowerCase(),
        isUsed: false,
        expiresAt: {
          [this.sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['createdAt', 'DESC']]
    });
  };

  PasswordReset.createReset = function(email, ipAddress = null, userAgent = null) {
    const expiresAt = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutos
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.create({
      email,
      token,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    });
  };

  PasswordReset.markAsUsed = function(id) {
    return this.update(
      {
        isUsed: true,
        usedAt: new Date()
      },
      {
        where: {
          id,
          isUsed: false
        }
      }
    );
  };

  PasswordReset.invalidateByEmail = function(email) {
    return this.update(
      {
        isUsed: true,
        usedAt: new Date()
      },
      {
        where: {
          email: email.toLowerCase(),
          isUsed: false
        }
      }
    );
  };

  // Métodos de instância
  PasswordReset.prototype.isExpired = function() {
    return new Date() > this.expiresAt;
  };

  PasswordReset.prototype.isValid = function() {
    return !this.isUsed && !this.isExpired();
  };

  // Método para ocultar campos sensíveis
  PasswordReset.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Não retornar token e hash
    delete values.token;
    delete values.tokenHash;
    return values;
  };

  return PasswordReset;
}; 