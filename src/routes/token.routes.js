const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenBalance:
 *       type: object
 *       required:
 *         - contractAddress
 *         - walletAddress
 *       properties:
 *         contractAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato do token
 *         walletAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço da carteira
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *           description: Rede do token
 *     TokenMint:
 *       type: object
 *       required:
 *         - contractAddress
 *         - toAddress
 *         - amount
 *         - gasPayer
 *       properties:
 *         contractAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato do token
 *         toAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço que receberá os tokens
 *         amount:
 *           type: string
 *           description: Quantidade em ETH (será convertida para wei)
 *         gasPayer:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do pagador de gás da transação
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *           description: Rede do token
 *         options:
 *           type: object
 *           description: Opções da transação (gasLimit, etc.)
 *     TokenBurn:
 *       type: object
 *       required:
 *         - contractAddress
 *         - fromAddress
 *         - amount
 *         - gasPayer
 *       properties:
 *         contractAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato do token
 *         fromAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de onde os tokens serão queimados
 *         amount:
 *           type: string
 *           description: Quantidade em ETH (será convertida para wei)
 *         gasPayer:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do pagador de gás da transação
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *           description: Rede do token
 *         options:
 *           type: object
 *           description: Opções da transação (gasLimit, etc.)
 *     TokenTransfer:
 *       type: object
 *       required:
 *         - contractAddress
 *         - fromAddress
 *         - toAddress
 *         - amount
 *         - gasPayer
 *       properties:
 *         contractAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato do token
 *         fromAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de origem
 *         toAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de destino
 *         amount:
 *           type: string
 *           description: Quantidade em ETH (será convertida para wei)
 *         gasPayer:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do pagador de gás da transação
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *           description: Rede do token
 *         options:
 *           type: object
 *           description: Opções da transação (gasLimit, etc.)
 *     TokenRegistration:
 *       type: object
 *       required:
 *         - address
 *         - adminPublicKey
 *       properties:
 *         address:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato do token
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *           description: Rede do token
 *         adminPublicKey:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: PublicKey do admin do token
 *         website:
 *           type: string
 *           description: Website do token
 *         description:
 *           type: string
 *           description: Descrição do token
 */

/**
 * @swagger
 * /api/tokens/balance:
 *   get:
 *     summary: Obtém o saldo de um token ERC20
 *     tags: [Tokens]
 *     parameters:
 *       - in: query
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato do token
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *         description: Rede do token
 *     responses:
 *       200:
 *         description: Saldo do token obtido com sucesso
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
 *                     contractAddress:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     balanceWei:
 *                       type: string
 *                     balanceEth:
 *                       type: string
 *                     network:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/balance', tokenController.getTokenBalance);

/**
 * @swagger
 * /api/tokens/balanceAZE:
 *   get:
 *     summary: Obtém o saldo da moeda nativa AZE
 *     tags: [Tokens]
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *         description: Rede da moeda
 *     responses:
 *       200:
 *         description: Saldo da moeda AZE obtido com sucesso
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
 *                     walletAddress:
 *                       type: string
 *                     balanceWei:
 *                       type: string
 *                     balanceEth:
 *                       type: string
 *                     network:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/balanceAZE', tokenController.getAzeBalance);

/**
 * @swagger
 * /api/tokens/mint:
 *   post:
 *     summary: Executa função mint do token (requer gás)
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenMint'
 *     responses:
 *       200:
 *         description: Tokens mintados com sucesso
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
 *                     contractAddress:
 *                       type: string
 *                     functionName:
 *                       type: string
 *                     params:
 *                       type: array
 *                     transactionHash:
 *                       type: string
 *                     gasUsed:
 *                       type: string
 *                     network:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     amountWei:
 *                       type: string
 *                     amountEth:
 *                       type: string
 *                     toAddress:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 */
router.post('/mint', tokenController.mintToken);

/**
 * @swagger
 * /api/tokens/burn:
 *   post:
 *     summary: Executa função burnFrom do token (requer gás)
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenBurn'
 *     responses:
 *       200:
 *         description: Tokens queimados com sucesso
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
 *                     contractAddress:
 *                       type: string
 *                     functionName:
 *                       type: string
 *                     params:
 *                       type: array
 *                     transactionHash:
 *                       type: string
 *                     gasUsed:
 *                       type: string
 *                     network:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     amountWei:
 *                       type: string
 *                     amountEth:
 *                       type: string
 *                     fromAddress:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 */
router.post('/burn', tokenController.burnFromToken);

