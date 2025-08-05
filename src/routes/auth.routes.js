const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/jwt.middleware');

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
 *             accessToken:
 *               type: string
 *               description: Access token JWT
 *             refreshToken:
 *               type: string
 *               description: Refresh token JWT
 *             expiresIn:
 *               type: integer
 *               description: Tempo de expiração do access token em segundos
 *             refreshExpiresIn:
 *               type: integer
 *               description: Tempo de expiração do refresh token em segundos
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
router.post('/logout', authenticateJWT, authController.logout);

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
router.post('/change-password', authenticateJWT, authController.changePassword);

/**
 * @swagger
 * /api/auth/generate-api-key:
 *   post:
 *     summary: Gerar API Key
 *     description: Gera uma nova API Key para o client autenticado
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
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
router.post('/generate-api-key', authenticateJWT, authController.generateApiKey);

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
router.get('/api-keys', authenticateJWT, authController.listApiKeys);

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
router.post('/api-keys/:apiKeyId/revoke', authenticateJWT, authController.revokeApiKey);

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
router.put('/api-keys/:apiKeyId/edit', authenticateJWT, authController.editApiKey);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     description: Renova o access token usando um refresh token válido
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token válido
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
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
 *                     accessToken:
 *                       type: string
 *                       description: Novo access token
 *                     expiresIn:
 *                       type: integer
 *                       description: Tempo de expiração em segundos
 *       400:
 *         description: Refresh token é obrigatório
 *       401:
 *         description: Refresh token inválido ou expirado
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Informações do usuário atual
 *     description: Obtém informações do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações obtidas com sucesso
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         permissions:
 *                           type: object
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isApiAdmin:
 *                           type: boolean
 *                         isClientAdmin:
 *                           type: boolean
 *       401:
 *         description: Token inválido
 */
router.get('/me', authenticateJWT, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/test-blacklist:
 *   get:
 *     summary: Testa a blacklist do Redis
 *     description: Testa a funcionalidade da blacklist de tokens JWT
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teste realizado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test-blacklist', authenticateJWT, authController.testBlacklist);

module.exports = router; 