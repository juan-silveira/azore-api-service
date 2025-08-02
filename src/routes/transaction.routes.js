const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const { transactionRateLimiter } = require('../middleware/rateLimit.middleware');

/**
 * @swagger
 * components:
 *   schemas:
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
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário que iniciou a transação
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           description: Rede blockchain onde a transação foi executada
 *         transactionType:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read]
 *           description: Tipo da transação
 *         status:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *           description: Status da transação
 *         txHash:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{64}$'
 *           description: Hash da transação na blockchain
 *         blockNumber:
 *           type: integer
 *           description: Número do bloco onde a transação foi confirmada
 *         fromAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de origem da transação
 *         toAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de destino da transação
 *         functionName:
 *           type: string
 *           description: Nome da função chamada no contrato
 *         functionParams:
 *           type: array
 *           description: Parâmetros da função chamada
 *         gasUsed:
 *           type: integer
 *           description: Gas utilizado na transação
 *         gasPrice:
 *           type: string
 *           description: Preço do gas em Wei
 *         actualGasCost:
 *           type: string
 *           description: Custo real do gas em Wei
 *         metadata:
 *           type: object
 *           description: Metadados adicionais da transação
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da transação
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *           description: Data de confirmação da transação
 *     TransactionStats:
 *       type: object
 *       properties:
 *         totalTransactions:
 *           type: integer
 *           description: Total de transações
 *         confirmedCount:
 *           type: integer
 *           description: Número de transações confirmadas
 *         pendingCount:
 *           type: integer
 *           description: Número de transações pendentes
 *         failedCount:
 *           type: integer
 *           description: Número de transações falhadas
 *         totalGasCost:
 *           type: string
 *           description: Custo total do gas em Wei
 *         avgGasUsed:
 *           type: number
 *           description: Média de gas utilizado
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Obtém transações de um cliente
 *     tags: [Transactions]
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
 *           enum: [transfer, contract_deploy, contract_call, contract_read]
 *         description: Filtrar por tipo de transação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *     responses:
 *       200:
 *         description: Transações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/', transactionController.getTransactionsByClient);

/**
 * @swagger
 * /api/transactions/stats/overview:
 *   get:
 *     summary: Obtém estatísticas gerais de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TransactionStats'
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/overview', transactionController.getTransactionStats);

/**
 * @swagger
 * /api/transactions/stats/status:
 *   get:
 *     summary: Obtém estatísticas por status de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por status obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/status', transactionController.getStatusStats);

/**
 * @swagger
 * /api/transactions/stats/type:
 *   get:
 *     summary: Obtém estatísticas por tipo de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por tipo obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transactionType:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/type', transactionController.getTypeStats);

/**
 * @swagger
 * /api/transactions/test:
 *   get:
 *     summary: Testa o serviço de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Serviço testado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro no teste
 *       401:
 *         description: Não autorizado
 */
router.get('/test', transactionController.testService);

/**
 * @swagger
 * /api/transactions/{txHash}:
 *   get:
 *     summary: Obtém uma transação específica por hash
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{64}$'
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Transação obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Transação não encontrada
 */
router.get('/:txHash', transactionController.getTransactionByHash);

/**
 * @swagger
 * /api/transactions/stats/overview:
 *   get:
 *     summary: Obtém estatísticas gerais de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TransactionStats'
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/overview', transactionController.getTransactionStats);

/**
 * @swagger
 * /api/transactions/stats/status:
 *   get:
 *     summary: Obtém estatísticas por status de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por status obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/status', transactionController.getStatusStats);

/**
 * @swagger
 * /api/transactions/stats/type:
 *   get:
 *     summary: Obtém estatísticas por tipo de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por tipo obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transactionType:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/type', transactionController.getTypeStats);

/**
 * @swagger
 * /api/transactions/test:
 *   get:
 *     summary: Testa o serviço de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Serviço testado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro no teste
 *       401:
 *         description: Não autorizado
 */
router.get('/test', transactionController.testService);

/**
 * @swagger
 * /api/transactions/enqueue:
 *   post:
 *     summary: Enfileira uma transação da blockchain
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [mint, burn, transfer, send_transaction]
 *                 description: Tipo da transação
 *               data:
 *                 type: object
 *                 description: Dados específicos da transação
 *             required:
 *               - type
 *               - data
 *     responses:
 *       200:
 *         description: Transação enfileirada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                     type:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     estimatedProcessingTime:
 *                       type: string
 *                     rateLimit:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         remaining:
 *                           type: integer
 *                         resetTime:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       429:
 *         description: Rate limit excedido
 *         headers:
 *           X-RateLimit-Limit:
 *             description: Limite de requisições
 *             schema:
 *               type: string
 *           X-RateLimit-Remaining:
 *             description: Requisições restantes
 *             schema:
 *               type: string
 *           X-RateLimit-Reset:
 *             description: Timestamp de reset
 *             schema:
 *               type: string
 *           Retry-After:
 *             description: Segundos para aguardar
 *             schema:
 *               type: string
 */
router.post('/enqueue', authenticateApiKey, transactionRateLimiter, transactionController.enqueueBlockchainTransaction);

/**
 * @swagger
 * /api/transactions/queue/{jobId}:
 *   get:
 *     summary: Obtém o status de uma transação enfileirada
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do job da transação
 *     responses:
 *       200:
 *         description: Status da transação obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Erro ao obter status
 */
router.get('/queue/:jobId', transactionController.getQueuedTransactionStatus);

/**
 * @swagger
 * /api/transactions/queue/batch:
 *   post:
 *     summary: Obtém o status de múltiplas transações enfileiradas
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de Job IDs das transações
 *             required:
 *               - jobIds
 *     responses:
 *       200:
 *         description: Status das transações obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           jobId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         processing:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         queued:
 *                           type: integer
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Erro ao obter status
 */
router.post('/queue/batch', transactionController.getMultipleQueuedTransactionStatus);

module.exports = router; 