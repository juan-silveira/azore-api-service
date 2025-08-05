const express = require('express');
const testController = require('../controllers/test.controller');

const router = express.Router();

/**
 * @swagger
 * /api/test/connection:
 *   get:
 *     summary: Testa a conexão com a blockchain
 *     description: Verifica se a API consegue se conectar com a blockchain Azore
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para testar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Conexão estabelecida com sucesso
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
 *                   example: Conexão com a blockchain estabelecida com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     network:
 *                       type: string
 *                     chainId:
 *                       type: number
 *                     blockNumber:
 *                       type: string
 *                     gasPrice:
 *                       type: string
 *       500:
 *         description: Erro na conexão
 */
router.get('/connection', testController.testConnection);

/**
 * @swagger
 * /api/test/network-info:
 *   get:
 *     summary: Obtém informações da rede atual
 *     description: Retorna informações sobre a rede blockchain configurada
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Informações da rede obtidas com sucesso
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     chainId:
 *                       type: number
 *                     rpcUrl:
 *                       type: string
 *                     defaultNetwork:
 *                       type: string
 */
router.get('/network-info', testController.getNetworkInfo);

/**
 * @swagger
 * /api/test/balance/{address}:
 *   get:
 *     summary: Consulta o saldo de um endereço
 *     description: Obtém o saldo em ETH de um endereço específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço Ethereum para consultar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Saldo consultado com sucesso
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: string
 *                       description: Saldo em Wei
 *                     balanceEth:
 *                       type: string
 *                       description: Saldo em ETH
 *                     address:
 *                       type: string
 *                     network:
 *                       type: string
 *       400:
 *         description: Endereço inválido
 *       500:
 *         description: Erro na consulta
 */
router.get('/balance/:address', testController.getBalance);

/**
 * @swagger
 * /api/test/block/{blockNumber}:
 *   get:
 *     summary: Obtém informações de um bloco
 *     description: Retorna informações detalhadas de um bloco específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco ou 'latest' para o mais recente
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/block/:blockNumber?', testController.getBlock);

/**
 * @swagger
 * /api/test/transaction/{txHash}:
 *   get:
 *     summary: Obtém informações de uma transação
 *     description: Retorna informações detalhadas de uma transação específica
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/transaction/:txHash', testController.getTransaction);

/**
 * @swagger
 * /api/test/gas-price:
 *   get:
 *     summary: Obtém o preço atual do gás
 *     description: Retorna o preço atual do gás na rede
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Preço do gás obtido com sucesso
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
 *                     gasPriceWei:
 *                       type: string
 *                     gasPriceGwei:
 *                       type: string
 *                     network:
 *                       type: string
 */
router.get('/gas-price', testController.getGasPrice);

/**
 * @swagger
 * /api/test/network:
 *   get:
 *     summary: Obtém informações da rede
 *     description: Retorna informações sobre a rede blockchain
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações da rede obtidas com sucesso
 */
router.get('/network', testController.getNetwork);

/**
 * @swagger
 * /api/test/blockchain/connection:
 *   get:
 *     summary: Testa a conexão com a blockchain
 *     description: Verifica se a API consegue se conectar com a blockchain Azore
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para testar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Conexão estabelecida com sucesso
 *       500:
 *         description: Erro na conexão
 */
router.get('/blockchain/connection', testController.testConnection);

/**
 * @swagger
 * /api/test/blockchain/network-info:
 *   get:
 *     summary: Obtém informações da rede atual
 *     description: Retorna informações sobre a rede blockchain configurada
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Informações da rede obtidas com sucesso
 */
router.get('/blockchain/network-info', testController.getNetworkInfo);

/**
 * @swagger
 * /api/test/blockchain/latest-block:
 *   get:
 *     summary: Obtém o bloco mais recente
 *     description: Retorna informações do bloco mais recente da blockchain
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 */
router.get('/blockchain/latest-block', testController.getLatestBlock);

/**
 * @swagger
 * /api/test/blockchain/blocks/{blockNumber}:
 *   get:
 *     summary: Obtém informações de um bloco específico
 *     description: Retorna informações detalhadas de um bloco específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/blockchain/blocks/:blockNumber', testController.getBlock);

/**
 * @swagger
 * /api/test/blockchain/transactions/{transactionHash}:
 *   get:
 *     summary: Obtém informações de uma transação
 *     description: Retorna informações detalhadas de uma transação específica
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Informações da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/blockchain/transactions/:transactionHash', testController.getTransaction);

/**
 * @swagger
 * /api/test/blockchain/wallets/{walletAddress}/balance:
 *   get:
 *     summary: Consulta o saldo de uma carteira
 *     description: Obtém o saldo em ETH de um endereço específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira para consultar
 *     responses:
 *       200:
 *         description: Saldo consultado com sucesso
 *       400:
 *         description: Endereço inválido
 *       500:
 *         description: Erro na consulta
 */
router.get('/blockchain/wallets/:walletAddress/balance', testController.getWalletBalance);

/**
 * @swagger
 * /api/test/blocks/{blockNumber}:
 *   get:
 *     summary: Obtém informações de um bloco específico
 *     description: Retorna informações detalhadas de um bloco específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/blocks/:blockNumber', testController.getBlock);

/**
 * @swagger
 * /api/test/transactions/{transactionHash}:
 *   get:
 *     summary: Obtém informações de uma transação
 *     description: Retorna informações detalhadas de uma transação específica
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Informações da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/transactions/:transactionHash', testController.getTransaction);

/**
 * @swagger
 * /api/test/wallets/{walletAddress}/balance:
 *   get:
 *     summary: Consulta o saldo de uma carteira
 *     description: Obtém o saldo em ETH de um endereço específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira para consultar
 *     responses:
 *       200:
 *         description: Saldo consultado com sucesso
 *       400:
 *         description: Endereço inválido
 *       500:
 *         description: Erro na consulta
 */
router.get('/wallets/:walletAddress/balance', testController.getWalletBalance);

/**
 * @swagger
 * /api/test/transactions/{transactionHash}/details:
 *   get:
 *     summary: Obtém informações detalhadas de uma transação via AzoreScan
 *     description: Retorna informações detalhadas de uma transação usando a API do AzoreScan
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações detalhadas da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/transactions/:transactionHash/details', testController.getTransactionDetails);

/**
 * @swagger
 * /api/test/blocks/{blockNumber}/details:
 *   get:
 *     summary: Obtém informações detalhadas de um bloco via AzoreScan
 *     description: Retorna informações detalhadas de um bloco usando a API do AzoreScan
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações detalhadas do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/blocks/:blockNumber/details', testController.getBlockDetails);

/**
 * @swagger
 * /api/test/wallets/balances:
 *   post:
 *     summary: Consulta saldos de múltiplas carteiras
 *     description: Obtém o saldo de até 20 endereços de uma vez
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de endereços (máximo 20)
 *                 example: ["0x123...", "0x456..."]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Saldos consultados com sucesso
 *       400:
 *         description: Lista de endereços inválida
 */
router.post('/wallets/balances', testController.getMultipleBalances);

/**
 * @swagger
 * /api/test/webhook:
 *   post:
 *     summary: Teste de webhook
 *     description: Testa configuração de webhook (simulado)
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL para onde enviar o webhook
 *     responses:
 *       200:
 *         description: Teste de webhook configurado
 *       400:
 *         description: URL inválida
 */
router.post('/webhook', testController.testWebhook);

module.exports = router; 