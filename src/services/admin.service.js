const crypto = require('crypto');

// Função para obter o modelo User inicializado
const getUserModel = () => {
  if (!global.models || !global.models.User) {
    throw new Error('Modelo User não está disponível. Verifique se os modelos foram inicializados.');
  }
  return global.models.User;
};

// Função para obter o modelo Client inicializado
const getClientModel = () => {
  if (!global.models || !global.models.Client) {
    throw new Error('Modelo Client não está disponível. Verifique se os modelos foram inicializados.');
  }
  return global.models.Client;
};

// Função para obter configurações do admin padrão
const getDefaultAdminConfig = () => {
  return {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@azore.technology',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'azore@admin123',
    name: process.env.DEFAULT_ADMIN_NAME || 'Admin',
    cpf: process.env.DEFAULT_ADMIN_CPF || '00000000000',
    phone: process.env.DEFAULT_ADMIN_PHONE || '11999999999',
    birthDate: process.env.DEFAULT_ADMIN_BIRTH_DATE || '1990-01-01',
    publicKey: process.env.DEFAULT_ADMIN_PUBLIC_KEY,
    privateKey: process.env.DEFAULT_ADMIN_PRIVATE_KEY
  };
};

// Função para obter configurações do client padrão
const getDefaultClientConfig = () => {
  return {
    name: process.env.DEFAULT_CLIENT_NAME || 'Azore',
    rateLimit: {
      requestsPerMinute: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_MINUTE) || 1000,
      requestsPerHour: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_HOUR) || 10000,
      requestsPerDay: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_DAY) || 100000
    }
  };
};

/**
 * Serviço para gerenciamento do client admin padrão
 */
class AdminService {
  /**
   * Inicializa ou atualiza o client admin padrão
   */
  static async initializeDefaultAdmin() {
    try {
      const adminConfig = getDefaultAdminConfig();
      const clientConfig = getDefaultClientConfig();
      
      const User = getUserModel();
      const Client = getClientModel();
      
      // Verificar se o usuário admin já existe
      let adminUser = await User.findByEmail(adminConfig.email);
      
      if (adminUser) {
        console.log('Usuário admin já existe, atualizando senha...');
        
        // Atualizar senha
        adminUser.password = adminConfig.password;
        adminUser.isFirstAccess = true;
        await adminUser.save();
        
        console.log('Senha do usuário admin atualizada com sucesso');
      } else {
        console.log('Criando usuário admin padrão...');
        
        // Primeiro, criar ou obter o client padrão
        let defaultClient = await Client.findOne({
          where: { name: clientConfig.name }
        });
        
        if (!defaultClient) {
          defaultClient = await Client.create({
            name: clientConfig.name,
            isActive: true,
            rateLimit: clientConfig.rateLimit
          });
        }
        
        // Verificar se as chaves estão definidas no .env
        let publicKey, privateKey;
        
        if (adminConfig.publicKey && adminConfig.privateKey) {
          // Usar chaves definidas no .env
          publicKey = adminConfig.publicKey;
          privateKey = adminConfig.privateKey;
          console.log('Usando chaves definidas no .env para o admin padrão');
        } else {
          // Gerar par de chaves Ethereum automaticamente
          const { ethers } = require('ethers');
          const wallet = ethers.Wallet.createRandom();
          publicKey = wallet.address;
          privateKey = wallet.privateKey;
          console.log('Gerando chaves automáticas para o admin padrão');
        }
        
        // Criar usuário admin
        adminUser = await User.create({
          name: adminConfig.name,
          email: adminConfig.email,
          cpf: adminConfig.cpf, // CPF padrão para o admin
          phone: adminConfig.phone,
          birthDate: adminConfig.birthDate,
          publicKey: publicKey,
          privateKey: privateKey,
          clientId: defaultClient.id,
          password: adminConfig.password,
          isFirstAccess: true,
          isApiAdmin: true,
          isClientAdmin: true,
          roles: ['API_ADMIN', 'CLIENT_ADMIN'],
          permissions: {

            contracts: {
              create: true,
              read: true,
              update: true,
              delete: true
            },
            transactions: {
              create: true,
              read: true,
              update: true,
              delete: true
            },
            admin: {
              fullAccess: true,
              clients: {
                read: true,
                create: true,
                update: true,
                delete: true
              },
              users: {
                read: true,
                create: true,
                update: true,
                delete: true
              }
            }
          },
          isActive: true
        });
        
        console.log('Usuário admin criado com sucesso');
      }
      
      return {
        success: true,
        message: 'Usuário admin inicializado com sucesso',
        data: {
          id: adminUser.id,
          email: adminUser.email,
          isFirstAccess: adminUser.isFirstAccess
        }
      };
    } catch (error) {
      console.error('Erro ao inicializar usuário admin:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário admin existe
   */
  static async checkAdminExists() {
    try {
      const User = getUserModel();
      const adminConfig = getDefaultAdminConfig();
      const adminUser = await User.findByEmail(adminConfig.email);
      return {
        exists: !!adminUser,
        isFirstAccess: adminUser ? adminUser.isFirstAccess : false,
        hasApiKey: adminUser ? !!adminUser.apiKey : false
      };
    } catch (error) {
      console.error('Erro ao verificar usuário admin:', error);
      throw error;
    }
  }

  /**
   * Reseta a senha do usuário admin
   */
  static async resetAdminPassword() {
    try {
      const User = getUserModel();
      const adminConfig = getDefaultAdminConfig();
      const adminUser = await User.findByEmail(adminConfig.email);
      
      if (!adminUser) {
        throw new Error('Usuário admin não encontrado');
      }
      
      adminUser.password = adminConfig.password;
      adminUser.isFirstAccess = true;
      await adminUser.save();
      
      return {
        success: true,
        message: 'Senha do usuário admin resetada com sucesso',
        data: {
          email: adminUser.email,
          isFirstAccess: true
        }
      };
    } catch (error) {
      console.error('Erro ao resetar senha do usuário admin:', error);
      throw error;
    }
  }
}

module.exports = AdminService; 