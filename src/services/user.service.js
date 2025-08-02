const databaseConfig = require('../config/database');
const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Serviço para gerenciamento de usuários
 */
class UserService {
  constructor() {
    this.sequelize = null;
    this.User = null;
    this.Client = null;
  }

  /**
   * Inicializa o serviço de usuários
   */
  async init() {
    try {
      // Usar os modelos globais se disponíveis
      if (global.models) {
        this.sequelize = global.sequelize;
        this.User = global.models.User;
        this.Client = global.models.Client;
      } else {
        // Fallback para inicialização local
        this.sequelize = await databaseConfig.initialize();
        const UserModel = require('../models/User');
        const ClientModel = require('../models/Client');
        
        this.User = UserModel(this.sequelize);
        this.Client = ClientModel(this.sequelize);
      }
      
      console.log('✅ Serviço de usuários inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de usuários:', error.message);
      throw error;
    }
  }

  /**
   * Cria um novo usuário
   */
  async createUser(userData, clientId) {
    await this.init();
    
    try {
      // Normalizar dados
      const normalizedData = {
        ...userData,
        email: userData.email.toLowerCase(),
        cpf: userData.cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
        phone: userData.phone ? userData.phone.replace(/\D/g, '') : null,
        clientId: clientId
      };

      // Verificar se email já existe
      const existingEmail = await this.User.findOne({
        where: { 
          email: normalizedData.email,
          isActive: true
        }
      });

      if (existingEmail) {
        throw new Error('Email já está em uso');
      }

      // Verificar se CPF já existe
      const existingCpf = await this.User.findOne({
        where: { 
          cpf: normalizedData.cpf,
          isActive: true
        }
      });

      if (existingCpf) {
        throw new Error('CPF já está em uso');
      }

      // Gerar chaves públicas e privadas usando ethers
      const wallet = ethers.Wallet.createRandom();
      const publicKey = wallet.address;
      const privateKey = wallet.privateKey;

      // Criar usuário com as chaves geradas
      const user = await this.User.create({
        ...normalizedData,
        publicKey,
        privateKey,
        isActive: true
      });

      // Processar roles e atualizar flags se roles foram fornecidas
      if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
        await user.setRoles(userData.roles);
      }

      return {
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          birthDate: user.birthDate,
          publicKey: user.publicKey,
          privateKey: user.privateKey, // Incluir chave privada na resposta inicial
          clientId: user.clientId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
  }

  /**
   * Obtém um usuário por ID
   */
  async getUserById(id, includePrivateKey = false) {
    await this.init();
    
    try {
      const user = await this.User.findByPk(id, {
        include: [{
          model: this.Client,
          as: 'client',
          attributes: ['id', 'name', 'isActive']
        }]
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userData = includePrivateKey ? user.toJSONWithPrivateKey() : user.toJSON();
      
      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: userData
      };
    } catch (error) {
      throw new Error(`Erro ao obter usuário: ${error.message}`);
    }
  }

  /**
   * Obtém um usuário por email
   */
  async getUserByEmail(email, includePrivateKey = false) {
    await this.init();
    
    try {
      const user = await this.User.findByEmail(email);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userData = includePrivateKey ? user.toJSONWithPrivateKey() : user.toJSON();
      
      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: userData
      };
    } catch (error) {
      throw new Error(`Erro ao obter usuário: ${error.message}`);
    }
  }

  /**
   * Obtém um usuário por CPF
   */
  async getUserByCpf(cpf, includePrivateKey = false) {
    await this.init();
    
    try {
      const user = await this.User.findByCpf(cpf);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userData = includePrivateKey ? user.toJSONWithPrivateKey() : user.toJSON();
      
      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: userData
      };
    } catch (error) {
      throw new Error(`Erro ao obter usuário: ${error.message}`);
    }
  }

