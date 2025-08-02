# **Documentação do Contrato de Staking: `AdvancedStakingContract`**

## **Visão Geral**

O `AdvancedStakingContract` é um contrato inteligente de staking robusto e flexível, projetado para gerenciar o depósito de tokens (stake) e distribuir recompensas. O modelo de recompensa é baseado em um percentual definido pelo administrador, calculado de forma proporcional para cada stake individual com base no valor e no tempo em que permaneceu depositado dentro de um ciclo de recompensa.

O contrato utiliza o sistema `AccessControl` da OpenZeppelin para um gerenciamento de permissões seguro e inclui proteções contra ataques de reentrância. A introdução do conceito de "ciclos de recompensa" oferece grande flexibilidade, permitindo inclusive a execução de distribuições retroativas de forma controlada.

## **Padrões e Interfaces**

* **IERC20**: O contrato interage com tokens que seguem o padrão ERC20.  
* **AccessControl**: O controle de acesso é gerenciado pelo padrão da OpenZeppelin, que implementa o ERC-165 para descoberta de interfaces.  
* **ReentrancyGuard**: Utiliza o protetor contra ataques de reentrância da OpenZeppelin.  
* **AZEToken**: Uma interface personalizada que herda de `IERC20` e adiciona a função `transferFromGasless(address from, address to, uint256 value)`. Isso permite que o contrato de stake inicie a transferência de tokens da carteira do usuário, com o gás sendo pago pelo chamador da função (o administrador).

## **Estruturas de Dados (Structs)**

O contrato utiliza duas estruturas principais para organizar os dados:

* **Stake**: Representa uma única entrada de stake de um usuário.  
  * `amount` (uint256): A quantidade de tokens nesta entrada de stake.  
  * `timestamp` (uint256): O momento (em formato de timestamp Unix) em que este stake foi criado.  
* **UserStakes**: Agrega todas as informações de stake e recompensas de um único usuário.  
  * `stakes` (Stake\[\]): Um array (lista) de todas as entradas de stake ativas para o usuário.  
  * `pendingReward` (uint256): A quantidade de tokens de recompensa que o usuário acumulou e pode reivindicar.

## **Variáveis de Estado**

As variáveis de estado armazenam os dados persistentes do contrato na blockchain.

### **Tokens**

* `stakeToken` (AZEToken): O endereço do contrato do token que os usuários irão depositar (stake).  
* `rewardToken` (AZEToken): O endereço do contrato do token que será distribuído como recompensa.

### **Dados dos Usuários**

* `userStakes` (mapping): Um mapeamento que liga o endereço de um usuário (`address`) à sua estrutura `UserStakes` correspondente.  
* `_userAddresses` (address\[\]): Um array privado que armazena os endereços de todos os usuários que já fizeram stake.  
* `_userIndexes` (mapping): Um mapeamento privado que associa um endereço de usuário ao seu índice (posição) no array `_userAddresses`.  
* `_userExists` (mapping): Um mapeamento privado que verifica de forma eficiente se um usuário já foi adicionado ao array `_userAddresses`.

### **Contadores e Saldos Globais**

* `_totalSupply` (uint256): A soma total de todos os `stakeTokens` atualmente em stake no contrato.  
* `_rewardReserveBalance` (uint256): O saldo total de `rewardTokens` que o contrato possui em sua reserva, disponíveis para distribuição.  
* `_totalRewardDistributed` (uint256): Um contador cumulativo do total de recompensas já distribuídas pelo contrato.

### **Configurações de Ciclo de Recompensa**

* `cycleDurationInDays` (uint256): A duração de um ciclo de recompensa em dias, usada como base para o cálculo proporcional dos rendimentos.  
* `cycleStartTime` (uint256): O timestamp do início do ciclo de recompensa atual. Este valor é atualizado a cada chamada da função  
   `distributeReward`.

### **Configurações Administrativas e Sistema de Blacklist**

* `minValueStake` (uint256): A quantidade mínima de tokens necessária para criar um novo stake.  
* `stakingBlocked` (bool): Uma flag que, se `true`, impede a criação de novos stakes.  
* `timelockUntil` (uint256): Um timestamp. Funções como  
   `unstake` e `claimReward` não podem ser executadas antes deste momento.  
* `allowPartialWithdrawal` (bool): Se `true`, permite que os usuários façam saques parciais. Se  
   `false`, o saque deve ser do valor total em stake.

### **Sistema de Whitelist**

* `whitelistEnabled` (bool): Uma flag que, se `true` , ativa a verificação da whitelist para novos stakes.  
* `_whitelist` (mapping): Um mapeamento privado que armazena os endereços autorizados a fazer `stake`.  
* `_whitelistedAddresses` (address\[\]): Um array privado que armazena uma lista iterável dos endereços na whitelist para consulta.  
* `_whitelistIndexes` (mapping): Um mapeamento privado que otimiza a remoção de endereços do array da whitelist.

