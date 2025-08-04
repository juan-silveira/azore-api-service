const { ethers } = require('ethers');
require('dotenv').config();

// --- CONFIGURAÇÃO ---
// Substitua pelos endereços e valores corretos para suas operações.

// Endereço do contrato de Staking que será gerenciado
const STAKE_CONTRACT_ADDRESS = '0xb23C10230c4C51790007690E8F806743aBb3C94D'; 

// Endereço do usuário para operações como stake, withdraw, etc.
const USER_ADDRESS = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';

// Quantidade padrão para operações (em unidades de ether, ex: '1000' para 1000 tokens)
const DEFAULT_AMOUNT = '1000000000000000000'; // 1 token (considerando 18 casas decimais)

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

// ABI do Contrato de Staking (fornecido na sua pergunta)
const STAKE_CONTRACT_ABI = [{"inputs":[{"internalType":"address","name":"stakeToken_","type":"address"},{"internalType":"address","name":"rewardToken_","type":"address"},{"internalType":"uint256","name":"minValueStake_","type":"uint256"},{"internalType":"uint256","name":"_initialCycleStartTime","type":"uint256"},{"internalType":"address[]","name":"_initialWhitelist","type":"address[]"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"bool","name":"isBlacklisted","type":"bool"}],"name":"BlacklistUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newDurationInDays","type":"uint256"}],"name":"CycleDurationUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"allowed","type":"bool"}],"name":"PartialWithdrawalSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"RestakeStatusChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardCompounded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalReserve","type":"uint256"}],"name":"RewardDeposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"totalDistributed","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"usersCount","type":"uint256"}],"name":"RewardDistributed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardTokensWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"StakeCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"blocked","type":"bool"}],"name":"StakingBlocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"TimelockSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Unstake","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"UpdateMinValueStake","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"enabled","type":"bool"}],"name":"WhitelistEnabled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"bool","name":"isWhitelisted","type":"bool"}],"name":"WhitelistUpdated","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"addToWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"allowPartialWithdrawal","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"claimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"compound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"cycleDurationInDays","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cycleStartTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"depositRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_percentageInBasisPoints","type":"uint256"}],"name":"distributeReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getAvailableRewardBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getBlacklistStatus","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getNumberOfActiveUsers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getPendingReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalRewardDistributed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getTotalStakeBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalStakedSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getWhitelistedAddresses","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isRestakeAllowed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"isWhitelisted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minValueStake","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"removeFromBlacklist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"removeFromWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardToken","outputs":[{"internalType":"contract AZEToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"allow","type":"bool"}],"name":"setAllowPartialWithdrawal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"status","type":"bool"}],"name":"setAllowRestake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newDurationInDays","type":"uint256"}],"name":"setCycleDuration","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"blocked","type":"bool"}],"name":"setStakingBlocked","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"setTimelock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_enabled","type":"bool"}],"name":"setWhitelistEnabled","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"_customTimestamp","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"stakeToken","outputs":[{"internalType":"contract AZEToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingBlocked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"timelockUntil","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"value","type":"uint256"}],"name":"updateMinValueStake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"whitelistEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawRewardTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// URL do RPC da rede Azore Testnet
const RPC_URL = 'https://rpc-testnet.azore.technology';

/**
 * Função utilitária para executar transações de escrita.
 * @param {ethers.Contract} contract - A instância do contrato.
 * @param {string} functionName - O nome da função a ser chamada.
 * @param {Array} args - Os argumentos para a função.
 */
async function executeTransaction(contract, functionName, args) {
    try {
        console.log(`\n🚀 Preparando a transação para: ${functionName}(${args.join(', ')})`);
        const tx = await contract[functionName](...args);
        console.log("Enviando transação e aguardando confirmação...");
        const receipt = await tx.wait();
        console.log(`✅ Transação bem-sucedida!`);
        console.log(`    Hash: ${receipt.hash}`);
        console.log(`    Explorer: https://floripa.azorescan.com/tx/${receipt.hash}`);
        return receipt;
    } catch (error) {
        console.error(`❌ Falha na operação "${functionName}": ${error.reason || error.message}`);
    }
}

/**
 * Função utilitária para executar chamadas de leitura.
 * @param {ethers.Contract} contract - A instância do contrato.
 * @param {string} functionName - O nome da função a ser chamada.
 * @param {Array} args - Os argumentos para a função.
 */
async function executeCall(contract, functionName, args = []) {
    try {
        console.log(`\n🔎 Consultando: ${functionName}(${args.join(', ')})`);
        const result = await contract[functionName](...args);
        console.log(`✅ Resultado: ${result.toString()}`);
        return result;
    } catch (error) {
        console.error(`❌ Falha na consulta "${functionName}": ${error.reason || error.message}`);
    }
}


