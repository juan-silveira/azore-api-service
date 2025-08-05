const webhookService = require('../services/webhook.service');
const { validateRequest } = require('../middleware/validation.middleware');
const { body } = require('express-validator');

class WebhookController {
  /**
   * Criar novo webhook
   */
  async createWebhook(req, res) {
    try {
      const { clientId } = req.user;
      const webhookData = {
        ...req.body,
        clientId
      };

      const result = await webhookService.createWebhook(webhookData);
      
      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro no controller createWebhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Listar webhooks do cliente
   */
  async getWebhooks(req, res) {
    try {
      const { clientId } = req.user;
      const result = await webhookService.getWebhooksByClient(clientId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro no controller getWebhooks:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obter webhook específico
   */
  async getWebhook(req, res) {
    try {
      const { id } = req.params;
      const { clientId } = req.user;

      const webhooks = await webhookService.getWebhooksByClient(clientId);
      
      if (!webhooks.success) {
        return res.status(400).json(webhooks);
      }

      const webhook = webhooks.data.find(w => w.id === id);
      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        data: webhook,
        message: 'Webhook encontrado'
      });
    } catch (error) {
      console.error('Erro no controller getWebhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Atualizar webhook
   */
  async updateWebhook(req, res) {
    try {
      const { id } = req.params;
      const { clientId } = req.user;
      const updateData = req.body;

      // Verificar se o webhook pertence ao cliente
      const webhooks = await webhookService.getWebhooksByClient(clientId);
      if (!webhooks.success) {
        return res.status(400).json(webhooks);
      }

      const webhook = webhooks.data.find(w => w.id === id);
      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook não encontrado'
        });
      }

      const result = await webhookService.updateWebhook(id, updateData);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro no controller updateWebhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Deletar webhook
   */
  async deleteWebhook(req, res) {
    try {
      const { id } = req.params;
      const { clientId } = req.user;

      // Verificar se o webhook pertence ao cliente
      const webhooks = await webhookService.getWebhooksByClient(clientId);
      if (!webhooks.success) {
        return res.status(400).json(webhooks);
      }

      const webhook = webhooks.data.find(w => w.id === id);
      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook não encontrado'
        });
      }

      const result = await webhookService.deleteWebhook(id);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro no controller deleteWebhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Testar webhook
   */
  async testWebhook(req, res) {
    try {
      const { id } = req.params;
      const { clientId } = req.user;

      // Verificar se o webhook pertence ao cliente
      const webhooks = await webhookService.getWebhooksByClient(clientId);
      if (!webhooks.success) {
        return res.status(400).json(webhooks);
      }

      const webhook = webhooks.data.find(w => w.id === id);
      if (!webhook) {
        return res.status(404).json({
          success: false,
          message: 'Webhook não encontrado'
        });
      }

      const result = await webhookService.testWebhook(id);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro no controller testWebhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas de webhooks
   */
  async getWebhookStats(req, res) {
    try {
      const { clientId } = req.user;
      const result = await webhookService.getWebhookStats(clientId);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro no controller getWebhookStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Listar eventos disponíveis
   */
  async getAvailableEvents(req, res) {
    try {
      const events = [
        {
          name: 'user.created',
          description: 'Usuário criado',
          category: 'users'
        },
        {
          name: 'user.updated',
          description: 'Usuário atualizado',
          category: 'users'
        },
        {
          name: 'user.deactivated',
          description: 'Usuário desativado',
          category: 'users'
        },
        {
          name: 'transaction.created',
          description: 'Transação criada',
          category: 'transactions'
        },
        {
          name: 'transaction.completed',
          description: 'Transação completada',
          category: 'transactions'
        },
        {
          name: 'transaction.failed',
          description: 'Transação falhou',
          category: 'transactions'
        },
        {
          name: 'token.minted',
          description: 'Token mintado',
          category: 'tokens'
        },
        {
          name: 'token.burned',
          description: 'Token queimado',
          category: 'tokens'
        },
        {
          name: 'token.transferred',
          description: 'Token transferido',
          category: 'tokens'
        },
        {
          name: 'stake.created',
          description: 'Stake criado',
          category: 'stakes'
        },
        {
          name: 'stake.invested',
          description: 'Investimento realizado',
          category: 'stakes'
        },
        {
          name: 'stake.withdrawn',
          description: 'Retirada realizada',
          category: 'stakes'
        },
        {
          name: 'stake.rewards_claimed',
          description: 'Recompensas resgatadas',
          category: 'stakes'
        },
        {
          name: 'queue.job_started',
          description: 'Job iniciado na fila',
          category: 'queue'
        },
        {
          name: 'queue.job_completed',
          description: 'Job completado',
          category: 'queue'
        },
        {
          name: 'queue.job_failed',
          description: 'Job falhou',
          category: 'queue'
        },
        {
          name: 'webhook.test',
          description: 'Teste de webhook',
          category: 'system'
        }
      ];

      return res.status(200).json({
        success: true,
        data: events,
        message: 'Eventos disponíveis'
      });
    } catch (error) {
      console.error('Erro no controller getAvailableEvents:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

// Validações para criação de webhook
const createWebhookValidation = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome deve ter entre 1 e 100 caracteres'),
  body('url')
    .isURL()
    .withMessage('URL deve ser válida'),
  body('events')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos um evento'),
  body('events.*')
    .isString()
    .withMessage('Cada evento deve ser uma string'),
  body('retryCount')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Retry count deve ser entre 0 e 10'),
  body('timeout')
    .optional()
    .isInt({ min: 5000, max: 120000 })
    .withMessage('Timeout deve ser entre 5 e 120 segundos'),
  validateRequest
];

// Validações para atualização de webhook
const updateWebhookValidation = [
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome deve ter entre 1 e 100 caracteres'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL deve ser válida'),
  body('events')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos um evento'),
  body('events.*')
    .optional()
    .isString()
    .withMessage('Cada evento deve ser uma string'),
  body('retryCount')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Retry count deve ser entre 0 e 10'),
  body('timeout')
    .optional()
    .isInt({ min: 5000, max: 120000 })
    .withMessage('Timeout deve ser entre 5 e 120 segundos'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser um booleano'),
  validateRequest
];

module.exports = {
  WebhookController: new WebhookController(),
  createWebhookValidation,
  updateWebhookValidation
}; 