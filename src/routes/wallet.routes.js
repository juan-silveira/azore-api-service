const express = require('express');
const walletController = require('../controllers/wallet.controller');

const router = express.Router();

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Cria uma nova carteira
 *     description: Gera uma nova carteira Ethereum e salva no banco de dados
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               externalSystemId:
 *                 type: string
 *                 description: ID do usuário no sistema externo (opcional)
 *               userId:
 *                 type: string
 *                 description: ID do usuário (usado como externalSystemId se não fornecido)
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do cliente (opcional, usa o client autenticado se não fornecido)
 *               metadata:
 *                 type: object
 *                 description: Metadados adicionais da carteira
 *     responses:
 *       201:
 *         description: Carteira criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Carteira criada com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     publicAddress:
 *                       type: string
 *                     externalSystemId:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Dados inválidos
 */
router.post('/', walletController.createWallet);

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Lista todas as carteiras
 *     description: Retorna uma lista paginada de todas as carteiras
 *     tags: [Wallets]
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
 *     responses:
 *       200:
 *         description: Lista de carteiras obtida com sucesso
 */
router.get('/', walletController.listWallets);

/**
 * @swagger
 * /api/wallets/{idOrAddress}:
 *   get:
 *     summary: Busca uma carteira por ID ou endereço
 *     description: Retorna os dados de uma carteira específica usando ID ou endereço
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: idOrAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da carteira (UUID) ou endereço da carteira (0x...)
 *     responses:
 *       200:
 *         description: Carteira encontrada com sucesso
 *       404:
 *         description: Carteira não encontrada
 *       400:
 *         description: ID ou endereço inválido
 */
router.get('/:idOrAddress', walletController.getWalletByIdOrAddress);

/**
 * @swagger
 * /api/wallets/{address}/balance:
 *   get:
 *     summary: Obtém o saldo de uma carteira
 *     description: Consulta o saldo de uma carteira na blockchain
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Saldo obtido com sucesso
 */
router.get('/:address/balance', walletController.getWalletBalance);

/**
 * @swagger
 * /api/wallets/{address}/metadata:
 *   put:
 *     summary: Atualiza metadados de uma carteira
 *     description: Atualiza os metadados de uma carteira específica
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: Novos metadados da carteira
 *     responses:
 *       200:
 *         description: Metadados atualizados com sucesso
 */
router.put('/:address/metadata', walletController.updateWalletMetadata);

/**
 * @swagger
 * /api/wallets/{address}/deactivate:
 *   post:
 *     summary: Desativa uma carteira
 *     description: Marca uma carteira como inativa
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira
 *     responses:
 *       200:
 *         description: Carteira desativada com sucesso
 */
router.post('/:address/deactivate', walletController.deactivateWallet);

/**
 * @swagger
 * /api/wallets/{address}/activate:
 *   post:
 *     summary: Reativa uma carteira
 *     description: Marca uma carteira como ativa
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira
 *     responses:
 *       200:
 *         description: Carteira reativada com sucesso
 */
router.post('/:address/activate', walletController.activateWallet);

/**
 * @swagger
 * /api/wallets/external/{externalSystemId}:
 *   get:
 *     summary: Busca carteiras por ID do sistema externo
 *     description: Retorna todas as carteiras de um usuário específico
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: externalSystemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário no sistema externo
 *     responses:
 *       200:
 *         description: Carteiras encontradas com sucesso
 */
router.get('/external/:externalSystemId', walletController.getWalletsByExternalId);

/**
 * @swagger
 * /api/wallets/{fromAddress}/transfer-aze:
 *   post:
 *     summary: Transfere AZE nativo entre carteiras
 *     description: Executa uma transferência de AZE nativo da carteira de origem para a carteira de destino
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: fromAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira de origem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toAddress
 *               - amount
 *             properties:
 *               toAddress:
 *                 type: string
 *                 description: Endereço da carteira de destino
 *               amount:
 *                 type: string
 *                 description: Quantidade de AZE a transferir
 *               network:
 *                 type: string
 *                 enum: [mainnet, testnet]
 *                 default: testnet
 *                 description: Rede para executar a transação
 *               options:
 *                 type: object
 *                 description: Opções da transação (gasLimit, etc.)
 *     responses:
 *       200:
 *         description: Transferência executada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:fromAddress/transfer-aze', walletController.transferAZE);

/**
 * @swagger
 * /api/wallets/test/service:
 *   get:
 *     summary: Testa o serviço de carteiras
 *     description: Executa testes completos do serviço de carteiras
 *     tags: [Wallets]
 *     responses:
 *       200:
 *         description: Teste realizado com sucesso
 *       500:
 *         description: Falha no teste
 */
router.get('/test/service', walletController.testService);



module.exports = router; 