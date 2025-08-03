const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do cliente
 *         name:
 *           type: string
 *           description: Nome da instituição
 *         isActive:
 *           type: boolean
 *           description: Se o cliente está ativo
 *         rateLimit:
 *           type: object
 *           description: Limites de rate limit
 *           properties:
 *             requestsPerMinute:
 *               type: integer
 *             requestsPerHour:
 *               type: integer
 *             requestsPerDay:
 *               type: integer
 *         lastActivityAt:
 *           type: string
 *           format: date-time
 *           description: Última atividade
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Cria um novo cliente (instituição)
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, clientController.createClient);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Lista clientes com paginação
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 */
router.get('/', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, clientController.listClients);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Obtém um cliente por ID (acessível pelo próprio cliente)
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (só pode ver próprio cliente)
 */
router.get('/:id', authMiddleware.authenticateApiKey, clientController.getClientById);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Atualiza um cliente
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 */
router.put('/:id', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, clientController.updateClient);

/**
 * @swagger
 * /api/clients/{id}/deactivate:
 *   post:
 *     summary: Desativa um cliente
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente desativado com sucesso
 *       400:
 *         description: Erro ao desativar
 *       401:
 *         description: Não autorizado
 */
router.post('/:id/deactivate', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, clientController.deactivateClient);

/**
 * @swagger
 * /api/clients/{id}/activate:
 *   post:
 *     summary: Reativa um cliente
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente reativado com sucesso
 *       400:
 *         description: Erro ao reativar
 *       401:
 *         description: Não autorizado
 */
router.post('/:id/activate', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, clientController.activateClient);

/**
 * @swagger
 * /api/clients/{id}/rate-limits:
 *   put:
 *     summary: Atualiza rate limits de um cliente
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rateLimit
 *             properties:
 *               rateLimit:
 *                 $ref: '#/components/schemas/Client/properties/rateLimit'
 *     responses:
 *       200:
 *         description: Rate limits atualizados com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put('/:id/rate-limits', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, clientController.updateRateLimits);

/**
 * @swagger
 * /api/clients/{id}/usage-stats:
 *   get:
 *     summary: Obtém estatísticas de uso de um cliente (acessível pelo próprio cliente)
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Erro ao obter estatísticas
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (só pode ver próprio cliente)
 */
router.get('/:id/usage-stats', authMiddleware.authenticateApiKey, clientController.getClientUsageStats);

/**
 * @swagger
 * /api/clients/{id}/users:
 *   get:
 *     summary: Lista usuários de um cliente (acessível pelo próprio cliente)
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (só pode ver próprio cliente)
 */
router.get('/:id/users', authMiddleware.authenticateApiKey, clientController.getClientUsers);

/**
 * @swagger
 * /api/clients/{id}/users/stats:
 *   get:
 *     summary: Obtém estatísticas dos usuários de um cliente
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Erro ao obter estatísticas
 *       401:
 *         description: Não autorizado
 */
router.get('/:id/users/stats', authMiddleware.authenticateApiKey, clientController.getClientUsersStats);

/**
 * @swagger
 * /api/clients/{id}/requests/stats:
 *   get:
 *     summary: Obtém estatísticas de requests de um cliente
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do cliente
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *         description: Período para as estatísticas
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Erro ao obter estatísticas
 *       401:
 *         description: Não autorizado
 */
router.get('/:id/requests/stats', authMiddleware.authenticateApiKey, clientController.getClientRequestsStats);

/**
 * @swagger
 * /api/clients/test/service:
 *   get:
 *     summary: Testa o serviço de clientes
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', clientController.testService);

module.exports = router; 