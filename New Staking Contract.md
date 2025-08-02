// SPDX-License-Identifier: MIT  
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";  
import "@openzeppelin/contracts/access/AccessControl.sol";  
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/\*\*  
\* @title AZEToken Interface  
\* @dev Interface para incluir a função de transferência sem gás.  
\*/  
interface AZEToken is IERC20 {  
   function transferFromGasless(address from, address to, uint256 value) external;  
}

/\*\*  
\* @title AdvancedStakingContract  
\* @dev Contrato de staking modificado para distribuir recompensas com base em um percentual  
\* proporcional ao tempo de cada stake dentro de um ciclo.  
\*/  
contract AdvancedStakingContract is AccessControl, ReentrancyGuard {

   // ESTRUTURAS  
   struct Stake {  
       uint256 amount;  
       uint256 timestamp;  
   }

   struct UserStakes {  
       Stake\[\] stakes;  
       uint256 pendingReward;  
   }

   // CONSTANTES  
   uint256 private constant PERCENTAGE\_PRECISION \= 10000; // Para 2 casas decimais (1% \= 100\)

   // VARIÁVEIS DE ESTADO  
   AZEToken public stakeToken;  
   AZEToken public rewardToken;  
    
   mapping(address \=\> UserStakes) private userStakes;  
   address\[\] private \_userAddresses;  
   mapping(address \=\> uint256) private \_userIndexes;  
   mapping(address \=\> bool) private \_userExists;

   uint256 private \_totalSupply;  
   uint256 private \_rewardReserveBalance;  
   uint256 private \_totalRewardDistributed;  
    
   uint256 public minValueStake;  
   bool public stakingBlocked;  
   uint256 public timelockUntil;  
   bool public allowPartialWithdrawal;  
   bool private \_allowRestake;  
   mapping(address \=\> bool) private \_blacklist;

   uint256 public cycleDurationInDays;  
   uint256 public cycleStartTime;

   mapping(address \=\> bool) private \_whitelist;  
   bool public whitelistEnabled;  
   address\[\] private \_whitelistedAddresses;  
   mapping(address \=\> uint256) private \_whitelistIndexes;

   // EVENTOS  
   event StakeCreated(address indexed user, uint256 amount, uint256 timestamp);  
   event Unstake(address indexed user, uint256 amount);  
   event RewardDeposited(uint256 amount, uint256 totalReserve);  
   event RewardDistributed(uint256 totalDistributed, uint256 usersCount);  
   event RewardClaimed(address indexed user, uint256 amount);  
   event StakingBlocked(bool blocked);  
   event TimelockSet(uint256 timestamp);  
   event PartialWithdrawalSet(bool allowed);  
   event UpdateMinValueStake(uint256 amount);  
   event RestakeStatusChanged(bool isAllowed);  
   event BlacklistUpdated(address indexed user, bool isBlacklisted);  
   event RewardTokensWithdrawn(address indexed admin, uint256 amount);  
   event CycleDurationUpdated(uint256 newDurationInDays);  
   event WhitelistUpdated(address indexed user, bool isWhitelisted);  
   event WhitelistEnabled(bool enabled);  
   event RewardCompounded(address indexed user, uint256 amount);

   // CONSTRUTOR  
   constructor(  
       address stakeToken\_,  
       address rewardToken\_,  
       uint256 minValueStake\_,  
       uint256 \_initialCycleStartTime,  
       address\[\] memory \_initialWhitelist  
   ) ReentrancyGuard() {  
       stakeToken \= AZEToken(stakeToken\_);  
       rewardToken \= AZEToken(rewardToken\_);  
       minValueStake \= minValueStake\_;  
       allowPartialWithdrawal \= true;  
       \_allowRestake \= true;  
        
       // Define a duração padrão do ciclo em 90 dias  
       cycleDurationInDays \= 90;

       // Define o timestamp de início do ciclo: usa o valor passado ou o tempo do deploy  
       cycleStartTime \= \_initialCycleStartTime \> 0 ? \_initialCycleStartTime : block.timestamp;

       \_grantRole(DEFAULT\_ADMIN\_ROLE, msg.sender);

       // Lógica da Whitelist no construtor  
       if (\_initialWhitelist.length \> 0) {  
           whitelistEnabled \= true;  
           for (uint256 i \= 0; i \< \_initialWhitelist.length; i\++) {  
               \_addAddressToWhitelist(\_initialWhitelist\[i\]);  
           }  
       }  
   }

   // \--- FUNÇÕES DE WHITELIST \---

   function getWhitelistedAddresses() external view returns (address\[\] memory) {  
       return \_whitelistedAddresses;  
   }

   function setWhitelistEnabled(bool \_enabled) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       whitelistEnabled \= \_enabled;  
       emit WhitelistEnabled(\_enabled);  
   }

   function addToWhitelist(address \_user) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       \_addAddressToWhitelist(\_user);  
   }

   function removeFromWhitelist(address \_user) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       \_removeAddressFromWhitelist(\_user);  
   }  
    
   function isWhitelisted(address \_user) external view returns (bool) {  
       return \_whitelist\[\_user\];  
   }

   function \_addAddressToWhitelist(address \_user) internal {  
       require(\_user \!= address(0), "Invalid address");  
       // Evita adicionar endereços duplicados ao array  
       if (\!\_whitelist\[\_user\]) {  
           \_whitelist\[\_user\] \= true;  
           \_whitelistedAddresses.push(\_user);  
           \_whitelistIndexes\[\_user\] \= \_whitelistedAddresses.length; // Armazena índice+1  
       }  
       emit WhitelistUpdated(\_user, true);  
   }

   function \_removeAddressFromWhitelist(address \_user) internal {  
       require(\_user \!= address(0), "Invalid address");  
       // Garante que o endereço realmente está na whitelist para ser removido  
       if (\_whitelist\[\_user\]) {  
           \_whitelist\[\_user\] \= false;

           // Lógica "Swap-and-Pop" para remover do array de forma barata  
           uint256 index \= \_whitelistIndexes\[\_user\] \- 1;  
           address lastAddress \= \_whitelistedAddresses\[\_whitelistedAddresses.length \- 1\];  
            
           if (lastAddress \!= \_user) {  
               \_whitelistedAddresses\[index\] \= lastAddress;  
               \_whitelistIndexes\[lastAddress\] \= index \+ 1;  
           }  
            
           \_whitelistedAddresses.pop();  
           delete \_whitelistIndexes\[\_user\];  
       }  
       emit WhitelistUpdated(\_user, false);  
   }

   // FUNÇÕES DE STAKE E UNSTAKE

   /\*\*  
    \* @dev Cria um stake para um usuário. Permite um timestamp customizado.  
    \* @param user O endereço do staker.  
    \* @param amount A quantidade de tokens a ser depositada.  
    \* @param \_customTimestamp Opcional. Timestamp customizado para o stake. Se 0, usa o tempo atual.  
    \*/  
   function stake(address user, uint256 amount, uint256 \_customTimestamp) external onlyRole(DEFAULT\_ADMIN\_ROLE) nonReentrant {  
       if (whitelistEnabled) {  
           require(\_whitelist\[user\], "User not whitelisted");  
       }  
        
       require(\!stakingBlocked, "Staking is currently blocked");  
       require(amount \>= minValueStake, "Amount less than minimum stake value");  
       require(\!\_blacklist\[user\], "User is on the restake blacklist.");

       uint256 stakeTime \= \_customTimestamp \> 0 ? \_customTimestamp : block.timestamp;  
       require(stakeTime \<= block.timestamp, "Stake time cannot be in the future");

       stakeToken.transferFromGasless(user, address(this), amount);  
        
       userStakes\[user\].stakes.push(Stake({ amount: amount, timestamp: stakeTime }));  
        
       \_totalSupply \+= amount;

       if (\!\_userExists\[user\]) {  
           \_userExists\[user\] \= true;  
           \_userIndexes\[user\] \= \_userAddresses.length;  
           \_userAddresses.push(user);  
       }

       emit StakeCreated(user, amount, stakeTime);  
   }

   /\*\*  
    \* @dev NOVA FUNÇÃO: Cria um novo stake usando as recompensas pendentes do usuário.  
    \* @param user O endereço do usuário que fará o compounding.  
    \*/  
   function compound(address user) external onlyRole(DEFAULT\_ADMIN\_ROLE) nonReentrant {  
       UserStakes storage userData \= userStakes\[user\];  
       uint256 rewardToCompound \= userData.pendingReward;

       require(rewardToCompound \> 0, "No rewards to compound");

       // Zera a recompensa pendente e adiciona o valor como um novo stake  
       userData.pendingReward \= 0;  
       \_totalSupply \+= rewardToCompound;  
       userData.stakes.push(Stake({ amount: rewardToCompound, timestamp: block.timestamp }));

       emit RewardCompounded(user, rewardToCompound);  
   }

   function unstake(address user, uint256 amount) external onlyRole(DEFAULT\_ADMIN\_ROLE) nonReentrant {  
       require(block.timestamp \>= timelockUntil, "Unstaking is timelocked");  
       uint256 totalBalance \= getTotalStakeBalance(user);  
       require(totalBalance \> 0, "User has no stake to withdraw.");  
       require(amount \> 0, "Amount must be greater than 0");  
       require(amount \<= totalBalance, "Insufficient stake balance");

       if (\!allowPartialWithdrawal) {  
           require(amount \== totalBalance, "Only full withdrawal allowed");  
       }

       UserStakes storage userData \= userStakes\[user\];  
       uint256 remaining \= amount;

       for (uint256 i \= 0; i \< userData.stakes.length && remaining \> 0; i\++) {  
           if (userData.stakes\[i\].amount \== 0) continue;

           if (userData.stakes\[i\].amount \<= remaining) {  
               remaining \-= userData.stakes\[i\].amount;  
               userData.stakes\[i\].amount \= 0;  
           } else {  
               userData.stakes\[i\].amount \-= remaining;  
               remaining \= 0;  
           }  
       }

       \_cleanupEmptyStakes(user);  
       \_totalSupply \-= amount;

       if (getTotalStakeBalance(user) \== 0) {  
           \_removeUser(user);  
       }

       if (\!\_allowRestake) {  
           \_blacklist\[user\] \= true;  
           emit BlacklistUpdated(user, true);  
       }

       require(stakeToken.transfer(user, amount), "Transfer failed");  
       emit Unstake(user, amount);  
   }

   // FUNÇÕES DE RECOMPENSA

   /\*\*  
    \* @dev NOVA FUNÇÃO AUXILIAR: Calcula a recompensa e o stake total para um único usuário.  
    \* @return rewardForCycle A recompensa total calculada para o usuário neste ciclo.  
    \* @return totalStake O valor total de stake do usuário.  
    \*/  
   function \_calculateUserReward(  
       address \_userAddr,  
       uint256 \_distributionTime,  
       uint256 \_percentageInBasisPoints,  
       uint256 \_cycleDurationInSeconds  
   ) internal view returns (uint256 rewardForCycle, uint256 totalStake) {  
       UserStakes storage user \= userStakes\[\_userAddr\];  
       rewardForCycle \= 0;  
       totalStake \= 0;

       for (uint256 j \= 0; j \< user.stakes.length; j\++) {  
           if (user.stakes\[j\].amount \> 0) {  
               totalStake \+= user.stakes\[j\].amount;  
               uint256 stakeEffectiveStart \= user.stakes\[j\].timestamp \> cycleStartTime ? user.stakes\[j\].timestamp : cycleStartTime;  
                
               if (\_distributionTime \> stakeEffectiveStart) {  
                   uint256 timeStaked \= \_distributionTime \- stakeEffectiveStart;  
                   // Esta é a linha que causava o erro, agora em uma função isolada  
                   uint256 stakeReward \= (user.stakes\[j\].amount \* \_percentageInBasisPoints \* timeStaked) / (PERCENTAGE\_PRECISION \* \_cycleDurationInSeconds);  
                   rewardForCycle \+= stakeReward;  
               }  
           }  
       }  
   }

   /\*\*  
    \* @dev Distribui recompensas com base em uma porcentagem anual.  
    \* @param \_percentageInBasisPoints A porcentagem em pontos-base (ex: 5.40% \= 540).  
    \*/  
   function distributeReward(uint256 \_percentageInBasisPoints) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       require(\_userAddresses.length \> 0, "No stakers to distribute rewards to.");  
       require(\_percentageInBasisPoints \> 0, "Percentage must be greater than 0.");  
        
       uint256 distributionTime \= block.timestamp;  
       uint256 cycleDurationInSeconds \= cycleDurationInDays \* 1 days;  
       require(cycleDurationInSeconds \> 0, "Cycle duration must be positive.");

       uint256 totalCalculatedReward \= 0;  
        
       // Loop 1: Apenas para calcular o total e verificar a reserva  
       for (uint256 i \= 0; i \< \_userAddresses.length; i\++) {  
           address userAddr \= \_userAddresses\[i\];  
           if (userAddr \== address(0)) continue;  
           (uint256 userReward,) \= \_calculateUserReward(userAddr, distributionTime, \_percentageInBasisPoints, cycleDurationInSeconds);  
           totalCalculatedReward \+= userReward;  
       }

       require(totalCalculatedReward \<= \_rewardReserveBalance, "Insufficient reward reserve for this distribution.");

       // Loop 2: Efetivamente distribui e atualiza o estado  
       uint256 totalDistributed \= 0;  
       uint256 usersCount \= 0;  
       for (uint256 i \= 0; i \< \_userAddresses.length; i\++) {  
           address userAddr \= \_userAddresses\[i\];  
           if (userAddr \== address(0)) continue;

           (uint256 userRewardForCycle, uint256 userTotalStake) \= \_calculateUserReward(userAddr, distributionTime, \_percentageInBasisPoints, cycleDurationInSeconds);  
            
           if (userRewardForCycle \> 0) {  
               userStakes\[userAddr\].pendingReward \+= userRewardForCycle;  
               totalDistributed \+= userRewardForCycle;  
               usersCount\++;

               // Consolida os stakes do usuário em um único com o novo timestamp  
               delete userStakes\[userAddr\].stakes;  
               userStakes\[userAddr\].stakes.push(Stake({ amount: userTotalStake, timestamp: distributionTime }));  
           }  
       }

       \_rewardReserveBalance \-= totalDistributed;  
       \_totalRewardDistributed \+= totalDistributed;  
       cycleStartTime \= distributionTime;

       emit RewardDistributed(totalDistributed, usersCount);  
   }

   function depositRewards(uint256 amount) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       require(amount \> 0, "Amount must be greater than 0");  
       rewardToken.transferFromGasless(msg.sender, address(this), amount);  
       \_rewardReserveBalance \+= amount;  
       emit RewardDeposited(amount, \_rewardReserveBalance);  
   }  
    
   function claimReward(address to) external onlyRole(DEFAULT\_ADMIN\_ROLE) nonReentrant {  
       require(block.timestamp \>= timelockUntil, "Claiming is timelocked");  
       UserStakes storage user \= userStakes\[to\];  
       uint256 reward \= user.pendingReward;  
       require(reward \> 0, "No rewards to claim for this user.");  
        
       user.pendingReward \= 0;  
        
       require(rewardToken.transfer(to, reward), "Reward transfer failed");  
       emit RewardClaimed(to, reward);  
   }

   function withdrawRewardTokens(uint256 amount) external onlyRole(DEFAULT\_ADMIN\_ROLE) nonReentrant {  
       require(amount \> 0, "Amount must be greater than 0");  
       require(amount \<= \_rewardReserveBalance, "Withdrawal amount exceeds available balance");  
       \_rewardReserveBalance \-= amount;  
       require(rewardToken.transfer(msg.sender, amount), "Reward token transfer failed");  
       emit RewardTokensWithdrawn(msg.sender, amount);  
   }

   // FUNÇÕES DE CONFIGURAÇÃO (ADMIN)  
    
   /\*\*  
    \* @dev Define a duração do ciclo de recompensas em dias.  
    \* @param \_newDurationInDays A nova duração do ciclo.  
    \*/  
   function setCycleDuration(uint256 \_newDurationInDays) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       require(\_newDurationInDays \> 0, "Cycle duration must be positive.");  
       cycleDurationInDays \= \_newDurationInDays;  
       emit CycleDurationUpdated(\_newDurationInDays);  
   }

   function setStakingBlocked(bool blocked) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       stakingBlocked \= blocked;  
       emit StakingBlocked(blocked);  
   }

   function setTimelock(uint256 timestamp) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       timelockUntil \= timestamp;  
       emit TimelockSet(timestamp);  
   }

   function setAllowPartialWithdrawal(bool allow) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       allowPartialWithdrawal \= allow;  
       emit PartialWithdrawalSet(allow);  
   }

   function updateMinValueStake(uint256 value) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       minValueStake \= value;  
       emit UpdateMinValueStake(value);  
   }

   function setAllowRestake(bool status) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       \_allowRestake \= status;  
       emit RestakeStatusChanged(status);  
   }

   function removeFromBlacklist(address user) external onlyRole(DEFAULT\_ADMIN\_ROLE) {  
       \_blacklist\[user\] \= false;  
       emit BlacklistUpdated(user, false);  
   }

   // FUNÇÕES DE VISUALIZAÇÃO (VIEW)

   function getAvailableRewardBalance() external view onlyRole(DEFAULT\_ADMIN\_ROLE) returns (uint256) {  
       return \_rewardReserveBalance;  
   }

   function getTotalStakedSupply() external view returns (uint256) {  
       return \_totalSupply;  
   }

   function getNumberOfActiveUsers() external view returns (uint256) {  
       uint256 activeUsersCount \= 0;  
       for (uint256 i \= 0; i \< \_userAddresses.length; i\++) {  
           if (\_userAddresses\[i\] \!= address(0)) {  
               activeUsersCount\++;  
           }  
       }  
       return activeUsersCount;  
   }

   function getTotalRewardDistributed() external view returns (uint256) {  
       return \_totalRewardDistributed;  
   }

   function isRestakeAllowed() external view returns (bool) {  
       return \_allowRestake;  
   }

   function getBlacklistStatus(address user) external view returns (bool) {  
       return \_blacklist\[user\];  
   }

   function getTotalStakeBalance(address account) public view returns (uint256) {  
       UserStakes storage user \= userStakes\[account\];  
       uint256 total \= 0;  
       for (uint256 i \= 0; i \< user.stakes.length; i\++) {  
           total \+= user.stakes\[i\].amount;  
       }  
       return total;  
   }

   function getPendingReward(address account) external view returns (uint256) {  
       return userStakes\[account\].pendingReward;  
   }

   // FUNÇÕES INTERNAS

   function \_cleanupEmptyStakes(address user) internal {  
       UserStakes storage userStakeData \= userStakes\[user\];  
       uint256 writeIndex \= 0;  
       for (uint256 readIndex \= 0; readIndex \< userStakeData.stakes.length; readIndex\++) {  
           if (userStakeData.stakes\[readIndex\].amount \> 0) {  
               if (writeIndex \!= readIndex) {  
                   userStakeData.stakes\[writeIndex\] \= userStakeData.stakes\[readIndex\];  
               }  
               writeIndex\++;  
           }  
       }  
       while (userStakeData.stakes.length \> writeIndex) {  
           userStakeData.stakes.pop();  
       }  
   }

   function \_removeUser(address user) internal {  
       if (\_userExists\[user\]) {  
           uint256 index \= \_userIndexes\[user\];  
           // Marca o endereço como 0 para remoção posterior ou ignorar em loops  
           \_userAddresses\[index\] \= address(0);  
           \_userExists\[user\] \= false;  
           // O mapeamento \_userIndexes não precisa ser limpo, pois \_userExists previne reuso.  
       }  
   }  
}

