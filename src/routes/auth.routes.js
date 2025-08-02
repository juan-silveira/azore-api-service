const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateSession, requirePasswordChange } = require('../middleware/session.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email do client
 *         password:
 *           type: string
 *           description: Senha do client
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Senha atual
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Nova senha (mínimo 6 caracteres)
 *     SessionTimeoutRequest:
 *       type: object
 *       required:
 *         - timeout
 *       properties:
 *         timeout:
 *           type: integer
 *           minimum: 0
 *           description: Timeout da sessão em segundos (0 = sem expiração)
 *     GenerateApiKeyRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nome da API Key
 *         description:
 *           type: string
 *           description: Descrição da API Key (opcional)
 *     EditApiKeyRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Novo nome da API Key
 *         description:
 *           type: string
 *           description: Nova descrição da API Key (opcional)
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             sessionToken:
 *               type: string
 *               description: Token da sessão (não retornado no primeiro acesso)
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: Data de expiração da sessão
 *             timeout:
 *               type: integer
 *               description: Timeout da sessão em segundos
 *             isFirstAccess:
 *               type: boolean
 *               description: Indica se é o primeiro acesso
 *             apiKeys:
 *               type: array
 *               description: Lista de API Keys do cliente
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   lastUsedAt:
 *                     type: string
 *                     format: date-time
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *             client:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 permissions:
 *                   type: object
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login do client
 *     description: Realiza login do client com email e senha
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Dados inválidos ou email/senha inválidos
 *       403:
 *         description: Client inativo
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout do client
 *     description: Invalida a sessão atual do client
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Token de sessão inválido
 */
router.post('/logout', authenticateSession, authController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Alterar senha
 *     description: Altera a senha do client (usado no primeiro acesso)
 *     tags: [Autenticação]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Senha atual inválida
 */
router.post('/change-password', authenticateSession, authController.changePassword);

/**
 * @swagger
 * /api/auth/generate-api-key:
 *   post:
 *     summary: Gerar API Key
 *     description: Gera uma nova API Key para o client autenticado
 *     tags: [API Keys]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateApiKeyRequest'
 *     responses:
 *       200:
 *         description: API Key gerada com sucesso
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     apiKey:
 *                       type: string
 *                       description: Nova API Key gerada (retornada apenas uma vez)
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token de sessão inválido
 *       403:
 *         description: Primeiro acesso detectado
 */
router.post('/generate-api-key', authenticateSession, requirePasswordChange, authController.generateApiKey);

/**
 * @swagger
 * /api/auth/api-keys:
 *   get:
 *     summary: Listar API Keys
 *     description: Lista todas as API Keys do client autenticado
 *     tags: [API Keys]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: API Keys listadas com sucesso
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
 *                     apiKeys:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastUsedAt:
 *                             type: string
 *                             format: date-time
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Token de sessão inválido
 */
router.get('/api-keys', authenticateSession, authController.listApiKeys);

/**
 * @swagger
 * /api/auth/api-keys/{apiKeyId}/revoke:
 *   post:
 *     summary: Revogar API Key
 *     description: Revoga uma API Key específica do client autenticado
 *     tags: [API Keys]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: apiKeyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da API Key a ser revogada
 *     responses:
 *       200:
 *         description: API Key revogada com sucesso
 *       400:
 *         description: ID da API Key é obrigatório
 *       401:
 *         description: Token de sessão inválido
 *       404:
 *         description: API Key não encontrada
 */
router.post('/api-keys/:apiKeyId/revoke', authenticateSession, requirePasswordChange, authController.revokeApiKey);

/**
 * @swagger
 * /api/auth/api-keys/{apiKeyId}/edit:
 *   put:
 *     summary: Editar API Key
 *     description: Edita informações de uma API Key específica
 *     tags: [API Keys]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: apiKeyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da API Key a ser editada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditApiKeyRequest'
 *     responses:
 *       200:
 *         description: API Key editada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token de sessão inválido
 *       404:
 *         description: API Key não encontrada
 */
router.put('/api-keys/:apiKeyId/edit', authenticateSession, requirePasswordChange, authController.editApiKey);

/**
 * @swagger
 * /api/auth/session-timeout:
 *   post:
 *     summary: Configurar timeout da sessão
 *     description: Define o timeout da sessão em segundos
 *     tags: [Autenticação]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionTimeoutRequest'
 *     responses:
 *       200:
 *         description: Timeout configurado com sucesso
 *       400:
 *         description: Timeout inválido
 *       401:
 *         description: Token de sessão inválido
 */
router.post('/session-timeout', authenticateSession, requirePasswordChange, authController.setSessionTimeout);

/**
 * @swagger
 * /api/auth/session-info:
 *   get:
 *     summary: Informações da sessão
 *     description: Obtém informações da sessão atual
 *     tags: [Autenticação]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Informações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Token de sessão inválido
 */
router.get('/session-info', authenticateSession, authController.getSessionInfo);

module.exports = router; 