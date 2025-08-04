const queueService = require('../services/queue.service');

console.log('🚀 QueueMiddleware carregado com sucesso!');

/**
 * Middleware para enfileirar automaticamente rotas que fazem comunicação externa
 */
class QueueMiddleware {
  /**
   * Middleware principal que detecta e enfileira operações automaticamente
   */
  static async enqueueExternalOperations(req, res, next) {
    // Construir o caminho completo da rota
    const fullPath = req.baseUrl + req.path;
    console.log(`🔍 QueueMiddleware: Verificando rota ${req.method} ${fullPath} (baseUrl: ${req.baseUrl}, path: ${req.path})`);
    
    try {
      // Verificar se é uma operação que deve ser enfileirada
      const shouldEnqueue = this.shouldEnqueue(fullPath, req.method);
      console.log(`🔍 QueueMiddleware: shouldEnqueue = ${shouldEnqueue}`);
      
      if (!shouldEnqueue) {
        console.log(`⏭️ QueueMiddleware: Rota não enfileirada, continuando...`);
        return next();
      }

      // Determinar o tipo de operação baseado na rota e método
      const operationType = this.determineOperationType(fullPath, req.method);
      
      // Preparar dados para enfileiramento
      const queueData = {
        type: operationType,
        data: {
          ...req.body,
          ...req.query,
          path: req.path,
          method: req.method,
          clientId: req.client?.id,
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        }
      };

      // Enfileirar a operação
      const result = await queueService.enqueueBlockchainTransaction(queueData);

      // Retornar resposta imediata com jobId
      return res.status(202).json({
        success: true,
        message: 'Operação enfileirada com sucesso',
        data: {
          jobId: result.jobId,
          status: 'queued',
          operationType: operationType,
          estimatedProcessingTime: this.getEstimatedTime(operationType),
          checkStatusUrl: `/api/transactions/queue/${result.jobId}`,
          originalPath: req.path,
          originalMethod: req.method
        }
      });

    } catch (error) {
      console.error('Erro ao enfileirar operação:', error);
      // Se falhar o enfileiramento, continua com a execução normal
      return next();
    }
  }

  /**
   * Determina automaticamente o tipo de operação baseado na rota
   */
  static determineOperationType(path, method) {
    // Extrair informações da rota (path é relativo, ex: /mint, /balance)
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[0]; // /mint -> mint, /balance -> balance
    
    // Mapeamento automático baseado no padrão da rota
    if (method === 'POST') {
      // Operações de escrita
      switch (action) {
        case 'mint': return 'token_mint';
        case 'burn': return 'token_burn';
        case 'transfer-gasless': return 'token_transfer_gasless';
        case 'register': 
          // Verificar se é stake ou token
          if (path.includes('/stakes/')) return 'stake_register';
          return 'token_register';
        case 'deploy': return 'contract_deploy';
        default:
          if (path.includes('/grant-role')) return 'contract_grant_role';
          if (path.includes('/revoke-role')) return 'contract_revoke_role';
          if (path.includes('/has-role')) return 'contract_has_role';
          if (path.includes('/write')) return 'contract_write';
          if (path.includes('/invest')) return 'stake_invest';
          if (path.includes('/withdraw')) return 'stake_withdraw';
          if (path.includes('/claim-rewards')) return 'stake_claim_rewards';
          if (path.includes('/compound')) return 'stake_compound';
          if (path.includes('/deposit-rewards')) return 'stake_deposit_rewards';
          if (path.includes('/distribute-rewards')) return 'stake_distribute_rewards';
          if (path.includes('/enqueue')) return 'transaction_enqueue';
          return 'external_operation';
      }
    } else if (method === 'GET') {
      // Consultas que fazem comunicação externa
      switch (action) {
        case 'balance': return 'token_balance_query';
        case 'balanceAZE': return 'token_balance_query';
        case 'connection': return 'blockchain_connection_query';
        case 'network-info': return 'blockchain_network_query';
        default:
          if (path.includes('/info')) {
            // Verificar se é stake ou token
            if (path.includes('/stakes/')) return 'stake_info_query';
            return 'token_info_query';
          }
          if (path.includes('/functions')) return 'contract_functions_query';
          if (path.includes('/events')) return 'contract_events_query';
          if (path.includes('/available-reward-balance')) return 'stake_reward_query';
          if (path.includes('/total-staked-supply')) return 'stake_supply_query';
          if (path.includes('/balance/')) return 'blockchain_balance_query';
          if (path.includes('/transaction/')) return 'blockchain_transaction_query';
          return 'external_query';
      }
    }
    
    return 'unknown_operation';
  }

