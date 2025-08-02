const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     SmartContract:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - abi
 *         - network
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do contrato
 *         name:
 *           type: string
 *           description: Nome do contrato
 *         address:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato
 *         abi:
 *           type: array
 *           description: ABI do contrato
 *         bytecode:
 *           type: string
 *           description: Bytecode do contrato (opcional)
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           description: Rede do contrato
 *         contractType:
 *           type: string
 *           description: "Tipo do contrato (ex: ERC20, ERC721)"
 *         version:
 *           type: string
 *           description: Versão do contrato
 *         isVerified:
 *           type: boolean
 *           description: Se o contrato foi verificado
 *         isActive:
 *           type: boolean
 *           description: Se o contrato está ativo
 *         deployedBy:
 *           type: string
 *           format: uuid
 *           description: ID da carteira que implantou
 *         deployedAt:
 *           type: string
 *           format: date-time
 *           description: Data de implantação
 *         adminPublicKey:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: PublicKey do usuário admin do token
 *         metadata:
 *           type: object
 *           description: Metadados adicionais
 *     ContractOperation:
 *       type: object
 *       required:
 *         - functionName
 *       properties:
 *         functionName:
 *           type: string
 *           description: Nome da função a ser executada
 *         params:
 *           type: array
 *           description: Parâmetros da função
 *         options:
 *           type: object
 *           description: Opções da transação
 *     ContractDeployment:
 *       type: object
 *       required:
 *         - contractData
 *         - walletAddress
 *       properties:
 *         contractData:
 *           $ref: '#/components/schemas/SmartContract'
 *         walletAddress:
 *           type: string
 *           description: Endereço da carteira para implantação
 *         options:
 *           type: object
 *           description: Opções de implantação
 */

/**
 * @swagger
 * /api/contracts:
 *   post:
 *     summary: Registra um novo contrato inteligente
 *     tags: [Contracts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SmartContract'
 *     responses:
 *       201:
 *         description: Contrato registrado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', contractController.registerContract);

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: Lista contratos com paginação
 *     tags: [Contracts]
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
 *         description: Filtrar por tipo de contrato
 *     responses:
 *       200:
 *         description: Lista de contratos
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/', contractController.listContracts);

/**
 * @swagger
 * /api/contracts/validate-abi:
 *   post:
 *     summary: Valida um ABI
 *     tags: [Contracts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - abi
 *             properties:
 *               abi:
 *                 type: array
 *                 description: ABI a ser validado
 *     responses:
 *       200:
 *         description: ABI válido
 *       400:
 *         description: ABI inválido
 */
router.post('/validate-abi', contractController.validateABI);

/**
 * @swagger
 * /api/contracts/deploy:
 *   post:
 *     summary: Implanta um novo contrato
 *     tags: [Contracts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractDeployment'
 *     responses:
 *       201:
 *         description: Contrato implantado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/deploy', contractController.deployContract);

/**
 * @swagger
 * /api/contracts/default-tokens:
 *   get:
 *     summary: Lista os tokens padrão configurados
 *     description: Retorna a lista de tokens que são criados automaticamente
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Lista de tokens padrão
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
 *                     total:
 *                       type: integer
 *                       description: Total de tokens padrão
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           symbol:
 *                             type: string
 *                           network:
 *                             type: string
 *                           contractType:
 *                             type: string
 *                           address:
 *                             type: string
 *                           isNative:
 *                             type: boolean
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/default-tokens', contractController.listDefaultTokens);

/**
 * @swagger
 * /api/contracts/{address}:
 *   get:
 *     summary: Obtém um contrato por endereço
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Contrato encontrado
 *       404:
 *         description: Contrato não encontrado
 */
router.get('/:address', contractController.getContractByAddress);

/**
 * @swagger
 * /api/contracts/{address}/functions:
 *   get:
 *     summary: Obtém funções do contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Funções do contrato
 *       404:
 *         description: Contrato não encontrado
 */
router.get('/:address/functions', contractController.getContractFunctions);

/**
 * @swagger
 * /api/contracts/{address}/events:
 *   get:
 *     summary: Obtém eventos do contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Eventos do contrato
 *       404:
 *         description: Contrato não encontrado
 */
router.get('/:address/events', contractController.getContractEventsList);