  /**
   * Obtém um usuário por publicKey
   */
  async getUserByPublicKey(publicKey, includePrivateKey = false) {
    await this.init();
    
    try {
      const user = await this.User.findByPublicKey(publicKey);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userData = includePrivateKey ? user.toJSONWithPrivateKey() : user.toJSON();
      
      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: userData
      };
    } catch (error) {
      throw new Error(`Erro ao obter usuário: ${error.message}`);
    }
  }

  /**
   * Lista usuários com paginação e filtros
   */
  async listUsers(options = {}) {
    await this.init();
    
    try {
      const {
        page = 1,
        limit = 10,
        clientId,
        isActive,
        search,
        includePrivateKey = false
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (clientId) {
        where.clientId = clientId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where[this.sequelize.Op.or] = [
          { name: { [this.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [this.sequelize.Op.iLike]: `%${search}%` } },
          { cpf: { [this.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await this.User.findAndCountAll({
        where,
        include: [{
          model: this.Client,
          as: 'client',
          attributes: ['id', 'name', 'isActive']
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const users = rows.map(user => 
        includePrivateKey ? user.toJSONWithPrivateKey() : user.toJSON()
      );

      return {
        success: true,
        message: 'Usuários listados com sucesso',
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(id, updateData) {
    await this.init();
    
    try {
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o email já existe (se foi alterado)
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.User.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== id) {
          throw new Error('Email já cadastrado');
        }
      }

      // Verificar se o CPF já existe (se foi alterado)
      if (updateData.cpf && updateData.cpf !== user.cpf) {
        const existingUser = await this.User.findByCpf(updateData.cpf);
        if (existingUser && existingUser.id !== id) {
          throw new Error('CPF já cadastrado');
        }
      }

      await this.User.updateUser(id, updateData);
      
      const updatedUser = await this.User.findByPk(id, {
        include: [{
          model: this.Client,
          as: 'client',
          attributes: ['id', 'name', 'isActive']
        }]
      });

      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser.toJSON()
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  /**
   * Desativa um usuário
   */
  async deactivateUser(id) {
    await this.init();
    
    try {
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      await this.User.deactivateUser(id);
      
      return {
        success: true,
        message: 'Usuário desativado com sucesso'
      };
    } catch (error) {
      throw new Error(`Erro ao desativar usuário: ${error.message}`);
    }
  }

  /**
   * Reativa um usuário
   */
  async activateUser(id) {
    await this.init();
    
    try {
      const user = await this.User.findByPk(id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      await this.User.activateUser(id);
      
      return {
        success: true,
        message: 'Usuário reativado com sucesso'
      };
    } catch (error) {
      throw new Error(`Erro ao reativar usuário: ${error.message}`);
    }
  }

  /**
   * Concede a flag isApiAdmin de um usuário
   */
  async addApiAdmin(userId, adminUserId) {
    await this.init();
    
    try {
      // Verificar se o usuário que está fazendo a operação é API_ADMIN
      const adminUser = await this.User.findByPk(adminUserId);
      if (!adminUser || !adminUser.isApiAdmin) {
        throw new Error('Apenas usuários com permissão API_ADMIN podem gerenciar essa flag');
      }

      // Verificar se o usuário alvo existe
      const targetUser = await this.User.findByPk(userId);
      if (!targetUser) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se já tem a flag
      if (targetUser.isApiAdmin) {
        throw new Error('Usuário já possui a flag isApiAdmin');
      }

      // Atualizar a flag para true
      await targetUser.update({ isApiAdmin: true });

      // Adicionar role API_ADMIN se não existir
      let roles = targetUser.roles || [];
      if (!roles.includes('API_ADMIN')) {
        roles.push('API_ADMIN');
        await targetUser.update({ roles });
      }

      return {
        success: true,
        message: 'Flag isApiAdmin concedida com sucesso',
        data: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          isApiAdmin: true,
          roles: targetUser.roles
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder flag isApiAdmin: ${error.message}`);
    }
  }

  /**
   * Remove a flag isApiAdmin de um usuário
   */
  async removeApiAdmin(userId, adminUserId) {
    await this.init();
    
    try {
      // Verificar se o usuário que está fazendo a operação é API_ADMIN
      const adminUser = await this.User.findByPk(adminUserId);
      if (!adminUser || !adminUser.isApiAdmin) {
        throw new Error('Apenas usuários com permissão API_ADMIN podem gerenciar essa flag');
      }

      // Verificar se o usuário alvo existe
      const targetUser = await this.User.findByPk(userId);
      if (!targetUser) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se já não tem a flag
      if (!targetUser.isApiAdmin) {
        throw new Error('Usuário não possui a flag isApiAdmin');
      }

      // Atualizar a flag para false
      await targetUser.update({ isApiAdmin: false });

      // Remover role API_ADMIN se existir
      let roles = targetUser.roles || [];
      if (roles.includes('API_ADMIN')) {
        roles = roles.filter(role => role !== 'API_ADMIN');
        await targetUser.update({ roles });
      }

      return {
        success: true,
        message: 'Flag isApiAdmin removida com sucesso',
        data: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          isApiAdmin: false,
          roles: targetUser.roles
        }
      };
    } catch (error) {
      throw new Error(`Erro ao remover flag isApiAdmin: ${error.message}`);
    }
  }

  /**
   * Concede a flag isClientAdmin de um usuário
   */
  async addClientAdmin(userId, adminUserId) {
    await this.init();
    
    try {
      // Verificar se o usuário que está fazendo a operação tem permissão
      const adminUser = await this.User.findByPk(adminUserId);
      if (!adminUser) {
        throw new Error('Usuário admin não encontrado');
      }

      // Verificar se o usuário alvo existe
      const targetUser = await this.User.findByPk(userId);
      if (!targetUser) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar permissões:
      // - API_ADMIN pode gerenciar qualquer usuário
      // - CLIENT_ADMIN só pode gerenciar usuários do mesmo client
      if (!adminUser.isApiAdmin) {
        if (!adminUser.isClientAdmin) {
          throw new Error('Apenas usuários com permissão API_ADMIN ou CLIENT_ADMIN podem gerenciar essa flag');
        }
        
        // Se é CLIENT_ADMIN, verificar se o usuário alvo é do mesmo client
        if (targetUser.clientId !== adminUser.clientId) {
          throw new Error('CLIENT_ADMIN só pode gerenciar usuários do mesmo client');
        }
      }

      // Verificar se já tem a flag
      if (targetUser.isClientAdmin) {
        throw new Error('Usuário já possui a flag isClientAdmin');
      }

      // Atualizar a flag para true
      await targetUser.update({ isClientAdmin: true });

      // Adicionar role CLIENT_ADMIN se não existir
      let roles = targetUser.roles || [];
      if (!roles.includes('CLIENT_ADMIN')) {
        roles.push('CLIENT_ADMIN');
        await targetUser.update({ roles });
      }

      return {
        success: true,
        message: 'Flag isClientAdmin concedida com sucesso',
        data: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          isClientAdmin: true,
          roles: targetUser.roles
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder flag isClientAdmin: ${error.message}`);
    }
  }

  /**
   * Remove a flag isClientAdmin de um usuário
   */
  async removeClientAdmin(userId, adminUserId) {
    await this.init();
    
    try {
      // Verificar se o usuário que está fazendo a operação tem permissão
      const adminUser = await this.User.findByPk(adminUserId);
      if (!adminUser) {
        throw new Error('Usuário admin não encontrado');
      }

      // Verificar se o usuário alvo existe
      const targetUser = await this.User.findByPk(userId);
      if (!targetUser) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar permissões:
      // - API_ADMIN pode gerenciar qualquer usuário
      // - CLIENT_ADMIN só pode gerenciar usuários do mesmo client
      if (!adminUser.isApiAdmin) {
        if (!adminUser.isClientAdmin) {
          throw new Error('Apenas usuários com permissão API_ADMIN ou CLIENT_ADMIN podem gerenciar essa flag');
        }
        
        // Se é CLIENT_ADMIN, verificar se o usuário alvo é do mesmo client
        if (targetUser.clientId !== adminUser.clientId) {
          throw new Error('CLIENT_ADMIN só pode gerenciar usuários do mesmo client');
        }
      }

      // Verificar se já não tem a flag
      if (!targetUser.isClientAdmin) {
        throw new Error('Usuário não possui a flag isClientAdmin');
      }

      // Atualizar a flag para false
      await targetUser.update({ isClientAdmin: false });

      // Remover role CLIENT_ADMIN se existir
      let roles = targetUser.roles || [];
      if (roles.includes('CLIENT_ADMIN')) {
        roles = roles.filter(role => role !== 'CLIENT_ADMIN');
        await targetUser.update({ roles });
      }

      return {
        success: true,
        message: 'Flag isClientAdmin removida com sucesso',
        data: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          isClientAdmin: false,
          roles: targetUser.roles
        }
      };
    } catch (error) {
      throw new Error(`Erro ao remover flag isClientAdmin: ${error.message}`);
    }
  }

  /**
   * Obtém usuários de um client específico
   */
  async getUsersByClientId(clientId, options = {}) {
    await this.init();
    
    try {
      const client = await this.Client.findByPk(clientId);
      if (!client) {
        throw new Error('Client não encontrado');
      }

      const {
        page = 1,
        limit = 10,
        isActive,
        search,
        includePrivateKey = false
      } = options;

      const offset = (page - 1) * limit;
      const where = { clientId };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where[this.sequelize.Op.or] = [
          { name: { [this.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [this.sequelize.Op.iLike]: `%${search}%` } },
          { cpf: { [this.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await this.User.findAndCountAll({
        where,
        include: [{
          model: this.Client,
          as: 'client',
          attributes: ['id', 'name', 'isActive']
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const users = rows.map(user => 
        includePrivateKey ? user.toJSONWithPrivateKey() : user.toJSON()
      );

      return {
        success: true,
        message: 'Usuários do client listados com sucesso',
        data: {
          client: {
            id: client.id,
            name: client.name,
            isActive: client.isActive
          },
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar usuários do client: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas dos usuários de um client
   */
  async getClientUsersStats(clientId) {
    await this.init();
    
    try {
      const client = await this.Client.findByPk(clientId);
      if (!client) {
        throw new Error('Client não encontrado');
      }

      // Total de usuários
      const totalUsers = await this.User.count({
        where: { clientId }
      });

      // Usuários ativos
      const activeUsers = await this.User.count({
        where: { 
          clientId,
          isActive: true
        }
      });

      // Usuários inativos
      const inactiveUsers = await this.User.count({
        where: { 
          clientId,
          isActive: false
        }
      });

      // Usuários por role
      const apiAdmins = await this.User.count({
        where: { 
          clientId,
          isApiAdmin: true,
          isActive: true
        }
      });

      const clientAdmins = await this.User.count({
        where: { 
          clientId,
          isClientAdmin: true,
          isActive: true
        }
      });

      const regularUsers = await this.User.count({
        where: { 
          clientId,
          isApiAdmin: false,
          isClientAdmin: false,
          isActive: true
        }
      });

      // Usuários criados nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await this.User.count({
        where: { 
          clientId,
          createdAt: {
            [this.sequelize.Op.gte]: thirtyDaysAgo
          }
        }
      });

      // Última atividade
      const lastActivity = await this.User.findOne({
        where: { 
          clientId,
          lastActivityAt: {
            [this.sequelize.Op.ne]: null
          }
        },
        order: [['lastActivityAt', 'DESC']],
        attributes: ['lastActivityAt']
      });

      return {
        success: true,
        message: 'Estatísticas dos usuários obtidas com sucesso',
        data: {
          client: {
            id: client.id,
            name: client.name
          },
          stats: {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            roles: {
              apiAdmins,
              clientAdmins,
              regularUsers
            },
            recent: {
              last30Days: recentUsers
            },
            lastActivity: lastActivity ? lastActivity.lastActivityAt : null
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas dos usuários: ${error.message}`);
    }
  }

  /**
   * Obtém chaves públicas e privadas de um usuário
   */
  async getUserKeys(userId, clientId = null) {
    await this.init();
    
    try {
      const where = { id: userId };
      
      // Se clientId foi fornecido, verificar se o usuário pertence ao client
      if (clientId) {
        where.clientId = clientId;
      }

      const user = await this.User.findOne({
        where,
        include: [{
          model: this.Client,
          as: 'client',
          attributes: ['id', 'name', 'isActive']
        }]
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        success: true,
        message: 'Chaves do usuário obtidas com sucesso',
        data: {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          clientId: user.clientId,
          clientName: user.client.name,
          publicKey: user.publicKey,
          privateKey: user.privateKey
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter chaves do usuário: ${error.message}`);
    }
  }

  /**
   * Busca usuário por diferentes critérios e retorna chaves
   */
  async searchUserKeys(type, value, clientId) {
    await this.init();
    
    try {
      let where = { isActive: true };
      
      // Adicionar critério de busca baseado no tipo
      switch (type) {
        case 'id':
          where.id = value;
          break;
        case 'email':
          where.email = value.toLowerCase();
          break;
        case 'cpf':
          where.cpf = value.replace(/\D/g, '');
          break;
        default:
          throw new Error('Tipo de busca inválido. Use: id, email, ou cpf');
      }

      // Verificar se o usuário pertence ao client
      where.clientId = clientId;

      const user = await this.User.findOne({
        where,
        include: [{
          model: this.Client,
          as: 'client',
          attributes: ['id', 'name', 'isActive']
        }]
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userCpf: user.cpf,
          userPhone: user.phone,
          clientId: user.clientId,
          clientName: user.client.name,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
          searchType: type,
          searchValue: value
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Gera um par de chaves (pública e privada)
   */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  /**
   * Testa o serviço
   */
  async testService() {
    await this.init();
    
    try {
      const count = await this.User.count();
      
      return {
        success: true,
        message: 'Serviço de usuários funcionando corretamente',
        data: {
          totalUsers: count,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro no teste do serviço: ${error.message}`);
    }
  }
}

module.exports = new UserService(); 