  /**
   * Verifica se a rota deve ser enfileirada baseado em padrões
   */
  static shouldEnqueue(path, method) {
    // Lista de padrões de rotas que fazem comunicação externa
    const externalPatterns = [
      // Token operations (POST)
      { pattern: /^\/api\/tokens\/mint$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/burn$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/transfer-gasless$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/register$/, method: 'POST' },
      
      // Token queries (GET)
      { pattern: /^\/api\/tokens\/balance$/, method: 'GET' },
      { pattern: /^\/api\/tokens\/balanceAZE$/, method: 'GET' },
      { pattern: /^\/api\/tokens\/[^\/]+\/info$/, method: 'GET' },
            { pattern: /^\/api\/tokens\/[^\/]+\/update-info$/, method: 'PUT' },
      { pattern: /^\/api\/tokens\/test\/service$/, method: 'GET' },
      { pattern: /^\/api\/tokens\/[^\/]+\/deactivate$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/[^\/]+\/activate$/, method: 'POST' },
      
      // Contract operations (POST) - REMOVIDO DO SISTEMA DE FILAS
      // { pattern: /^\/api\/contracts\/deploy$/, method: 'POST' },
      // { pattern: /^\/api\/contracts\/[^\/]+\/write$/, method: 'POST' },
      // { pattern: /^\/api\/contracts\/[^\/]+\/grant-role$/, method: 'POST' },
      // { pattern: /^\/api\/contracts\/[^\/]+\/revoke-role$/, method: 'POST' },
      
      // Contract queries (GET) - REMOVIDO DO SISTEMA DE FILAS
      // { pattern: /^\/api\/contracts\/[^\/]+\/functions$/, method: 'GET' },
      // { pattern: /^\/api\/contracts\/[^\/]+\/events$/, method: 'GET' },
      // { pattern: /^\/api\/contracts\/validate-abi$/, method: 'POST' },
      // { pattern: /^\/api\/contracts\/[^\/]+\/events\/query$/, method: 'POST' },
      // { pattern: /^\/api\/contracts\/[^\/]+\/has-role$/, method: 'POST' },
      // { pattern: /^\/api\/contracts\/test\/service$/, method: 'GET' },
      
      // Stake operations (POST) - REMOVIDO DO SISTEMA DE FILAS
      // { pattern: /^\/api\/stakes\/register$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/invest$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/withdraw$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/claim-rewards$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/compound$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/deposit-rewards$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/distribute-rewards$/, method: 'POST' },
      
      // Stake queries (GET) - REMOVIDO DO SISTEMA DE FILAS
      // { pattern: /^\/api\/stakes\/[^\/]+\/info$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/available-reward-balance$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/total-staked-supply$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/number-of-active-users$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/total-reward-distributed$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/is-restake-allowed$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/whitelisted-addresses$/, method: 'GET' },
      // { pattern: /^\/api\/stakes\/test\/service$/, method: 'GET' },
      
      // Stake admin operations (POST) - REMOVIDO DO SISTEMA DE FILAS
      // { pattern: /^\/api\/stakes\/[^\/]+\/withdraw-reward-tokens$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/set-cycle-duration$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/set-allow-restake$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/remove-from-blacklist$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/set-staking-blocked$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/set-timelock$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/set-allow-partial-withdrawal$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/update-min-value-stake$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/add-to-whitelist$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/remove-from-whitelist$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/set-whitelist-enabled$/, method: 'POST' },
      
      // Stake queries (POST) - REMOVIDO DO SISTEMA DE FILAS
      // { pattern: /^\/api\/stakes\/[^\/]+\/blacklist-status$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/total-stake-balance$/, method: 'POST' },
      // { pattern: /^\/api\/stakes\/[^\/]+\/pending-reward$/, method: 'POST' },
      
      // Blockchain test queries (GET)
      { pattern: /^\/api\/test\/connection$/, method: 'GET' },
      { pattern: /^\/api\/test\/network-info$/, method: 'GET' },
      { pattern: /^\/api\/test\/balance\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/transaction\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/block\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/gas-price$/, method: 'GET' },
      { pattern: /^\/api\/test\/network$/, method: 'GET' },
      { pattern: /^\/api\/test\/blockchain\/connection$/, method: 'GET' },
      { pattern: /^\/api\/test\/blockchain\/network-info$/, method: 'GET' },
      { pattern: /^\/api\/test\/blockchain\/latest-block$/, method: 'GET' },
      { pattern: /^\/api\/test\/blockchain\/blocks\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/blockchain\/transactions\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/blockchain\/wallets\/[^\/]+\/balance$/, method: 'GET' },
      { pattern: /^\/api\/test\/blocks\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/transactions\/[^\/]+$/, method: 'GET' },
      { pattern: /^\/api\/test\/wallets\/[^\/]+\/balance$/, method: 'GET' },
      { pattern: /^\/api\/test\/transactions\/[^\/]+\/details$/, method: 'GET' },
      { pattern: /^\/api\/test\/blocks\/[^\/]+\/details$/, method: 'GET' },
      { pattern: /^\/api\/test\/wallets\/balances$/, method: 'POST' }
    ];

    return externalPatterns.some(route => {
      const methodMatch = route.method === method;
      const pathMatch = route.pattern.test(path);
      return methodMatch && pathMatch;
    });
  }

  /**
   * Obtém o tempo estimado de processamento baseado no tipo de operação
   */
  static getEstimatedTime(operationType) {
    const timeEstimates = {
      // Operações de blockchain (mais lentas)
      'token_mint': '10-30 segundos',
      'token_burn': '10-30 segundos',
      'token_transfer_gasless': '10-30 segundos',
      'contract_deploy': '30-60 segundos',
      'contract_write': '10-30 segundos',
      'contract_grant_role': '10-30 segundos',
      'stake_invest': '15-45 segundos',
      'stake_withdraw': '15-45 segundos',
      'stake_claim_rewards': '15-45 segundos',
      
      // Consultas (mais rápidas)
      'token_balance_query': '2-5 segundos',
      'token_info_query': '2-5 segundos',
      'contract_functions_query': '2-5 segundos',
      'contract_events_query': '2-5 segundos',
      'stake_info_query': '2-5 segundos',
      'blockchain_connection_query': '1-3 segundos',
      'blockchain_balance_query': '2-5 segundos',
      'blockchain_transaction_query': '2-5 segundos'
    };
    
    return timeEstimates[operationType] || '5-15 segundos';
  }

  /**
   * Middleware para operações de blockchain (POST)
   */
  static enqueueBlockchainOperation(req, res, next) {
    return QueueMiddleware.enqueueExternalOperations(req, res, next);
  }

  /**
   * Middleware para consultas de blockchain (GET)
   */
  static enqueueBlockchainQuery(req, res, next) {
    return QueueMiddleware.enqueueExternalOperations(req, res, next);
  }
}

module.exports = QueueMiddleware; 