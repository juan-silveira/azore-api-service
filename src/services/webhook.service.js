const crypto = require('crypto');
const axios = require('axios');
const { Op } = require('sequelize');
const { sequelize } = require('../models/index');

class WebhookService {
  /**
   * Criar novo webhook
   */
  async createWebhook(webhookData) {
    try {
      // Gerar secret único
      webhookData.secret = crypto.randomBytes(32).toString('hex');
      
      const webhook = await global.models.Webhook.create(webhookData);
      return {
        success: true,
        data: webhook,
        message: 'Webhook criado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      return {
        success: false,
        message: 'Erro ao criar webhook',
        error: error.message
      };
    }
  }

  /**
   * Listar webhooks de um cliente
   */
  async getWebhooksByClient(clientId) {
    try {
      const webhooks = await global.models.Webhook.findAll({
        where: { clientId },
        order: [['createdAt', 'DESC']]
      });
      
      return {
        success: true,
        data: webhooks,
        message: 'Webhooks encontrados'
      };
    } catch (error) {
      console.error('Erro ao buscar webhooks:', error);
      return {
        success: false,
        message: 'Erro ao buscar webhooks',
        error: error.message
      };
    }
  }

  /**
   * Atualizar webhook
   */
  async updateWebhook(webhookId, updateData) {
    try {
      const webhook = await global.models.Webhook.findByPk(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook não encontrado'
        };
      }

      await webhook.update(updateData);
      
      return {
        success: true,
        data: webhook,
        message: 'Webhook atualizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      return {
        success: false,
        message: 'Erro ao atualizar webhook',
        error: error.message
      };
    }
  }

  /**
   * Deletar webhook
   */
  async deleteWebhook(webhookId) {
    try {
      const webhook = await global.models.Webhook.findByPk(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook não encontrado'
        };
      }

      await webhook.destroy();
      
      return {
        success: true,
        message: 'Webhook deletado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao deletar webhook:', error);
      return {
        success: false,
        message: 'Erro ao deletar webhook',
        error: error.message
      };
    }
  }

  /**
   * Gerar assinatura HMAC para webhook
   */
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Enviar webhook com retry mechanism
   */
  async sendWebhook(webhook, event, payload) {
    const webhookId = webhook.id;
    
    try {
      // Atualizar estatísticas
      await webhook.update({
        lastTriggered: new Date(),
        totalTriggers: webhook.totalTriggers + 1
      });

      // Preparar payload
      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
        webhookId: webhook.id
      };

      // Gerar assinatura
      const signature = this.generateSignature(webhookPayload, webhook.secret);

      // Configurar headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Timestamp': webhookPayload.timestamp,
        'User-Agent': 'Azore-Webhook/1.0'
      };

      // Enviar requisição
      const response = await axios.post(webhook.url, webhookPayload, {
        headers,
        timeout: webhook.timeout || 30000
      });

      // Verificar se foi bem-sucedido
      if (response.status >= 200 && response.status < 300) {
        await webhook.update({
          lastSuccess: new Date(),
          totalSuccess: webhook.totalSuccess + 1,
          lastError: null
        });

        return {
          success: true,
          message: 'Webhook enviado com sucesso',
          response: response.data
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`Erro ao enviar webhook ${webhookId}:`, error.message);
      
      // Atualizar estatísticas de erro
      await webhook.update({
        lastError: error.message,
        totalErrors: webhook.totalErrors + 1
      });

      // Tentar novamente se ainda há tentativas
      if (webhook.retryCount > 0) {
        return this.retryWebhook(webhook, event, payload, webhook.retryCount);
      }

      return {
        success: false,
        message: 'Falha ao enviar webhook',
        error: error.message
      };
    }
  }

  /**
   * Retry mechanism para webhooks
   */
  async retryWebhook(webhook, event, payload, remainingRetries) {
    const delays = [1000, 5000, 15000, 30000, 60000]; // Delays em ms
    
    for (let attempt = 0; attempt < remainingRetries; attempt++) {
      const delay = delays[attempt] || 60000;
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await this.sendWebhook(webhook, event, payload);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Retry ${attempt + 1} falhou para webhook ${webhook.id}:`, error.message);
      }
    }

    return {
      success: false,
      message: `Webhook falhou após ${remainingRetries} tentativas`
    };
  }

  /**
   * Disparar webhooks para um evento específico
   */
  async triggerWebhooks(event, payload, clientId = null) {
    try {
      // Buscar webhooks ativos para o evento
      const whereClause = {
        isActive: true,
        events: {
          [Op.contains]: [event]
        }
      };

      if (clientId) {
        whereClause.clientId = clientId;
      }

      const webhooks = await global.models.Webhook.findAll({ where: whereClause });
      
      if (webhooks.length === 0) {
        return {
          success: true,
          message: 'Nenhum webhook encontrado para o evento',
          triggered: 0
        };
      }

      // Enviar webhooks em paralelo
      const promises = webhooks.map(webhook => 
        this.sendWebhook(webhook, event, payload)
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      return {
        success: true,
        message: `Webhooks processados: ${successful} sucesso, ${failed} falhas`,
        triggered: results.length,
        successful,
        failed,
        results: results.map((result, index) => ({
          webhookId: webhooks[index].id,
          success: result.status === 'fulfilled' && result.value.success,
          message: result.status === 'fulfilled' ? result.value.message : result.reason
        }))
      };

    } catch (error) {
      console.error('Erro ao disparar webhooks:', error);
      return {
        success: false,
        message: 'Erro ao disparar webhooks',
        error: error.message
      };
    }
  }

  /**
   * Testar webhook
   */
  async testWebhook(webhookId) {
    try {
      const webhook = await global.models.Webhook.findByPk(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook não encontrado'
        };
      }

      const testPayload = {
        test: true,
        message: 'Teste de webhook',
        timestamp: new Date().toISOString()
      };

      const result = await this.sendWebhook(webhook, 'webhook.test', testPayload);
      
      return {
        success: true,
        message: 'Teste de webhook executado',
        result
      };

    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      return {
        success: false,
        message: 'Erro ao testar webhook',
        error: error.message
      };
    }
  }

  /**
   * Obter estatísticas de webhooks
   */
  async getWebhookStats(clientId = null) {
    try {
      const whereClause = {};
      if (clientId) {
        whereClause.clientId = clientId;
      }

      const stats = await global.models.Webhook.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isActive" = true THEN 1 ELSE 0 END')), 'active'],
          [sequelize.fn('SUM', sequelize.col('totalTriggers')), 'totalTriggers'],
          [sequelize.fn('SUM', sequelize.col('totalSuccess')), 'totalSuccess'],
          [sequelize.fn('SUM', sequelize.col('totalErrors')), 'totalErrors']
        ],
        raw: true
      });

      return {
        success: true,
        data: stats[0] || {
          total: 0,
          active: 0,
          totalTriggers: 0,
          totalSuccess: 0,
          totalErrors: 0
        }
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message
      };
    }
  }
}

module.exports = new WebhookService(); 