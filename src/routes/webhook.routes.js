const express = require('express');
const router = express.Router();
const { 
  WebhookController, 
  createWebhookValidation, 
  updateWebhookValidation 
} = require('../controllers/webhook.controller');
const { 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest 
} = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Webhook:
 *       type: object
 *       required:
 *         - name
 *         - url
 *         - events
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do webhook
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nome do webhook
 *         url:
 *           type: string
 *           format: uri
 *           description: URL para onde enviar as notificações
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de eventos que o webhook deve receber
 *         secret:
 *           type: string
 *           description: Secret para assinar as requisições
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Se o webhook está ativo
 *         retryCount:
 *           type: integer
 *           minimum: 0
 *           maximum: 10
 *           default: 3
 *           description: Número máximo de tentativas
 *         timeout:
 *           type: integer
 *           minimum: 5000
 *           maximum: 120000
 *           default: 30000
 *           description: Timeout em milissegundos
 *         lastTriggered:
 *           type: string
 *           format: date-time
 *           description: Última vez que foi disparado
 *         totalTriggers:
 *           type: integer
 *           description: Total de disparos
 *         totalSuccess:
 *           type: integer
 *           description: Total de sucessos
 *         totalErrors:
 *           type: integer
 *           description: Total de erros
 *     WebhookEvent:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do evento
 *         description:
 *           type: string
 *           description: Descrição do evento
 *         category:
 *           type: string
 *           description: Categoria do evento
 */

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Listar webhooks do cliente
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Webhook'
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  WebhookController.getWebhooks
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   get:
 *     summary: Obter webhook específico
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *     responses:
 *       200:
 *         description: Webhook encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *                 message:
 *                   type: string
 *       404:
 *         description: Webhook não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  WebhookController.getWebhook
);

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Criar novo webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nome do webhook
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL para onde enviar as notificações
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de eventos que o webhook deve receber
 *               retryCount:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 default: 3
 *                 description: Número máximo de tentativas
 *               timeout:
 *                 type: integer
 *                 minimum: 5000
 *                 maximum: 120000
 *                 default: 30000
 *                 description: Timeout em milissegundos
 *     responses:
 *       201:
 *         description: Webhook criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  createWebhookValidation,
  WebhookController.createWebhook
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   put:
 *     summary: Atualizar webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nome do webhook
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL para onde enviar as notificações
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de eventos que o webhook deve receber
 *               retryCount:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Número máximo de tentativas
 *               timeout:
 *                 type: integer
 *                 minimum: 5000
 *                 maximum: 120000
 *                 description: Timeout em milissegundos
 *               isActive:
 *                 type: boolean
 *                 description: Se o webhook está ativo
 *     responses:
 *       200:
 *         description: Webhook atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Webhook não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  updateWebhookValidation,
  WebhookController.updateWebhook
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     summary: Deletar webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *     responses:
 *       200:
 *         description: Webhook deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Webhook não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  WebhookController.deleteWebhook
);

/**
 * @swagger
 * /api/webhooks/{id}/test:
 *   post:
 *     summary: Testar webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       404:
 *         description: Webhook não encontrado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/test', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  WebhookController.testWebhook
);

/**
 * @swagger
 * /api/webhooks/stats:
 *   get:
 *     summary: Obter estatísticas de webhooks
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de webhooks
 *                     active:
 *                       type: integer
 *                       description: Webhooks ativos
 *                     totalTriggers:
 *                       type: integer
 *                       description: Total de disparos
 *                     totalSuccess:
 *                       type: integer
 *                       description: Total de sucessos
 *                     totalErrors:
 *                       type: integer
 *                       description: Total de erros
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  WebhookController.getWebhookStats
);

/**
 * @swagger
 * /api/webhooks/events:
 *   get:
 *     summary: Listar eventos disponíveis
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de eventos disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WebhookEvent'
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/events', 
  authenticateApiKey, 
  addUserInfo, 
  logAuthenticatedRequest,
  WebhookController.getAvailableEvents
);

module.exports = router; 