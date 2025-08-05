const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticateJWT } = require('../middleware/jwt.middleware');
const documentController = require('../controllers/document.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         originalName:
 *           type: string
 *         filename:
 *           type: string
 *         mimeType:
 *           type: string
 *         size:
 *           type: integer
 *         path:
 *           type: string
 *         url:
 *           type: string
 *         category:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         metadata:
 *           type: object
 *         isPublic:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         downloadCount:
 *           type: integer
 *         lastDownloaded:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     DocumentUploadRequest:
 *       type: object
 *       required:
 *         - filename
 *         - mimeType
 *         - size
 *         - content
 *       properties:
 *         filename:
 *           type: string
 *         mimeType:
 *           type: string
 *         size:
 *           type: integer
 *         content:
 *           type: string
 *           format: base64
 *         category:
 *           type: string
 *         tags:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *     DocumentUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         tags:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *     DocumentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             documents:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *     DocumentStats:
 *       type: object
 *       properties:
 *         totalDocuments:
 *           type: integer
 *         totalSize:
 *           type: integer
 *         documentsByCategory:
 *           type: object
 *         documentsByType:
 *           type: object
 *         recentUploads:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Document'
 */

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload de documento
 *     description: Faz upload de um documento para o MinIO
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentUploadRequest'
 *     responses:
 *       201:
 *         description: Documento enviado com sucesso
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
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: Dados inválidos ou arquivo não enviado
 *       401:
 *         description: Não autorizado
 *       413:
 *         description: Arquivo muito grande
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/upload',
  authenticateJWT,
  [
    body('filename').isString().trim(),
    body('mimeType').isString().trim(),
    body('size').isInt({ min: 1 }),
    body('content').isString().trim(),
    body('category').optional().isString().trim(),
    body('tags').optional().isString().trim(),
    body('isPublic').optional().isBoolean(),
    body('expiresAt').optional().isISO8601(),
    body('description').optional().isString().trim(),
    validateRequest
  ],
  documentController.uploadDocument
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Listar documentos
 *     description: Lista documentos do cliente com filtros e paginação
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
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
 *         description: Itens por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filtrar por tags (separadas por vírgula)
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filtrar por documentos públicos
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, size, downloadCount]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Ordem da ordenação
 *     responses:
 *       200:
 *         description: Lista de documentos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentListResponse'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/',
  authenticateJWT,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString().trim(),
    query('tags').optional().isString().trim(),
    query('isPublic').optional().isBoolean(),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isIn(['createdAt', 'name', 'size', 'downloadCount']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
    validateRequest
  ],
  documentController.getDocuments
);

/**
 * @swagger
 * /api/documents/{documentId}:
 *   get:
 *     summary: Obter documento específico
 *     description: Retorna detalhes de um documento específico
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: Detalhes do documento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:documentId',
  authenticateJWT,
  [
    param('documentId').isUUID(),
    validateRequest
  ],
  documentController.getDocument
);

/**
 * @swagger
 * /api/documents/{documentId}:
 *   put:
 *     summary: Atualizar documento
 *     description: Atualiza metadados de um documento
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentUpdateRequest'
 *     responses:
 *       200:
 *         description: Documento atualizado com sucesso
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
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:documentId',
  authenticateJWT,
  [
    param('documentId').isUUID(),
    body('name').optional().isString().trim(),
    body('category').optional().isString().trim(),
    body('tags').optional().isString().trim(),
    body('isPublic').optional().isBoolean(),
    body('expiresAt').optional().isISO8601(),
    body('description').optional().isString().trim(),
    validateRequest
  ],
  documentController.updateDocument
);

/**
 * @swagger
 * /api/documents/{documentId}:
 *   delete:
 *     summary: Excluir documento
 *     description: Exclui um documento do MinIO e banco de dados
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: Documento excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:documentId',
  authenticateJWT,
  [
    param('documentId').isUUID(),
    validateRequest
  ],
  documentController.deleteDocument
);

/**
 * @swagger
 * /api/documents/{documentId}/download:
 *   get:
 *     summary: Gerar URL de download
 *     description: Gera uma URL temporária para download do documento
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do documento
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: Tempo de expiração em segundos
 *     responses:
 *       200:
 *         description: URL de download gerada
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
 *                     downloadUrl:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:documentId/download',
  authenticateJWT,
  [
    param('documentId').isUUID(),
    query('expiresIn').optional().isInt({ min: 60, max: 86400 }), // 1 min a 24 horas
    validateRequest
  ],
  documentController.generateDownloadUrl
);

/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     summary: Estatísticas de documentos
 *     description: Retorna estatísticas dos documentos do cliente
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos documentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DocumentStats'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats',
  authenticateJWT,
  documentController.getDocumentStats
);

/**
 * @swagger
 * /api/documents/cleanup:
 *   post:
 *     summary: Limpar documentos expirados
 *     description: Remove documentos expirados do MinIO e banco de dados (admin)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpeza concluída
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
 *                     deletedCount:
 *                       type: integer
 *                     freedSpace:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/cleanup',
  authenticateJWT,
  documentController.cleanupExpiredDocuments
);

module.exports = router; 