/**
 * @swagger
 * /api/contracts/{address}/write:
 *   post:
 *     summary: Executa operação de escrita no contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ContractOperation'
 *               - type: object
 *                 required:
 *                   - walletAddress
 *                 properties:
 *                   walletAddress:
 *                     type: string
 *                     description: Endereço da carteira para assinatura
 *     responses:
 *       200:
 *         description: Operação executada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/write', contractController.writeContract);

/**
 * @swagger
 * /api/contracts/{address}/events/query:
 *   post:
 *     summary: Consulta eventos do contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventName
 *             properties:
 *               eventName:
 *                 type: string
 *                 description: Nome do evento
 *               fromBlock:
 *                 type: integer
 *                 default: 0
 *                 description: Bloco inicial
 *               toBlock:
 *                 type: string
 *                 default: 'latest'
 *                 description: Bloco final
 *     responses:
 *       200:
 *         description: Eventos obtidos com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/events/query', contractController.getContractEvents);

/**
 * @swagger
 * /api/contracts/{address}/metadata:
 *   put:
 *     summary: Atualiza metadados do contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
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
 *                 description: Novos metadados
 *     responses:
 *       200:
 *         description: Metadados atualizados com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.put('/:address/metadata', contractController.updateContractMetadata);

/**
 * @swagger
 * /api/contracts/{address}/deactivate:
 *   post:
 *     summary: Desativa um contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Contrato desativado com sucesso
 *       400:
 *         description: Erro ao desativar
 */
router.post('/:address/deactivate', contractController.deactivateContract);

/**
 * @swagger
 * /api/contracts/{address}/activate:
 *   post:
 *     summary: Reativa um contrato
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     responses:
 *       200:
 *         description: Contrato reativado com sucesso
 *       400:
 *         description: Erro ao reativar
 */
router.post('/:address/activate', contractController.activateContract);



/**
 * @swagger
 * /api/contracts/{address}/update-admin:
 *   put:
 *     summary: Atualiza o admin de um token
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAdminPublicKey
 *               - currentAdminPublicKey
 *             properties:
 *               newAdminPublicKey:
 *                 type: string
 *                 description: PublicKey do novo admin
 *               currentAdminPublicKey:
 *                 type: string
 *                 description: PublicKey do admin atual
 *     responses:
 *       200:
 *         description: Admin atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.put('/:address/update-admin', contractController.updateTokenAdmin);

/**
 * @swagger
 * /api/contracts/{address}/verify-admin:
 *   post:
 *     summary: Verifica se um usuário tem a role DEFAULT_ADMIN_ROLE em um token
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminPublicKey
 *             properties:
 *               adminPublicKey:
 *                 type: string
 *                 description: PublicKey do usuário a ser verificado
 *     responses:
 *       200:
 *         description: Verificação realizada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/verify-admin', contractController.verifyTokenAdmin);

/**
 * @swagger
 * /api/contracts/{address}/grant-minter-role:
 *   post:
 *     summary: Concede MINTER_ROLE a um endereço
 *     description: Concede a role MINTER_ROLE a um endereço específico (apenas para admin do contrato)
 *     tags: [Contract Roles]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *             $ref: '#/components/schemas/RoleGrantRequest'
 *     responses:
 *       200:
 *         description: Role concedida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleGrantResponse'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - requer ser admin do contrato
 *       404:
 *         description: Contrato não encontrado
 */

/**
 * @swagger
 * /api/contracts/{address}/grant-burner-role:
 *   post:
 *     summary: Concede BURNER_ROLE a um endereço
 *     description: Concede a role BURNER_ROLE a um endereço específico (apenas para admin do contrato)
 *     tags: [Contract Roles]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *             $ref: '#/components/schemas/RoleGrantRequest'
 *     responses:
 *       200:
 *         description: Role concedida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleGrantResponse'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - requer ser admin do contrato
 *       404:
 *         description: Contrato não encontrado
 */

/**
 * @swagger
 * /api/contracts/{address}/grant-transfer-role:
 *   post:
 *     summary: Concede TRANSFER_ROLE a um endereço
 *     description: Concede a role TRANSFER_ROLE a um endereço específico (apenas para admin do contrato)
 *     tags: [Contract Roles]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *             $ref: '#/components/schemas/RoleGrantRequest'
 *     responses:
 *       200:
 *         description: Role concedida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleGrantResponse'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - requer ser admin do contrato
 *       404:
 *         description: Contrato não encontrado
 */