/**
 * @swagger
 * /api/tokens/transfer-gasless:
 *   post:
 *     summary: Executa função transferFromGasless do token (requer gás)
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenTransfer'
 *     responses:
 *       200:
 *         description: Transferência sem gás executada com sucesso
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
 *                     contractAddress:
 *                       type: string
 *                     functionName:
 *                       type: string
 *                     params:
 *                       type: array
 *                     transactionHash:
 *                       type: string
 *                     gasUsed:
 *                       type: string
 *                     network:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     amountWei:
 *                       type: string
 *                     amountEth:
 *                       type: string
 *                     fromAddress:
 *                       type: string
 *                     toAddress:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 */
router.post('/transfer-gasless', tokenController.transferFromGasless);

/**
 * @swagger
 * /api/tokens/register:
 *   post:
 *     summary: Registra ou atualiza um contrato de token no sistema
 *     description: Consulta dados reais do token na blockchain (name, symbol, totalSupply, decimals) e registra/atualiza no banco de dados
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenRegistration'
 *     responses:
 *       200:
 *         description: Token atualizado com sucesso
 *       201:
 *         description: Token registrado com sucesso
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
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     network:
 *                       type: string
 *                     contractType:
 *                       type: string
 *                     metadata:
 *                       type: object
 *                     tokenInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         symbol:
 *                           type: string
 *                         initialSupply:
 *                           type: number
 *                         decimals:
 *                           type: number
 *       400:
 *         description: Dados inválidos
 */
router.post('/register', tokenController.registerToken);

/**
 * @swagger
 * /api/tokens/{contractAddress}/info:
 *   get:
 *     summary: Obtém informações básicas do token
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato do token
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *           default: testnet
 *         description: Rede do token
 *     responses:
 *       200:
 *         description: Informações do token obtidas com sucesso
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
 *                     contractAddress:
 *                       type: string
 *                     name:
 *                       type: string
 *                     symbol:
 *                       type: string
 *                     decimals:
 *                       type: number
 *                     totalSupplyWei:
 *                       type: string
 *                     totalSupplyEth:
 *                       type: string
 *                     network:
 *                       type: string
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Token não encontrado
 */
router.get('/:contractAddress/info', tokenController.getTokenInfo);

/**
 * @swagger
 * /api/tokens/{contractAddress}/update-info:
 *   put:
 *     summary: Atualiza informações do token
 *     description: Atualiza metadados do token como description, website e explorer
 *     tags: [Tokens]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Endereço do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Nova descrição do token
 *               website:
 *                 type: string
 *                 description: Novo website do token
 *               explorer:
 *                 type: string
 *                 description: Novo explorer do token
 *     responses:
 *       200:
 *         description: Informações atualizadas com sucesso
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
 *                     address:
 *                       type: string
 *                     updatedFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Token não encontrado ou dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put('/:contractAddress/update-info', tokenController.updateTokenInfo);

/**
 * @swagger
 * /api/tokens/test/service:
 *   get:
 *     summary: Testa o serviço de tokens
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
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
 *                     balanceTest:
 *                       type: boolean
 *                     infoTest:
 *                       type: boolean
 *                     testTokenAddress:
 *                       type: string
 *                     testWalletAddress:
 *                       type: string
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', tokenController.testService);

/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: Lista todos os tokens registrados (NATIVE e ERC20)
 *     tags: [Tokens]
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
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: contractType
 *         schema:
 *           type: string
 *           enum: [NATIVE, ERC20]
 *         description: Filtrar por tipo de contrato
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *     responses:
 *       200:
 *         description: Lista de tokens obtida com sucesso
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
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           network:
 *                             type: string
 *                           contractType:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           metadata:
 *                             type: object
 *                           adminPublicKey:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/', tokenController.listTokens);

/**
 * @swagger
 * /api/tokens/{contractAddress}/deactivate:
 *   post:
 *     summary: Desativa um token
 *     description: Muda o status is_active para false
 *     tags: [Tokens]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Token desativado com sucesso
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
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Token não encontrado
 *       401:
 *         description: Não autorizado
 */
router.post('/:contractAddress/deactivate', tokenController.deactivateToken);

/**
 * @swagger
 * /api/tokens/{contractAddress}/activate:
 *   post:
 *     summary: Ativa um token
 *     description: Muda o status is_active para true
 *     tags: [Tokens]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Token ativado com sucesso
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
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Token não encontrado
 *       401:
 *         description: Não autorizado
 */
router.post('/:contractAddress/activate', tokenController.activateToken);

module.exports = router; 