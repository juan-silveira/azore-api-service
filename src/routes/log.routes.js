const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     RequestLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do log
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID do cliente que fez a requisição
 *         method:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           description: Método HTTP
 *         path:
 *           type: string
 *           description: Caminho da requisição
 *         statusCode:
 *           type: integer
 *           description: Código de status da resposta
 *         responseTime:
 *           type: integer
 *           description: Tempo de resposta em milissegundos
 *         ipAddress:
 *           type: string
 *           description: Endereço IP do cliente
 *         userAgent:
 *           type: string
 *           description: User-Agent do cliente
 *         resourceType:
 *           type: string
 *           description: Tipo de recurso acessado
 *         action:
 *           type: string
 *           description: Ação realizada
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           description: Rede blockchain utilizada
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da transação
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID do cliente que iniciou a transação
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           description: Rede blockchain
 *         transactionType:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *           description: Tipo da transação
 *         status:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *           description: Status da transação
 *         txHash:
 *           type: string
 *           description: Hash da transação na blockchain
 *         fromAddress:
 *           type: string
 *           description: Endereço de origem
 *         toAddress:
 *           type: string
 *           description: Endereço de destino
 *         value:
 *           type: string
 *           description: Valor da transação em Wei
 *         gasUsed:
 *           type: integer
 *           description: Gas utilizado
 *         functionName:
 *           type: string
 *           description: Nome da função chamada
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: Data de submissão
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *           description: Data de confirmação
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 */

/**
 * @swagger
 * /api/logs/requests:
 *   get:
 *     summary: Lista logs de requisições
 *     tags: [Logs]
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *         description: Filtrar por código de status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por path, IP ou User-Agent
 *     responses:
 *       200:
 *         description: Logs listados com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/requests', logController.listRequestLogs);

/**
 * @swagger
 * /api/logs/transactions:
 *   get:
 *     summary: Lista transações
 *     tags: [Logs]
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *         description: Filtrar por tipo de transação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *     responses:
 *       200:
 *         description: Transações listadas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/transactions', logController.listTransactions);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Obtém estatísticas de logs
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *         description: Filtrar por tipo de transação
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/stats', logController.getLogStats);

/**
 * @swagger
 * /api/logs/errors:
 *   get:
 *     summary: Obtém logs de erro
 *     tags: [Logs]
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *     responses:
 *       200:
 *         description: Logs de erro obtidos com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/errors', logController.getErrorLogs);

/**
 * @swagger
 * /api/logs/transactions/pending:
 *   get:
 *     summary: Obtém transações pendentes
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limite de transações
 *     responses:
 *       200:
 *         description: Transações pendentes obtidas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/transactions/pending', logController.getPendingTransactions);

/**
 * @swagger
 * /api/logs/transactions/{txHash}:
 *   get:
 *     summary: Obtém transação por hash
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Transação encontrada
 *       404:
 *         description: Transação não encontrada
 */
router.get('/transactions/:txHash', logController.getTransactionByHash);

/**
 * @swagger
 * /api/logs/transactions/{transactionId}/status:
 *   put:
 *     summary: Atualiza status de transação
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da transação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, failed, cancelled]
 *                 description: Novo status da transação
 *               txHash:
 *                 type: string
 *                 description: Hash da transação (para confirmação)
 *               blockNumber:
 *                 type: integer
 *                 description: Número do bloco (para confirmação)
 *               gasUsed:
 *                 type: integer
 *                 description: Gas utilizado (para confirmação)
 *               receipt:
 *                 type: object
 *                 description: Receipt completo da transação
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Transação não encontrada
 */
router.put('/transactions/:transactionId/status', logController.updateTransactionStatus);

/**
 * @swagger
 * /api/logs/cleanup:
 *   post:
 *     summary: Limpa logs antigos
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: daysToKeep
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Número de dias para manter
 *     responses:
 *       200:
 *         description: Limpeza concluída com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.post('/cleanup', logController.cleanupOldLogs);

/**
 * @swagger
 * /api/logs/export:
 *   get:
 *     summary: Exporta logs
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           default: json
 *         description: Formato de exportação
 *     responses:
 *       200:
 *         description: Logs exportados com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/export', logController.exportLogs);

/**
 * @swagger
 * /api/logs/me/requests:
 *   get:
 *     summary: Obtém logs do cliente autenticado
 *     tags: [Logs]
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *         description: Filtrar por código de status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *     responses:
 *       200:
 *         description: Logs obtidos com sucesso
 *       401:
 *         description: Não autenticado
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/me/requests', logController.getMyLogs);

/**
 * @swagger
 * /api/logs/me/transactions:
 *   get:
 *     summary: Obtém transações do cliente autenticado
 *     tags: [Logs]
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *         description: Filtrar por tipo de transação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *     responses:
 *       200:
 *         description: Transações obtidas com sucesso
 *       401:
 *         description: Não autenticado
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/me/transactions', logController.getMyTransactions);

/**
 * @swagger
 * /api/logs/me/stats:
 *   get:
 *     summary: Obtém estatísticas do cliente autenticado
 *     tags: [Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *         description: Filtrar por tipo de transação
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       401:
 *         description: Não autenticado
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/me/stats', logController.getMyStats);

/**
 * @swagger
 * /api/logs/users/{userId}/requests:
 *   get:
 *     summary: Obtém logs de requisições de um usuário específico
 *     tags: [Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *         description: Filtrar por código de status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *     responses:
 *       200:
 *         description: Logs obtidos com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/:userId/requests', logController.getUserLogs);

/**
 * @swagger
 * /api/logs/users/{userId}/transactions:
 *   get:
 *     summary: Obtém transações de um usuário específico
 *     tags: [Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
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
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *         description: Filtrar por tipo de transação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *     responses:
 *       200:
 *         description: Transações obtidas com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/:userId/transactions', logController.getUserTransactions);

/**
 * @swagger
 * /api/logs/users/{userId}/stats:
 *   get:
 *     summary: Obtém estatísticas de um usuário específico
 *     tags: [Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read, wallet_creation]
 *         description: Filtrar por tipo de transação
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/:userId/stats', logController.getUserStats);

/**
 * @swagger
 * /api/logs/test/service:
 *   get:
 *     summary: Testa o serviço de logs
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', logController.testService);

module.exports = router; 