/**
 * @swagger
 * /api/contracts/{address}/token-info:
 *   get:
 *     summary: Obtém informações do token da blockchain
 *     description: Busca name, symbol, decimals e totalSupply diretamente do contrato
 *     tags: [Token Management]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Endereço do contrato
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     name:
 *                       type: string
 *                     symbol:
 *                       type: string
 *                     decimals:
 *                       type: string
 *                     totalSupply:
 *                       type: string
 *                     network:
 *                       type: string
 *                     contractType:
 *                       type: string
 *                     metadata:
 *                       type: object
 *                     adminPublicKey:
 *                       type: string
 *       400:
 *         description: Token não encontrado ou erro na consulta
 *       401:
 *         description: Não autorizado
 */
router.get('/:address/token-info', contractController.getTokenInfo);

/**
 * @swagger
 * /api/contracts/{address}/update-metadata:
 *   put:
 *     summary: Atualiza metadados do token
 *     description: Atualiza description, website e explorer do token
 *     tags: [Token Management]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *         description: Metadados atualizados com sucesso
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
router.put('/:address/update-metadata', contractController.updateTokenMetadata);





/**
 * @swagger
 * /api/contracts/{address}/grant-role:
 *   post:
 *     summary: Concede uma role a um endereço
 *     description: Concede uma role específica a um endereço. Para admin role, automaticamente atualiza adminPublicKey e revoga role do admin anterior.
 *     tags: [Token Management]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *             required:
 *               - role
 *               - targetAddress
 *               - walletAddress
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, minter, burner, transfer]
 *                 description: |
 *                   Role a ser concedida:
 *                   - admin: DEFAULT_ADMIN_ROLE (0x0000...0000)
 *                   - minter: MINTER_ROLE (0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6)
 *                   - burner: BURNER_ROLE (0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848)
 *                   - transfer: TRANSFER_ROLE (0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c)
 *               targetAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço que receberá a role
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço da carteira para assinatura da transação
 *     responses:
 *       200:
 *         description: Role concedida com sucesso
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
 *                     targetAddress:
 *                       type: string
 *                     role:
 *                       type: string
 *                     roleHash:
 *                       type: string
 *                     transactionHash:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Token não encontrado ou parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Carteira não encontrada
 */
router.post('/:address/grant-role', contractController.grantRole);

/**
 * @swagger
 * /api/contracts/{address}/has-role:
 *   post:
 *     summary: Verifica se um endereço tem determinada role
 *     description: Consulta o contrato para verificar se um endereço possui uma role específica (função somente de consulta, não gasta gás)
 *     tags: [Token Management]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *             required:
 *               - role
 *               - targetAddress
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, minter, burner, transfer]
 *                 description: |
 *                   Role a ser verificada:
 *                   - admin: DEFAULT_ADMIN_ROLE (0x0000...0000)
 *                   - minter: MINTER_ROLE (0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6)
 *                   - burner: BURNER_ROLE (0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848)
 *                   - transfer: TRANSFER_ROLE (0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c)
 *               targetAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço a ser verificado
 *     responses:
 *       200:
 *         description: Verificação realizada com sucesso
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
 *                     targetAddress:
 *                       type: string
 *                     role:
 *                       type: string
 *                     roleHash:
 *                       type: string
 *                     hasRole:
 *                       type: boolean
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Token não encontrado ou parâmetros inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/:address/has-role', contractController.hasRole);

/**
 * @swagger
 * /api/contracts/{address}/revoke-role:
 *   post:
 *     summary: Revoga uma role de um endereço
 *     description: Remove uma role específica de um endereço (apenas admin do token pode revogar roles)
 *     tags: [Token Management]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: address
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
 *             required:
 *               - role
 *               - targetAddress
 *               - walletAddress
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, minter, burner, transfer]
 *                 description: |
 *                   Role a ser revogada:
 *                   - admin: DEFAULT_ADMIN_ROLE (0x0000...0000)
 *                   - minter: MINTER_ROLE (0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6)
 *                   - burner: BURNER_ROLE (0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848)
 *                   - transfer: TRANSFER_ROLE (0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c)
 *               targetAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço que terá a role revogada
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço da carteira para assinatura da transação
 *     responses:
 *       200:
 *         description: Role revogada com sucesso
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
 *                     targetAddress:
 *                       type: string
 *                     role:
 *                       type: string
 *                     roleHash:
 *                       type: string
 *                     transactionHash:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Token não encontrado ou parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - requer ser admin do token
 *       404:
 *         description: Carteira não encontrada
 */
router.post('/:address/revoke-role', contractController.revokeRole);

/**
 * @swagger
 * /api/contracts/test/service:
 *   get:
 *     summary: Testa o serviço de contratos
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', contractController.testService);

module.exports = router; 