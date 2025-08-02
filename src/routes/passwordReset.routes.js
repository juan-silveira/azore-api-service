const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordReset.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const { authenticateAdmin } = require('../middleware/admin.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PasswordResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email do client
 *       example:
 *         email: "admin@azore.technology"
 *     
 *     PasswordResetResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: Token de recuperação (apenas em desenvolvimento)
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: Data de expiração do token
 *     
 *     PasswordResetValidation:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             expiresAt:
 *               type: string
 *               format: date-time
 *     
 *     PasswordResetNewPassword:
 *       type: object
 *       required:
 *         - newPassword
 *       properties:
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Nova senha
 *       example:
 *         newPassword: "novaSenha123"
 */

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     summary: Solicita recuperação de senha
 *     description: Envia um token de recuperação para o email informado
 *     tags: [Recuperação de Senha]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Token de recuperação gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetResponse'
 *       400:
 *         description: Email não encontrado ou conta inativa
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/request', passwordResetController.requestPasswordReset);

/**
 * @swagger
 * /api/password-reset/validate/{token}:
 *   get:
 *     summary: Valida um token de recuperação
 *     description: Verifica se um token de recuperação é válido
 *     tags: [Recuperação de Senha]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de recuperação
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetValidation'
 *       400:
 *         description: Token inválido, expirado ou já utilizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/validate/:token', passwordResetController.validateResetToken);

/**
 * @swagger
 * /api/password-reset/reset/{token}:
 *   post:
 *     summary: Redefine a senha usando um token
 *     description: Redefine a senha do client usando um token válido
 *     tags: [Recuperação de Senha]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de recuperação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetNewPassword'
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
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
 *                     email:
 *                       type: string
 *                     isFirstAccess:
 *                       type: boolean
 *       400:
 *         description: Token inválido ou nova senha inválida
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/reset/:token', passwordResetController.resetPassword);

/**
 * @swagger
 * /api/password-reset/cleanup:
 *   post:
 *     summary: Limpa tokens expirados
 *     description: Marca tokens expirados como utilizados (endpoint administrativo)
 *     tags: [Recuperação de Senha - Admin]
 *     security:
 *       - apiKey: []
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
 *                     cleanedCount:
 *                       type: number
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/cleanup', authenticateApiKey, passwordResetController.cleanupExpiredTokens);

/**
 * @swagger
 * /api/password-reset/stats:
 *   get:
 *     summary: Obtém estatísticas de tokens
 *     description: Retorna estatísticas sobre tokens de recuperação (endpoint administrativo)
 *     tags: [Recuperação de Senha - Admin]
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas
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
 *                     total:
 *                       type: number
 *                     used:
 *                       type: number
 *                     unused:
 *                       type: number
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', authenticateApiKey, passwordResetController.getTokenStats);

module.exports = router; 