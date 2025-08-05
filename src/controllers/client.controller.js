const clientService = require('../services/client.service');
const userService = require('../services/user.service');
const logService = require('../services/log.service');

/**
 * Controller para gerenciamento de clientes (instituições)
 */
class ClientController {
  /**
   * Cria um novo cliente (instituição)
   */
  async createClient(req, res) {
    try {
      const clientData = req.body;
      
      // Validar campos obrigatórios
      if (!clientData.name) {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório'
        });
      }

      // Validar tamanho do nome
      if (clientData.name.length < 2 || clientData.name.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Nome deve ter entre 2 e 255 caracteres'
        });
      }

      // Validar formato do nome (apenas letras, números, espaços e caracteres especiais comuns)
      const nameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_.,&()]+$/;
      if (!nameRegex.test(clientData.name)) {
        return res.status(400).json({
          success: false,
          message: 'Nome contém caracteres inválidos'
        });
      }

      // Validar rate limits se fornecidos
      if (clientData.rateLimit) {
        const requiredLimits = ['requestsPerMinute', 'requestsPerHour', 'requestsPerDay'];
        for (const limit of requiredLimits) {
          if (typeof clientData.rateLimit[limit] !== 'number' || clientData.rateLimit[limit] < 1) {
            return res.status(400).json({
              success: false,
              message: `Rate limit '${limit}' deve ser um número maior que 0`
            });
          }
        }

        // Validar hierarquia dos limites
        if (clientData.rateLimit.requestsPerMinute > clientData.rateLimit.requestsPerHour) {
          return res.status(400).json({
            success: false,
            message: 'requestsPerMinute não pode ser maior que requestsPerHour'
          });
        }

        if (clientData.rateLimit.requestsPerHour > clientData.rateLimit.requestsPerDay) {
          return res.status(400).json({
            success: false,
            message: 'requestsPerHour não pode ser maior que requestsPerDay'
          });
        }
      }

      const result = await clientService.createClient(clientData);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao criar cliente',
        error: error.message
      });
    }
  }

  /**
   * Obtém um cliente por ID
   */
  async getClientById(req, res) {
    try {
      const { id } = req.params;
      const result = await clientService.getClientById(id);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter cliente',
        error: error.message
      });
    }
  }

  /**
   * Lista clientes com paginação
   */
  async listClients(req, res) {
    try {
      const { page, limit, isActive, search } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search
      };
      
      const result = await clientService.listClients(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar clientes',
        error: error.message
      });
    }
  }

  /**
   * Atualiza um cliente
   */
  async updateClient(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await clientService.updateClient(id, updateData);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar cliente',
        error: error.message
      });
    }
  }

  /**
   * Desativa um cliente
   */
  async deactivateClient(req, res) {
    try {
      const { id } = req.params;
      const result = await clientService.deactivateClient(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar cliente',
        error: error.message
      });
    }
  }

  /**
   * Reativa um cliente
   */
  async activateClient(req, res) {
    try {
      const { id } = req.params;
      const result = await clientService.activateClient(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao reativar cliente',
        error: error.message
      });
    }
  }

  /**
   * Atualiza rate limits de um cliente
   */
  async updateRateLimits(req, res) {
    try {
      const { id } = req.params;
      const { rateLimit } = req.body;
      
      if (!rateLimit) {
        return res.status(400).json({
          success: false,
          message: 'Rate limits são obrigatórios'
        });
      }

      const result = await clientService.updateRateLimits(id, rateLimit);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar rate limits',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de uso de um cliente
   */
  async getClientUsageStats(req, res) {
    try {
      const { id } = req.params;
      const result = await clientService.getClientUsageStats(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas de uso',
        error: error.message
      });
    }
  }

  /**
   * Lista usuários de um cliente
   */
  async getClientUsers(req, res) {
    try {
      const { id } = req.params;
      const { page, limit, isActive, search } = req.query;
      
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search
      };

      const result = await userService.getUsersByClientId(id, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar usuários do cliente',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas dos usuários de um cliente
   */
  async getClientUsersStats(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.getClientUsersStats(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas dos usuários',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de requests de um cliente
   */
  async getClientRequestsStats(req, res) {
    try {
      const { id } = req.params;
      const { period = 'day' } = req.query;
      
      const result = await logService.getClientRequestsStats(id, period);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas de requests',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de clientes
   */
  async testService(req, res) {
    try {
      const result = await clientService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no teste do serviço',
        error: error.message
      });
    }
  }
}

module.exports = new ClientController(); 