const databaseConfig = require('../config/database');

class ClientService {
  constructor() {
    this.Client = null;
    this.sequelize = null;
  }

  async initialize() {
    try {
      // Aguardar até que os modelos globais estejam disponíveis
      let attempts = 0;
      while (!global.models && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!global.models) {
        throw new Error('Modelos não foram inicializados');
      }
      
      this.sequelize = global.sequelize;
      this.Client = global.models.Client;
      console.log('✅ Serviço de clientes inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de clientes:', error.message);
      throw error;
    }
  }

  /**
   * Cria um novo cliente (instituição)
   */
  async createClient(clientData) {
    try {
      // Criar cliente
      const client = await this.Client.create(clientData);
      
      return {
        success: true,
        message: 'Cliente criado com sucesso',
        data: client
      };
    } catch (error) {
      throw new Error(`Erro ao criar cliente: ${error.message}`);
    }
  }

  /**
   * Obtém um cliente por ID
   */
  async getClientById(id) {
    try {
      const client = await this.Client.findByPk(id);
      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      return {
        success: true,
        message: 'Cliente encontrado com sucesso',
        data: client
      };
    } catch (error) {
      throw new Error(`Erro ao obter cliente: ${error.message}`);
    }
  }

  /**
   * Lista clientes com paginação
   */
  async listClients(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        isActive,
        search
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.name = { [this.sequelize.Op.iLike]: `%${search}%` };
      }

      const { count, rows } = await this.Client.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        message: 'Clientes listados com sucesso',
        data: {
          clients: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar clientes: ${error.message}`);
    }
  }

  /**
   * Atualiza um cliente
   */
  async updateClient(id, updateData) {
    try {
      // Verificar se o cliente existe
      const existingClient = await this.Client.findByPk(id);
      if (!existingClient) {
        throw new Error('Cliente não encontrado');
      }

      // Atualizar cliente
      const [updated] = await this.Client.updateClient(id, updateData);
      
      if (updated === 0) {
        throw new Error('Nenhuma alteração foi feita');
      }

      const updatedClient = await this.Client.findByPk(id);
      
      return {
        success: true,
        message: 'Cliente atualizado com sucesso',
        data: updatedClient
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar cliente: ${error.message}`);
    }
  }

  /**
   * Desativa um cliente
   */
  async deactivateClient(id) {
    try {
      const [updated] = await this.Client.deactivateClient(id);
      
      if (updated === 0) {
        throw new Error('Cliente não encontrado');
      }

      return {
        success: true,
        message: 'Cliente desativado com sucesso'
      };
    } catch (error) {
      throw new Error(`Erro ao desativar cliente: ${error.message}`);
    }
  }

  /**
   * Reativa um cliente
   */
  async activateClient(id) {
    try {
      const [updated] = await this.Client.activateClient(id);
      
      if (updated === 0) {
        throw new Error('Cliente não encontrado');
      }

      return {
        success: true,
        message: 'Cliente reativado com sucesso'
      };
    } catch (error) {
      throw new Error(`Erro ao reativar cliente: ${error.message}`);
    }
  }

  /**
   * Atualiza rate limits de um cliente
   */
  async updateRateLimits(id, rateLimit) {
    try {
      // Validar rate limits
      this.Client.build({ rateLimit }).validate();

      const [updated] = await this.Client.updateClient(id, { rateLimit });
      
      if (updated === 0) {
        throw new Error('Cliente não encontrado');
      }

      const updatedClient = await this.Client.findByPk(id);
      
      return {
        success: true,
        message: 'Rate limits atualizados com sucesso',
        data: updatedClient
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar rate limits: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas de uso de um cliente
   */
  async getClientUsageStats(id) {
    try {
      const client = await this.Client.findByPk(id);
      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      const usageStats = await client.getUsageStats();
      
      return {
        success: true,
        message: 'Estatísticas de uso obtidas com sucesso',
        data: {
          clientId: client.id,
          clientName: client.name,
          usage: usageStats,
          lastActivity: client.lastActivityAt
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas de uso: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de clientes
   */
  async testService() {
    try {
      // Teste de criação de cliente
      const testClient = await this.createClient({
        name: 'Test Client',
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        }
      });

      // Teste de busca
      const foundClient = await this.getClientById(testClient.data.id);

      // Teste de listagem
      const clients = await this.listClients({ page: 1, limit: 5 });

      // Teste de atualização
      const updatedClient = await this.updateClient(testClient.data.id, {
        name: 'Updated Test Client'
      });

      // Limpar cliente de teste
      await this.deactivateClient(testClient.data.id);

      return {
        success: true,
        message: 'Teste do serviço de clientes realizado com sucesso',
        data: {
          clientCreated: true,
          clientFound: true,
          clientsListed: true,
          clientUpdated: true,
          testClientCleaned: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de clientes',
        error: error.message,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }
}

module.exports = new ClientService(); 