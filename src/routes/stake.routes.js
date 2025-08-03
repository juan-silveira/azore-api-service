const express = require('express');
const router = express.Router();
const stakeController = require('../controllers/stake.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stake:
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
 *           description: ID único do stake
 *         name:
 *           type: string
 *           description: Nome do stake
 *         address:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço do contrato de stake
 *         abi:
 *           type: array
 *           description: ABI do contrato
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           description: Rede do contrato
 *         contractType:
 *           type: string
 *           description: Tipo do contrato (STAKE)
 *         adminPublicKey:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: PublicKey do usuário admin do stake
 *         metadata:
 *           type: object
 *           description: Metadados adicionais (stakeToken, rewardToken, minStake, etc.)
 */

/**
 * @swagger
 * /api/stakes/register:
 *   post:
 *     summary: Registra um novo stake
 *     tags: [Stake Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - network
 *             properties:
 *               address:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do contrato de stake
 *               network:
 *                 type: string
 *                 enum: [mainnet, testnet]
 *                 description: Rede do contrato
 *     responses:
 *       201:
 *         description: Stake registrado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/register', stakeController.registerStake);

/**
 * @swagger
 * /api/stakes/{address}/info:
 *   get:
 *     summary: Obtém informações do stake
 *     tags: [Stake Management]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Informações do stake
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/info', stakeController.getStakeInfo);

/**
 * @swagger
 * /api/stakes/{address}/invest:
 *   post:
 *     summary: Investir token (stake)
 *     tags: [Stake Operations]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - amount
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *               amount:
 *                 type: string
 *                 description: Quantidade de tokens para investir
 *               customTimestamp:
 *                 type: number
 *                 description: Timestamp customizado (opcional)
 *     responses:
 *       200:
 *         description: Investimento realizado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/invest', stakeController.investToken);

/**
 * @swagger
 * /api/stakes/{address}/withdraw:
 *   post:
 *     summary: Retirar investimento (unstake)
 *     tags: [Stake Operations]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - amount
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *               amount:
 *                 type: string
 *                 description: Quantidade de tokens para retirar
 *     responses:
 *       200:
 *         description: Retirada realizada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/withdraw', stakeController.withdrawInvestment);

/**
 * @swagger
 * /api/stakes/{address}/claim-rewards:
 *   post:
 *     summary: Resgatar recompensas (claimReward)
 *     tags: [Stake Operations]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *     responses:
 *       200:
 *         description: Recompensas resgatadas com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/claim-rewards', stakeController.claimRewards);

/**
 * @swagger
 * /api/stakes/{address}/compound:
 *   post:
 *     summary: Reinvestir recompensas (compound)
 *     tags: [Stake Operations]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *     responses:
 *       200:
 *         description: Recompensas reinvestidas com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:address/compound', stakeController.compoundRewards);

// ===== ROTAS QUE SOMENTE O adminPublicKey DO STAKE PODE CHAMAR =====

/**
 * @swagger
 * /api/stakes/{address}/deposit-rewards:
 *   post:
 *     summary: Depositar recompensas no cofre (depositRewards)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - adminPublicKey
 *             properties:
 *               amount:
 *                 type: string
 *                 description: Quantidade de tokens de recompensa
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Recompensas depositadas com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/deposit-rewards', stakeController.depositRewards);

/**
 * @swagger
 * /api/stakes/{address}/distribute-rewards:
 *   post:
 *     summary: Distribuir recompensas (distributeReward)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percentageInBasisPoints
 *               - adminPublicKey
 *             properties:
 *               percentageInBasisPoints:
 *                 type: number
 *                 description: Percentual em pontos-base (ex: 5.40% = 540)
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Recompensas distribuídas com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/distribute-rewards', stakeController.distributeRewards);

/**
 * @swagger
 * /api/stakes/{address}/withdraw-reward-tokens:
 *   post:
 *     summary: Retirar recompensas do cofre (withdrawRewardTokens)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - adminPublicKey
 *             properties:
 *               amount:
 *                 type: string
 *                 description: Quantidade de tokens de recompensa
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Recompensas retiradas com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/withdraw-reward-tokens', stakeController.withdrawRewardTokens);

/**
 * @swagger
 * /api/stakes/{address}/set-cycle-duration:
 *   post:
 *     summary: Definir duração do ciclo de recompensas (setCycleDuration)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDurationInDays
 *               - adminPublicKey
 *             properties:
 *               newDurationInDays:
 *                 type: number
 *                 description: Nova duração do ciclo em dias
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Duração do ciclo definida com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/set-cycle-duration', stakeController.setCycleDuration);

/**
 * @swagger
 * /api/stakes/{address}/set-allow-restake:
 *   post:
 *     summary: Permitir/Bloquear reinvestir (setAllowRestake)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - adminPublicKey
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: true para permitir reinvestir, false para ativar blacklist
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Permissão de reinvestir definida com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/set-allow-restake', stakeController.setAllowRestake);

/**
 * @swagger
 * /api/stakes/{address}/remove-from-blacklist:
 *   post:
 *     summary: Remover da blacklist (removeFromBlacklist)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - adminPublicKey
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Usuário removido da blacklist com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/remove-from-blacklist', stakeController.removeFromBlacklist);

/**
 * @swagger
 * /api/stakes/{address}/set-staking-blocked:
 *   post:
 *     summary: Permitir/Bloquear novos investimentos (setStakingBlocked)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blocked
 *               - adminPublicKey
 *             properties:
 *               blocked:
 *                 type: boolean
 *                 description: true para bloquear novos investimentos
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Bloqueio de staking definido com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/set-staking-blocked', stakeController.setStakingBlocked);

/**
 * @swagger
 * /api/stakes/{address}/set-timelock:
 *   post:
 *     summary: Definir tempo de carência (setTimelock)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timestamp
 *               - adminPublicKey
 *             properties:
 *               timestamp:
 *                 type: number
 *                 description: Timestamp do timelock
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Timelock definido com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/set-timelock', stakeController.setTimelock);

/**
 * @swagger
 * /api/stakes/{address}/set-allow-partial-withdrawal:
 *   post:
 *     summary: Permitir/Proibir retiradas parciais (setAllowPartialWithdrawal)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allow
 *               - adminPublicKey
 *             properties:
 *               allow:
 *                 type: boolean
 *                 description: true para permitir retiradas parciais
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Permissão de retirada parcial definida com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/set-allow-partial-withdrawal', stakeController.setAllowPartialWithdrawal);

/**
 * @swagger
 * /api/stakes/{address}/update-min-value-stake:
 *   post:
 *     summary: Definir novo valor mínimo (updateMinValueStake)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *               - adminPublicKey
 *             properties:
 *               value:
 *                 type: string
 *                 description: Novo valor mínimo em wei
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Valor mínimo atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/update-min-value-stake', stakeController.updateMinValueStake);

/**
 * @swagger
 * /api/stakes/{address}/add-to-whitelist:
 *   post:
 *     summary: Adicionar na whitelist (addToWhitelist)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - adminPublicKey
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Usuário adicionado na whitelist com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/add-to-whitelist', stakeController.addToWhitelist);

/**
 * @swagger
 * /api/stakes/{address}/remove-from-whitelist:
 *   post:
 *     summary: Remover da whitelist (removeFromWhitelist)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - adminPublicKey
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Usuário removido da whitelist com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/remove-from-whitelist', stakeController.removeFromWhitelist);

/**
 * @swagger
 * /api/stakes/{address}/set-whitelist-enabled:
 *   post:
 *     summary: Ativar/Desativar whitelist (setWhitelistEnabled)
 *     tags: [Stake Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *               - adminPublicKey
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: true para ativar whitelist
 *               adminPublicKey:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: PublicKey do admin do stake
 *     responses:
 *       200:
 *         description: Whitelist definida com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - requer ser admin do stake
 */
router.post('/:address/set-whitelist-enabled', stakeController.setWhitelistEnabled);

// ===== ROTAS DE CONSULTA =====

/**
 * @swagger
 * /api/stakes/{address}/available-reward-balance:
 *   get:
 *     summary: Saldo do cofre (getAvailableRewardBalance)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Saldo do cofre obtido com sucesso
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/available-reward-balance', stakeController.getAvailableRewardBalance);

/**
 * @swagger
 * /api/stakes/{address}/total-staked-supply:
 *   get:
 *     summary: Total investido (getTotalStakedSupply)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Total investido obtido com sucesso
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/total-staked-supply', stakeController.getTotalStakedSupply);

/**
 * @swagger
 * /api/stakes/{address}/number-of-active-users:
 *   get:
 *     summary: Total de investidores (getNumberOfActiveUsers)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Total de investidores obtido com sucesso
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/number-of-active-users', stakeController.getNumberOfActiveUsers);

/**
 * @swagger
 * /api/stakes/{address}/total-reward-distributed:
 *   get:
 *     summary: Total de recompensas distribuídas (getTotalRewardDistributed)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Total de recompensas distribuídas obtido com sucesso
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/total-reward-distributed', stakeController.getTotalRewardDistributed);

/**
 * @swagger
 * /api/stakes/{address}/is-restake-allowed:
 *   get:
 *     summary: Permissão de reinvestir (isRestakeAllowed)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Permissão de reinvestir obtida com sucesso
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/is-restake-allowed', stakeController.isRestakeAllowed);

/**
 * @swagger
 * /api/stakes/{address}/blacklist-status:
 *   post:
 *     summary: Verificar se usuário está na blacklist (getBlacklistStatus)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *     responses:
 *       200:
 *         description: Status da blacklist obtido com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Stake não encontrado
 */
router.post('/:address/blacklist-status', stakeController.getBlacklistStatus);

/**
 * @swagger
 * /api/stakes/{address}/total-stake-balance:
 *   post:
 *     summary: Total investido pelo usuário (getTotalStakeBalance)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *     responses:
 *       200:
 *         description: Total investido pelo usuário obtido com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Stake não encontrado
 */
router.post('/:address/total-stake-balance', stakeController.getTotalStakeBalance);

/**
 * @swagger
 * /api/stakes/{address}/whitelisted-addresses:
 *   get:
 *     summary: Verificar lista da whitelist (getWhitelistedAddresses)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     responses:
 *       200:
 *         description: Lista da whitelist obtida com sucesso
 *       404:
 *         description: Stake não encontrado
 */
router.get('/:address/whitelisted-addresses', stakeController.getWhitelistedAddresses);

/**
 * @swagger
 * /api/stakes/{address}/pending-reward:
 *   post:
 *     summary: Verificar recompensas pendentes de um usuário (getPendingReward)
 *     tags: [Stake Queries]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato de stake
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Endereço do usuário
 *     responses:
 *       200:
 *         description: Recompensas pendentes obtidas com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Stake não encontrado
 */
router.post('/:address/pending-reward', stakeController.getPendingReward);

/**
 * @swagger
 * /api/stakes:
 *   get:
 *     summary: Lista todos os stakes
 *     tags: [Stake Management]
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
 *         description: Lista de stakes obtida com sucesso
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/', stakeController.listStakes);

/**
 * @swagger
 * /api/stakes/test/service:
 *   get:
 *     summary: Testa o serviço de stakes
 *     tags: [Stake Management]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', stakeController.testService);

module.exports = router; 