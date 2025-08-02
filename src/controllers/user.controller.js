const userService = require('../services/user.service');

/**
 * Controller para gerenciamento de usuários
 */
class UserController {
  /**
   * Cria um novo usuário
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Validar campos obrigatórios
      if (!userData.name || !userData.email || !userData.cpf) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e CPF são obrigatórios'
        });
      }

      // Validar campo admin (opcional, padrão false)
      if (userData.isAdmin !== undefined && typeof userData.isAdmin !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Campo isAdmin deve ser um boolean'
        });
      }

      // Para rotas admin, usar o clientId do body da requisição
      // Para rotas normais, usar o clientId do client autenticado
      let clientId;
      
      if (userData.clientId) {
        // Rota admin: usar clientId do body (prioridade)
        clientId = userData.clientId;
      } else if (req.client) {
        // Rota normal: usar client autenticado
        clientId = req.client.id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'ClientId é obrigatório'
        });
      }

      const result = await userService.createUser(userData, clientId);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao criar usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém um usuário por ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const { includePrivateKey } = req.query;
      const result = await userService.getUserById(id, includePrivateKey === 'true');
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém um usuário por email
   */
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;
      const { includePrivateKey } = req.query;
      const result = await userService.getUserByEmail(email, includePrivateKey === 'true');
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém um usuário por CPF
   */
  async getUserByCpf(req, res) {
    try {
      const { cpf } = req.params;
      const { includePrivateKey } = req.query;
      const result = await userService.getUserByCpf(cpf, includePrivateKey === 'true');
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter usuário',
        error: error.message
      });
    }
  }

  /**
   * Lista usuários com paginação
   */
  async listUsers(req, res) {
    try {
      const { page, limit, clientId, isActive, search, includePrivateKey } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        clientId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search,
        includePrivateKey: includePrivateKey === 'true'
      };
      
      const result = await userService.listUsers(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: error.message
      });
    }
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await userService.updateUser(id, updateData);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar usuário',
        error: error.message
      });
    }
  }

  /**
   * Desativa um usuário
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.deactivateUser(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar usuário',
        error: error.message
      });
    }
  }

  /**
   * Reativa um usuário
   */
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.activateUser(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao reativar usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém usuários de um client específico
   */
  async getUsersByClientId(req, res) {
    try {
      const { clientId } = req.params;
      const { page, limit, isActive, search, includePrivateKey } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search,
        includePrivateKey: includePrivateKey === 'true'
      };
      
      const result = await userService.getUsersByClientId(clientId, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar usuários do client',
        error: error.message
      });
    }
  }

  /**
   * Obtém chaves públicas e privadas de um usuário (para admin)
   */
  async getUserKeysAdmin(req, res) {
    try {
      const { userId } = req.params;
      const result = await userService.getUserKeys(userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter chaves do usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém chaves públicas e privadas de um usuário (para client)
   */
  async getUserKeysClient(req, res) {
    try {
      const { userId } = req.params;
      
      // Verificar se o usuário pertence ao client autenticado
      if (!req.client) {
        return res.status(401).json({
          success: false,
          message: 'Client não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const result = await userService.getUserKeys(userId, req.client.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter chaves do usuário',
        error: error.message
      });
    }
  }

  /**
   * Busca usuário e retorna chaves por diferentes critérios
   */
  async searchUserKeys(req, res) {
    try {
      const { type, value } = req.params;
      
      // Verificar se o usuário pertence ao client autenticado
      if (!req.client) {
        return res.status(401).json({
          success: false,
          message: 'Client não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const result = await userService.searchUserKeys(type, value, req.client.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao buscar usuário',
        error: error.message
      });
    }
  }

  /**
   * Concede a flag isApiAdmin de um usuário
   */
  async addApiAdmin(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.id;

      const result = await userService.addApiAdmin(userId, adminUserId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder flag isApiAdmin',
        error: error.message
      });
    }
  }

  /**
   * Remove a flag isApiAdmin de um usuário
   */
  async removeApiAdmin(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.id;

      const result = await userService.removeApiAdmin(userId, adminUserId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao remover flag isApiAdmin',
        error: error.message
      });
    }
  }

  /**
   * Concede a flag isClientAdmin de um usuário
   */
  async addClientAdmin(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.id;

      const result = await userService.addClientAdmin(userId, adminUserId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder flag isClientAdmin',
        error: error.message
      });
    }
  }

  /**
   * Remove a flag isClientAdmin de um usuário
   */
  async removeClientAdmin(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user.id;

      const result = await userService.removeClientAdmin(userId, adminUserId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao remover flag isClientAdmin',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de usuários
   */
  async testService(req, res) {
    try {
      const result = await userService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no teste do serviço',
        error: error.message
      });
    }
  }

  /**
   * Obtém um usuário por endereço (publicKey)
   */
  async getUserByAddress(req, res) {
    try {
      const { address } = req.params;
      const { includePrivateKey } = req.query;
      const result = await userService.getUserByPublicKey(address, includePrivateKey === 'true');
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter usuário',
        error: error.message
      });
    }
  }

  /**
   * Lista saldos de um usuário por endereço
   */
  async getUserBalances(req, res) {
    try {
      const { address } = req.params;
      const { network = 'testnet' } = req.query;
      
      const result = await userService.getUserBalances(address, network);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter saldos do usuário',
        error: error.message
      });
    }
  }
}

module.exports = new UserController(); 