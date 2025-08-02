const logService = require('../services/log.service');

/**
 * Controller para gerenciamento de logs
 */
class LogController {
  /**
   * Lista logs de requisições
   */
  async listRequestLogs(req, res) {
    try {
      const {
        page,
        limit,
        clientId,
        resourceType,
        statusCode,
        startDate,
        endDate,
        search
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        clientId,
        resourceType,
        statusCode: statusCode ? parseInt(statusCode) : undefined,
        startDate,
        endDate,
        search
      };

      const result = await logService.listRequestLogs(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar logs de requisições',
        error: error.message
      });
    }
  }

  /**
   * Lista transações
   */
  async listTransactions(req, res) {
    try {
      const {
        page,
        limit,
        clientId,
        status,
        network,
        transactionType,
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        clientId,
        status,
        network,
        transactionType,
        startDate,
        endDate
      };

      const result = await logService.listTransactions(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar transações',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de logs
   */
  async getLogStats(req, res) {
    try {
      const {
        startDate,
        endDate,
        clientId,
        network,
        resourceType,
        transactionType
      } = req.query;

      const options = {
        startDate,
        endDate,
        clientId,
        network,
        resourceType,
        transactionType
      };

      const result = await logService.getLogStats(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtém logs de erro
   */
  async getErrorLogs(req, res) {
    try {
      const { page, limit, startDate, endDate } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        startDate,
        endDate
      };

      const result = await logService.getErrorLogs(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter logs de erro',
        error: error.message
      });
    }
  }

  /**
   * Obtém transações pendentes
   */
  async getPendingTransactions(req, res) {
    try {
      const { network, limit } = req.query;

      const options = {
        network,
        limit: parseInt(limit) || 100
      };

      const result = await logService.getPendingTransactions(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transações pendentes',
        error: error.message
      });
    }
  }

  /**
   * Obtém transação por hash
   */
  async getTransactionByHash(req, res) {
    try {
      const { txHash } = req.params;

      if (!txHash) {
        return res.status(400).json({
          success: false,
          message: 'Hash da transação é obrigatório'
        });
      }

      const result = await logService.getTransactionByHash(txHash);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter transação',
        error: error.message
      });
    }
  }

  /**
   * Atualiza status de transação
   */
  async updateTransactionStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const { status, ...additionalData } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status é obrigatório'
        });
      }

      const validStatuses = ['pending', 'confirmed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido',
          error: 'INVALID_STATUS',
          validStatuses
        });
      }

      const result = await logService.updateTransactionStatus(transactionId, status, additionalData);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar status da transação',
        error: error.message
      });
    }
  }

  /**
   * Limpa logs antigos
   */
  async cleanupOldLogs(req, res) {
    try {
      const { daysToKeep } = req.query;
      const days = parseInt(daysToKeep) || 30;

      if (days < 1) {
        return res.status(400).json({
          success: false,
          message: 'Número de dias deve ser maior que 0'
        });
      }

      const result = await logService.cleanupOldLogs(days);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao limpar logs antigos',
        error: error.message
      });
    }
  }

  /**
   * Exporta logs
   */
  async exportLogs(req, res) {
    try {
      const {
        startDate,
        endDate,
        clientId,
        network,
        format
      } = req.query;

      const options = {
        startDate,
        endDate,
        clientId,
        network,
        format: format || 'json'
      };

      const result = await logService.exportLogs(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao exportar logs',
        error: error.message
      });
    }
  }

  /**
   * Obtém logs do cliente autenticado
   */
  async getMyLogs(req, res) {
    try {
      if (!req.client) {
        return res.status(401).json({
          success: false,
          message: 'Cliente não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const {
        page,
        limit,
        resourceType,
        statusCode,
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        clientId: req.client.id,
        resourceType,
        statusCode: statusCode ? parseInt(statusCode) : undefined,
        startDate,
        endDate
      };

      const result = await logService.listRequestLogs(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter logs do cliente',
        error: error.message
      });
    }
  }

  /**
   * Obtém transações do cliente autenticado
   */
  async getMyTransactions(req, res) {
    try {
      if (!req.client) {
        return res.status(401).json({
          success: false,
          message: 'Cliente não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const {
        page,
        limit,
        status,
        network,
        transactionType,
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        clientId: req.client.id,
        status,
        network,
        transactionType,
        startDate,
        endDate
      };

      const result = await logService.listTransactions(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transações do cliente',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas do cliente autenticado
   */
  async getMyStats(req, res) {
    try {
      if (!req.client) {
        return res.status(401).json({
          success: false,
          message: 'Cliente não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const {
        startDate,
        endDate,
        network,
        resourceType,
        transactionType
      } = req.query;

      const options = {
        startDate,
        endDate,
        clientId: req.client.id,
        network,
        resourceType,
        transactionType
      };

      const result = await logService.getLogStats(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas do cliente',
        error: error.message
      });
    }
  }

  /**
   * Obtém logs de requisições de um usuário específico
   */
  async getUserLogs(req, res) {
    try {
      const { userId } = req.params;
      const {
        page,
        limit,
        resourceType,
        statusCode,
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        userId,
        resourceType,
        statusCode: statusCode ? parseInt(statusCode) : undefined,
        startDate,
        endDate
      };

      const result = await logService.getUserLogs(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter logs do usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém transações de um usuário específico
   */
  async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      const {
        page,
        limit,
        status,
        network,
        transactionType,
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        userId,
        status,
        network,
        transactionType,
        startDate,
        endDate
      };

      const result = await logService.getUserTransactions(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transações do usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de um usuário específico
   */
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      const {
        startDate,
        endDate,
        network,
        resourceType,
        transactionType
      } = req.query;

      const options = {
        startDate,
        endDate,
        userId,
        network,
        resourceType,
        transactionType
      };

      const result = await logService.getUserStats(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas do usuário',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de logs
   */
  async testService(req, res) {
    try {
      const result = await logService.testService();
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

module.exports = new LogController(); 