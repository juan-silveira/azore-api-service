const queueService = require('../services/queue.service');
const { ethers } = require('ethers');

console.log('🚀 QueueMiddleware carregado com sucesso!');

/**
 * Middleware para enfileirar operações externas automaticamente
 */
class QueueMiddleware {
  /**
   * Middleware principal que detecta e enfileira operações automaticamente
   */
  static async enqueueExternalOperations(req, res, next) {
    console.log(`🚀 QueueMiddleware.enqueueExternalOperations chamado!`);
    
    // Construir o caminho completo da rota
    const fullPath = req.baseUrl + req.path;
    console.log(`🔍 QueueMiddleware: Verificando rota ${req.method} ${fullPath} (baseUrl: ${req.baseUrl}, path: ${req.path})`);
    
    try {
      // Verificar se é uma operação que deve ser enfileirada
      const shouldEnqueue = QueueMiddleware.shouldEnqueue(fullPath, req.method);
      console.log(`🔍 QueueMiddleware: shouldEnqueue = ${shouldEnqueue}`);
      
      if (!shouldEnqueue) {
        console.log(`⏭️ QueueMiddleware: Rota não enfileirada, continuando...`);
        return next();
      }

      // Determinar o tipo de operação baseado na rota e método
      const operationType = QueueMiddleware.determineOperationType(req.path, req.method);
      console.log(`🔍 QueueMiddleware: operationType determinado = ${operationType}`);
      
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

      // Converter valores de ETH para Wei automaticamente
      if (queueData.data.amount && typeof queueData.data.amount === 'string' && !queueData.data.amount.startsWith('0x')) {
        try {
          // Verificar se o valor já está em Wei (muito grande)
          const amountFloat = parseFloat(queueData.data.amount);
          if (amountFloat < 1e15) { // Se for menor que 0.001 ETH, provavelmente está em ETH
            // Para stake operations, não converter aqui - deixar o stakeService fazer
            if (!operationType.startsWith('stake_')) {
              const amountWei = ethers.parseEther(queueData.data.amount).toString();
              console.log(`🔄 Convertendo amount de ETH para Wei: ${queueData.data.amount} ETH -> ${amountWei} Wei`);
              queueData.data.amountEth = queueData.data.amount; // Manter o valor original em ETH
              queueData.data.amount = amountWei; // Atualizar para Wei
            } else {
              console.log(`🔄 Para stake operations, mantendo amount em ETH: ${queueData.data.amount} (conversão feita pelo stakeService)`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao converter amount para Wei: ${error.message}`);
        }
      }

      // Extrair endereço do stake da URL se for uma operação de stake
      if (operationType.startsWith('stake_')) {
        // Extrair endereço do path: /0x123.../invest -> 0x123...
        const pathParts = req.path.split('/').filter(Boolean);
        if (pathParts.length > 0 && pathParts[0].startsWith('0x')) {
          queueData.data.stakeAddress = pathParts[0];
          queueData.data.address = pathParts[0];
        }
      }

      // Extrair endereço do contrato da URL se for uma operação de contract
      if (operationType.startsWith('contract_')) {
        // Extrair endereço do path: /0x123.../write -> 0x123...
        const pathParts = req.path.split('/').filter(Boolean);
        if (pathParts.length > 0 && pathParts[0].startsWith('0x')) {
          queueData.data.contractAddress = pathParts[0];
          queueData.data.address = pathParts[0];
        }
      }

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
          estimatedProcessingTime: QueueMiddleware.getEstimatedTime(operationType),
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
    console.log(`🔍 determineOperationType: path=${path}, method=${method}`);
    
    // Extrair informações da rota (path é relativo, ex: /mint, /balance)
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[0]; // /mint -> mint, /balance -> balance
    
    console.log(`🔍 pathParts=${JSON.stringify(pathParts)}, action=${action}`);
    
    // Mapeamento automático baseado no padrão da rota
    if (method === 'POST') {
      // Operações de escrita
      switch (action) {
        case 'mint': 
          console.log(`✅ Detectado token_mint`);
          return 'token_mint';
        case 'burn': 
          console.log(`✅ Detectado token_burn`);
          return 'token_burn';
        case 'transfer-gasless': 
          console.log(`✅ Detectado token_transfer_gasless`);
          return 'token_transfer_gasless';
        case 'register': 
          // Verificar se é stake ou token
          if (path.includes('/stakes/')) {
            console.log(`✅ Detectado stake_register`);
            return 'stake_register';
          }
          console.log(`✅ Detectado token_register`);
          return 'token_register';
        case 'deploy': 
          console.log(`✅ Detectado contract_deploy`);
          return 'contract_deploy';
        default:
          console.log(`🔍 Verificando padrões específicos para: ${path}`);
          if (path.includes('/grant-role')) {
            console.log(`✅ Detectado contract_grant_role`);
            return 'contract_grant_role';
          }
          if (path.includes('/revoke-role')) {
            console.log(`✅ Detectado contract_revoke_role`);
            return 'contract_revoke_role';
          }
          if (path.includes('/has-role')) {
            console.log(`✅ Detectado contract_has_role`);
            return 'contract_has_role';
          }
          if (path.includes('/write')) {
            console.log(`✅ Detectado contract_write`);
            return 'contract_write';
          }
          if (path.includes('/invest')) {
            console.log(`✅ Detectado stake_invest`);
            return 'stake_invest';
          }
          if (path.includes('/withdraw')) {
            console.log(`✅ Detectado stake_withdraw`);
            return 'stake_withdraw';
          }
          if (path.includes('/claim-rewards')) {
            console.log(`✅ Detectado stake_claim_rewards`);
            return 'stake_claim_rewards';
          }
          if (path.includes('/compound')) {
            console.log(`✅ Detectado stake_compound`);
            return 'stake_compound';
          }
          if (path.includes('/deposit-rewards')) {
            console.log(`✅ Detectado stake_deposit_rewards`);
            return 'stake_deposit_rewards';
          }
          if (path.includes('/distribute-rewards')) {
            console.log(`✅ Detectado stake_distribute_rewards`);
            return 'stake_distribute_rewards';
          }
          if (path.includes('/withdraw-reward-tokens')) {
            console.log(`✅ Detectado stake_withdraw_reward_tokens`);
            return 'stake_withdraw_reward_tokens';
          }
          if (path.includes('/set-cycle-duration')) {
            console.log(`✅ Detectado stake_set_cycle_duration`);
            return 'stake_set_cycle_duration';
          }
          if (path.includes('/set-allow-restake')) {
            console.log(`✅ Detectado stake_set_allow_restake`);
            return 'stake_set_allow_restake';
          }
          if (path.includes('/remove-from-blacklist')) {
            console.log(`✅ Detectado stake_remove_from_blacklist`);
            return 'stake_remove_from_blacklist';
          }
          if (path.includes('/set-staking-blocked')) {
            console.log(`✅ Detectado stake_set_staking_blocked`);
            return 'stake_set_staking_blocked';
          }
          if (path.includes('/set-timelock')) {
            console.log(`✅ Detectado stake_set_timelock`);
            return 'stake_set_timelock';
          }
          if (path.includes('/set-allow-partial-withdrawal')) {
            console.log(`✅ Detectado stake_set_allow_partial_withdrawal`);
            return 'stake_set_allow_partial_withdrawal';
          }
          if (path.includes('/update-min-value-stake')) {
            console.log(`✅ Detectado stake_update_min_value_stake`);
            return 'stake_update_min_value_stake';
          }
          if (path.includes('/add-to-whitelist')) {
            console.log(`✅ Detectado stake_add_to_whitelist`);
            return 'stake_add_to_whitelist';
          }
          if (path.includes('/remove-from-whitelist')) {
            console.log(`✅ Detectado stake_remove_from_whitelist`);
            return 'stake_remove_from_whitelist';
          }
          if (path.includes('/set-whitelist-enabled')) {
            console.log(`✅ Detectado stake_set_whitelist_enabled`);
            return 'stake_set_whitelist_enabled';
          }
          if (path.includes('/enqueue')) {
            console.log(`✅ Detectado transaction_enqueue`);
            return 'transaction_enqueue';
          }
          console.log(`⚠️ Nenhum padrão encontrado, retornando external_operation`);
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
      // Token operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/tokens\/mint$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/burn$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/transfer-gasless$/, method: 'POST' },
      { pattern: /^\/api\/tokens\/register$/, method: 'POST' },
      
      // Contract operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/contracts\/deploy$/, method: 'POST' },
      { pattern: /^\/api\/contracts\/[^\/]+\/write$/, method: 'POST' },
      { pattern: /^\/api\/contracts\/[^\/]+\/grant-role$/, method: 'POST' },
      { pattern: /^\/api\/contracts\/[^\/]+\/revoke-role$/, method: 'POST' },
      
      // Stake operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/stakes\/register$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/invest$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/withdraw$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/claim-rewards$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/compound$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/deposit-rewards$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/distribute-rewards$/, method: 'POST' },
      
      // Stake admin operations (POST) - OPERAÇÕES QUE CONSUMEM GÁS
      { pattern: /^\/api\/stakes\/[^\/]+\/withdraw-reward-tokens$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-cycle-duration$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-allow-restake$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/remove-from-blacklist$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-staking-blocked$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-timelock$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-allow-partial-withdrawal$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/update-min-value-stake$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/add-to-whitelist$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/remove-from-whitelist$/, method: 'POST' },
      { pattern: /^\/api\/stakes\/[^\/]+\/set-whitelist-enabled$/, method: 'POST' }
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
      'contract_revoke_role': '10-30 segundos',
      'stake_invest': '15-45 segundos',
      'stake_withdraw': '15-45 segundos',
      'stake_claim_rewards': '15-45 segundos',
      'stake_compound': '15-45 segundos',
      'stake_deposit_rewards': '15-45 segundos',
      'stake_distribute_rewards': '15-45 segundos',
      
      // Consultas (mais rápidas)
      'token_balance_query': '2-5 segundos',
      'token_info_query': '2-5 segundos',
      'contract_functions_query': '2-5 segundos',
      'contract_events_query': '2-5 segundos',
      'stake_info_query': '2-5 segundos',
      'stake_reward_query': '2-5 segundos',
      'stake_supply_query': '2-5 segundos',
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