### **Sistema de Blacklist**

* `_allowRestake` (bool): Uma flag que controla o sistema de blacklist. Se  
   `false`, usuários que fizerem `unstake` serão colocados na blacklist.  
* `_blacklist` (mapping): Um mapeamento que armazena os endereços dos usuários que estão na blacklist e impedidos de fazer novos stakes.

## **Eventos**

Eventos são emitidos para registrar ações importantes, permitindo que aplicações externas monitorem a atividade do contrato.

* `StakeCreated`: Emitido quando um novo stake é criado.  
* `Unstake`: Emitido quando um usuário retira seus tokens.  
* `RewardDeposited`: Emitido quando o administrador deposita tokens de recompensa na reserva do contrato.  
* `RewardDistributed`: Emitido quando as recompensas são distribuídas aos stakers.  
* `RewardClaimed`: Emitido quando um usuário reivindica suas recompensas pendentes.  
* `CycleDurationUpdated`: Emitido quando a duração do ciclo de recompensas é alterada.  
* `RewardTokensWithdrawn`: Emitido quando um administrador saca tokens da reserva de recompensa.  
* `StakingBlocked`, `TimelockSet`, `PartialWithdrawalSet`, `UpdateMinValueStake`: Eventos para registrar alterações nas configurações administrativas.  
* `RestakeStatusChanged`, `BlacklistUpdated`: Eventos para registrar alterações no sistema de blacklist.  
* `WhitelistUpdated` : Emitido quando um endereço é adicionado ou removido da whitelist.  
* `WhitelistEnabled` : Emitido quando a verificação da whitelist é ativada ou desativada.  
* `RewardCompounded` : Emitido quando um usuário reinveste suas recompensas pendentes.

## **Construtor**

O `constructor` é uma função especial executada apenas uma vez, no momento do deploy do contrato.

* **Parâmetros**:  
  * `stakeToken_` (address): O endereço do token de stake.  
  * `rewardToken_` (address): O endereço do token de recompensa.  
  * `minValueStake_` (uint256): O valor mínimo inicial para stake.  
  * `_initialCycleStartTime` (uint256): Um timestamp opcional para o início do primeiro ciclo. Se 0, usa o tempo do deploy.  
  * `_initialWhitelist` (address\[\]): Um array opcional de endereços para popular a whitelist no momento do deploy.  
* **Ações**:  
  * Inicializa as variáveis `stakeToken`, `rewardToken`, e `minValueStake` .  
  * Define `allowPartialWithdrawal` e `_allowRestake` como `true` por padrão.  
  * Define a `cycleDurationInDays` com o valor padrão de 90 dias.  
  * Inicializa a variável `cycleStartTime`.  
  * Concede a `DEFAULT_ADMIN_ROLE` ao endereço que fez o deploy (`msg.sender`).  
  * Inicializa a whitelist com os endereços fornecidos em `_initialWhitelist` , se houver.

## **Funções**

### **Funções de Staking (Core)**

* #### **stake(address user, uint256 amount, uint256 \_customTimestamp)**

  * **Descrição**: Cria um novo stake para um usuário, permitindo especificar um timestamp customizado.  
  * **Acesso**: `DEFAULT_ADMIN_ROLE`.  
  * **Lógica**:  
1. Verifica se a whitelist está ativa e se o usuário está nela, caso esteja.  
2. Verifica se o staking não está bloqueado, se o valor atinge o mínimo e se o usuário não está na blacklist .  
3. Usa o `_customTimestamp` se fornecido; caso contrário, usa o `block.timestamp`.  
4. Chama a função `transferFromGasless` do `stakeToken` para mover os tokens para o contrato.  
5. Adiciona uma nova entrada  
    `Stake` ao array do usuário e atualiza o `_totalSupply`.  
6. Emite o evento `StakeCreated`.

* #### **unstake(address user, uint256 amount)**

  * **Descrição**: Retira uma quantidade de tokens em stake para um usuário.  
  * **Acesso**: `DEFAULT_ADMIN_ROLE`.  
  * **Lógica**:  
1. Verifica o `timelock` e o saldo do usuário .  
2. Remove o `amount` dos stakes do usuário, começando pelos mais antigos (FIFO) .  
3. Se `_allowRestake` for `false`, adiciona o usuário à blacklist.  
4. Transfere os tokens de stake de volta para o usuário.  
5. Emite o evento `Unstake`.

### **Funções de Recompensa (Core)**