// --- FUNÇÃO PRINCIPAL ---
async function main() {
    // 1. Conexão com a Blockchain
    const privateKey = process.env.PRIVATE_KEY_E;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY não encontrada no arquivo .env");
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    console.log(`Carteira do administrador (${signer.address}) carregada.`);

    // 2. Instância do Contrato
    const stakeContract = new ethers.Contract(STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI, signer);
    console.log(`Contrato de Staking carregado no endereço: ${await stakeContract.getAddress()}`);

    // --- EXEMPLOS DE INTERAÇÃO ---
    // Descomente as linhas abaixo para testar as funções.

    // === OPERAÇÕES DE ESCRITA (ADMIN) ===

    // Rota 3: Invest Token (Stake)
    // await executeTransaction(stakeContract, 'stake', [USER_ADDRESS, DEFAULT_AMOUNT, 0]); // O '0' usa o timestamp atual

    // Rota 4: Withdraw Investment (Unstake)
    // await executeTransaction(stakeContract, 'unstake', [USER_ADDRESS, DEFAULT_AMOUNT]);

    // Rota 5: Claim Rewards
    // await executeTransaction(stakeContract, 'claimReward', [USER_ADDRESS]);

    // Rota 6: Compound Rewards
    // await executeTransaction(stakeContract, 'compound', [USER_ADDRESS]);

    // Rota 7: Deposit Rewards
    // await executeTransaction(stakeContract, 'depositRewards', [DEFAULT_AMOUNT]);

    // Rota 8: Distribute Rewards
    // await executeTransaction(stakeContract, 'distributeReward', [1000]); // Ex: 10% em basis points

    // Rota 9: Withdraw Reward Tokens
    // await executeTransaction(stakeContract, 'withdrawRewardTokens', [DEFAULT_AMOUNT]);

    // Rota 10: Set Cycle Duration
    // await executeTransaction(stakeContract, 'setCycleDuration', [90]); // 90 dias

    // Rota 11: Set Allow Restake
    // await executeTransaction(stakeContract, 'setAllowRestake', [true]);

    // Rota 12: Remove From Blacklist
    // await executeTransaction(stakeContract, 'removeFromBlacklist', [USER_ADDRESS]);

    // Rota 13: Set Staking Blocked
    // await executeTransaction(stakeContract, 'setStakingBlocked', [false]);

    // Rota 14: Set Timelock
    // const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
    // await executeTransaction(stakeContract, 'setTimelock', [oneHourFromNow]);

    // Rota 15: Set Allow Partial Withdrawal
    // await executeTransaction(stakeContract, 'setAllowPartialWithdrawal', [true]);

    // Rota 16: Update Min Value Stake
    // await executeTransaction(stakeContract, 'updateMinValueStake', ['500000000000000000']); // 0.5 tokens

    // Rota 17: Add To Whitelist
    // await executeTransaction(stakeContract, 'addToWhitelist', [USER_ADDRESS]);

    // Rota 18: Remove From Whitelist
    // await executeTransaction(stakeContract, 'removeFromWhitelist', [USER_ADDRESS]);

    // Rota 19: Set Whitelist Enabled
    // await executeTransaction(stakeContract, 'setWhitelistEnabled', [true]);


    // === OPERAÇÕES DE LEITURA (PÚBLICAS OU ADMIN) ===

    // Rota 20: Get Available Reward Balance
    // await executeCall(stakeContract, 'getAvailableRewardBalance');

    // Rota 21: Get Total Staked Supply
    // await executeCall(stakeContract, 'getTotalStakedSupply');

    // Rota 22: Get Number of Active Users
    // await executeCall(stakeContract, 'getNumberOfActiveUsers');

    // Rota 23: Get Total Reward Distributed
    // await executeCall(stakeContract, 'getTotalRewardDistributed');

    // Rota 24: Is Restake Allowed
    // await executeCall(stakeContract, 'isRestakeAllowed');

    // Rota 25: Get Blacklist Status
    // await executeCall(stakeContract, 'getBlacklistStatus', [USER_ADDRESS]);

    // Rota 26: Get Total Stake Balance
    // await executeCall(stakeContract, 'getTotalStakeBalance', [USER_ADDRESS]);

    // Rota 27: Get Whitelisted Addresses
    await executeCall(stakeContract, 'getWhitelistedAddresses');

    // Rota 28: Get Pending Reward
    // await executeCall(stakeContract, 'getPendingReward', [USER_ADDRESS]);

    // Rota 29: Gran Role
    // await executeTransaction(stakeContract, 'grantRole', [DEFAULT_ADMIN_ROLE, USER_ADDRESS]);

    // Rota 30: Has Role
    // await executeCall(stakeContract, 'hasRole', [DEFAULT_ADMIN_ROLE, USER_ADDRESS]);
}

main().catch(error => {
    console.error('❌ Ocorreu um erro fatal:', error);
    process.exit(1);
});