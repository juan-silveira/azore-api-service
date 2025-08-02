const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - cpf
 *         - clientId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         cpf:
 *           type: string
 *           description: CPF do usuário (apenas números)
 *         phone:
 *           type: string
 *           description: Telefone do usuário
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Data de nascimento
 *         publicKey:
 *           type: string
 *           description: Chave pública do usuário
 *         privateKey:
 *           type: string
 *           description: Chave privada do usuário
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID do client ao qual o usuário pertence
 *         isActive:
 *           type: boolean
 *           description: Se o usuário está ativo
 *         metadata:
 *           type: object
 *           description: Metadados adicionais do usuário
 *         lastActivityAt:
 *           type: string
 *           format: date-time
 *           description: Última atividade do usuário
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
 * /api/users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /api/users/test/service:
 *   get:
 *     summary: Testa o serviço de usuários
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', userController.testService);

/**
 * /api/users:
 *   get:
 *     summary: Lista usuários com paginação
 *     tags: [Users]
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
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por client ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email ou CPF
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/', userController.listUsers);

/**
 * @swagger
 * /api/users/address/{address}:
 *   get:
 *     summary: Obtém um usuário por endereço (publicKey)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço (publicKey) do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/address/:address', userController.getUserByAddress);

/**
 * @swagger
 * /api/users/address/{address}/balances:
 *   get:
 *     summary: Lista saldos de um usuário por endereço
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do usuário
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *         description: Rede para consultar (mainnet ou testnet)
 *     responses:
 *       200:
 *         description: Saldos obtidos com sucesso
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
 *                     address:
 *                       type: string
 *                     network:
 *                       type: string
 *                     azeBalance:
 *                       type: object
 *                       properties:
 *                         balanceWei:
 *                           type: string
 *                         balanceEth:
 *                           type: string
 *                     tokenBalances:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           contractAddress:
 *                             type: string
 *                           tokenName:
 *                             type: string
 *                           tokenSymbol:
 *                             type: string
 *                           tokenDecimals:
 *                             type: integer
 *                           balanceWei:
 *                             type: string
 *                           balanceEth:
 *                             type: string
 *                     totalTokens:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Endereço inválido ou erro na consulta
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/address/:address/balances', userController.getUserBalances);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtém um usuário por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/users/email/{email}:
 *   get:
 *     summary: Obtém um usuário por email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/email/:email', userController.getUserByEmail);

/**
 * @swagger
 * /api/users/cpf/{cpf}:
 *   get:
 *     summary: Obtém um usuário por CPF
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/cpf/:cpf', userController.getUserByCpf);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id', userController.updateUser);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   post:
 *     summary: Desativa um usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário desativado com sucesso
 *       400:
 *         description: Erro ao desativar
 */
router.post('/:id/deactivate', userController.deactivateUser);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   post:
 *     summary: Reativa um usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário reativado com sucesso
 *       400:
 *         description: Erro ao reativar
 */
router.post('/:id/activate', userController.activateUser);

/**
 * @swagger
 * /api/users/client/{clientId}:
 *   get:
 *     summary: Obtém usuários de um client específico
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do client
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
 *         description: Buscar por nome, email ou CPF
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Lista de usuários do client
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/client/:clientId', userController.getUsersByClientId);

/**
 * @swagger
 * /api/users/{userId}/keys:
 *   get:
 *     summary: Obtém chaves públicas e privadas de um usuário (Admin)
 *     tags: [Users]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Chaves obtidas com sucesso
 *       400:
 *         description: Erro ao obter chaves
 *       401:
 *         description: Não autorizado
 */
router.get('/:userId/keys', userController.getUserKeysAdmin);

/**
 * @swagger
 * /api/users/{userId}/keys/client:
 *   get:
 *     summary: Obtém chaves públicas e privadas de um usuário (Client)
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: Chaves obtidas com sucesso
 *       400:
 *         description: Erro ao obter chaves
 *       401:
 *         description: Não autorizado
 */
router.get('/:userId/keys/client', userController.getUserKeysClient);

/**
 * @swagger
 * /api/users/search/{type}/{value}/keys:
 *   get:
 *     summary: Busca usuário por diferentes critérios e retorna chaves
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, email, cpf]
 *         description: Tipo de busca (id, email, cpf)
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Valor para busca
 *     responses:
 *       200:
 *         description: Usuário encontrado com sucesso
 *       400:
 *         description: Erro ao buscar usuário
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/search/:type/:value/keys', userController.searchUserKeys);

module.exports = router; 