* #### **depositRewards(uint256 amount)**

  * **Descrição**: Deposita tokens de recompensa na reserva do contrato.  
  * **Acesso**: `DEFAULT_ADMIN_ROLE`.  
  * **Lógica**: Move os tokens do administrador para o contrato e incrementa `_rewardReserveBalance`.

* #### **distributeReward(uint256 \_percentageInBasisPoints)**

  * **Descrição**: Executa a distribuição de recompensas com base em um percentual para todos os stakers ativos.  
  * **Acesso**: `DEFAULT_ADMIN_ROLE`.  
  * **Lógica**:  
1. Recebe um percentual em pontos-base (ex: 5.40% \= 540).  
2. Calcula a recompensa total necessária para o ciclo e verifica se há saldo suficiente na `_rewardReserveBalance` .  
3. Para cada usuário, calcula a recompensa do ciclo e a adiciona ao seu  
    `pendingReward` .  
4. Consolida todos os stakes de um usuário em um único stake com o timestamp atual.  
5. Deduz o valor distribuído da reserva e atualiza `cycleStartTime` para o momento atual, iniciando o próximo ciclo.  
6. Emite o evento `RewardDistributed`.

* #### **compound(address user)**

  * **Descrição**: Reinveste todas as recompensas pendentes de um usuário, criando um novo `stake` com esse valor.  
  * **Acesso**: `DEFAULT_ADMIN_ROLE` .  
  * **Lógica**:  
7. Obtém o valor do `pendingReward` do usuário.  
8. Zera o `pendingReward` do usuário.  
9. Cria um novo `stake` para o usuário com o valor da recompensa, usando o timestamp atual.  
10. Atualiza o `_totalSupply` .  
11. Emite o evento `RewardCompounded` .

* #### **claimReward(address to)**

  * **Descrição**: Reivindica as recompensas pendentes para um usuário.  
  * **Acesso**: `DEFAULT_ADMIN_ROLE`.  
  * **Lógica**: Zera o `pendingReward` do usuário e transfere os tokens de recompensa para sua carteira.

### **Funções Administrativas (Gerenciamento)**

* **`withdrawRewardTokens(uint256 amount)`**: Permite que um admin saque tokens da reserva de recompensa.  
* **`setCycleDuration(uint256 _newDurationInDays)`**: Define a duração do ciclo de recompensa em dias.  
* **`setAllowRestake(bool status)`**: Ativa ou desativa o sistema de blacklist.  
* **`removeFromBlacklist(address user)`**: Remove um usuário da blacklist.  
* **`setStakingBlocked(bool blocked)`**: Bloqueia ou desbloqueia novos stakes.  
* **`setTimelock(uint256 timestamp)`**: Define um timelock para saques e reivindicações.  
* **`setAllowPartialWithdrawal(bool allow)`**: Permite ou proíbe saques parciais.  
* **`updateMinValueStake(uint256 value)`**: Atualiza o valor mínimo para stake.  
* **`addToWhitelist(address user)`** : Adiciona um endereço à whitelist.  
* **`removeFromWhitelist(address user)`** : Remove um endereço da whitelist.  
* **`setWhitelistEnabled(bool enabled)`** : Ativa ou desativa globalmente a verificação da whitelist.

### **Funções de Leitura (Views)**

* **`getAvailableRewardBalance()`**: Retorna a reserva de recompensas.  
* **`getTotalStakedSupply()`**: Retorna o total de tokens em stake.  
* **`getNumberOfActiveUsers()`**: Retorna o número de stakers ativos.  
* **`getTotalRewardDistributed()`**: Retorna o total de recompensas já distribuídas.  
* **`isRestakeAllowed()`**: Retorna o status do sistema de blacklist.  
* **`getBlacklistStatus(address user)`**: Verifica se um usuário está na blacklist.  
* **`getTotalStakeBalance(address account)`**: Retorna o saldo total em stake de um usuário.  
* **`getWhitelistedAddresses()`** : Retorna um array com todos os endereços atualmente na whitelist.  
* **`getPendingReward(address account)`**: Retorna as recompensas pendentes de um usuário.

### **Funções Internas (Internal)**

* **`_calculateUserReward(...)`**: Função auxiliar que calcula a recompensa de um único usuário para o ciclo, evitando o erro "Stack too deep" e melhorando a organização do código.  
* **`_cleanupEmptyStakes(address user)`**: Remove as entradas de stake vazias do array de um usuário.  
* **`_removeUser(address user)`**: Marca um usuário como inativo, substituindo seu endereço por `address(0)` no array `_userAddresses` para economizar gás.  
* **`_addAddressToWhitelist(address user)`** : Função interna que gerencia a adição de um endereço ao mapping e ao array da whitelist.  
* **`_removeAddressFromWhitelist(address user)`** : Função interna que gerencia a remoção de um endereço do mapping e do array da whitelist de forma otimizada.