const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const { requireAnyAdmin } = require('../middleware/admin.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     QueueStats:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             queues:
 *               type: object
 *             processing:
 *               type: object
 *             timestamp:
 *               type: string
 *     JobStatus:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             jobId:
 *               type: string
 *             status:
 *               type: object
 *             timestamp:
 *               type: string
 */

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Obtém estatísticas das filas
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueStats'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getQueueStats(req, res));

/**
 * @swagger
 * /api/queue/jobs/{jobId}:
 *   get:
 *     summary: Obtém o status de um job específico
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do job
 *     responses:
 *       200:
 *         description: Status do job obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobStatus'
 *       400:
 *         description: Job ID é obrigatório
 *       404:
 *         description: Job não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/jobs/:jobId', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getJobStatus(req, res));

/**
 * @swagger
 * /api/queue/jobs:
 *   get:
 *     summary: Obtém jobs em processamento
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por status (processing, completed, failed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *     responses:
 *       200:
 *         description: Jobs obtidos com sucesso
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
 *                     jobs:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/jobs', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getProcessingJobs(req, res));

/**
 * @swagger
 * /api/queue/jobs/failed:
 *   get:
 *     summary: Obtém jobs que falharam
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite de resultados
 *     responses:
 *       200:
 *         description: Jobs falhados obtidos com sucesso
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
 *                     failedJobs:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/jobs/failed', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getFailedJobs(req, res));

/**
 * @swagger
 * /api/queue/jobs/{jobId}/retry:
 *   post:
 *     summary: Retenta um job falhado
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do job
 *     responses:
 *       200:
 *         description: Job adicionado para retry
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
 *                     jobId:
 *                       type: string
 *                     message:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Job ID é obrigatório ou job não pode ser retentado
 *       404:
 *         description: Job não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/jobs/:jobId/retry', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.retryFailedJob(req, res));

/**
 * @swagger
 * /api/queue/cleanup:
 *   post:
 *     summary: Limpa jobs antigos
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jobs antigos limpos com sucesso
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
 *                     message:
 *                       type: string
 *                     cleanedCount:
 *                       type: integer
 *                     remainingJobs:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/cleanup', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.cleanupOldJobs(req, res));

/**
 * @swagger
 * /api/queue/queues/{queueName}:
 *   get:
 *     summary: Obtém informações detalhadas de uma fila específica
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da fila
 *     responses:
 *       200:
 *         description: Informações da fila obtidas com sucesso
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
 *                     queueName:
 *                       type: string
 *                     stats:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Nome da fila é obrigatório
 *       404:
 *         description: Fila não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/queues/:queueName', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getQueueDetails(req, res));

/**
 * @swagger
 * /api/queue/metrics:
 *   get:
 *     summary: Obtém métricas de performance das filas
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas obtidas com sucesso
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
 *                     totalQueues:
 *                       type: integer
 *                     totalMessages:
 *                       type: integer
 *                     totalConsumers:
 *                       type: integer
 *                     processingJobs:
 *                       type: integer
 *                     completedJobs:
 *                       type: integer
 *                     failedJobs:
 *                       type: integer
 *                     successRate:
 *                       type: string
 *                     averageProcessingTime:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/metrics', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getQueueMetrics(req, res));

/**
 * @swagger
 * /api/queue/queues/{queueName}/logs:
 *   get:
 *     summary: Obtém logs de uma fila específica
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da fila
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limite de resultados
 *     responses:
 *       200:
 *         description: Logs obtidos com sucesso
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
 *                     queueName:
 *                       type: string
 *                     logs:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/queues/:queueName/logs', authenticateApiKey, requireAnyAdmin, (req, res) => queueController.getQueueLogs(req, res));

module.exports = router; 