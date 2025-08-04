const stakeService = require('../services/stake.service');

/**
 * Controller para gerenciamento de contratos de staking
 */
class StakeController {

  /**
   * Registra um novo stake
   */
  async registerStake(req, res) {
    try {
      const { name, address, network } = req.body;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do stake é obrigatório'
        });
      }

      if (!network) {
        return res.status(400).json({
          success: false,
          message: 'Rede é obrigatória'
        });
      }

      const result = await stakeService.registerStake({ name, address, network });
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao registrar stake',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações do stake
   */
  async getStakeInfo(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.getStakeInfo(address);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações do stake',
        error: error.message
      });
    }
  }

  /**
   * Investir token (stake)
   */
  async investToken(req, res) {
    try {
      const { address } = req.params;
      const { user, amount, customTimestamp = 0 } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'stake', 
        [user, amount, customTimestamp], 
        null // Não precisamos mais do adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao investir token',
        error: error.message
      });
    }
  }

  /**
   * Retirar investimento (unstake)
   */
  async withdrawInvestment(req, res) {
    try {
      const { address } = req.params;
      const { user, amount } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'unstake', 
        [user, amount], 
        null // Não precisamos mais do adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao retirar investimento',
        error: error.message
      });
    }
  }

  /**
   * Resgatar recompensas (claimReward)
   */
  async claimRewards(req, res) {
    try {
      const { address } = req.params;
      const { user } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      // Verificar se o stake existe e obter adminPublicKey
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'claimReward', 
        [user], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao resgatar recompensas',
        error: error.message
      });
    }
  }

  /**
   * Reinvestir recompensas (compound)
   */
  async compoundRewards(req, res) {
    try {
      const { address } = req.params;
      const { user } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      // Verificar se o stake existe e obter adminPublicKey
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'compound', 
        [user], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao reinvestir recompensas',
        error: error.message
      });
    }
  }

  // ===== ROTAS QUE SOMENTE O adminPublicKey DO STAKE PODE CHAMAR =====

  /**
   * Depositar recompensas no cofre (depositRewards)
   */
  async depositRewards(req, res) {
    try {
      const { address } = req.params;
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'depositRewards', 
        [amount], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao depositar recompensas',
        error: error.message
      });
    }
  }

  /**
   * Distribuir recompensas (distributeReward)
   */
  async distributeRewards(req, res) {
    try {
      const { address } = req.params;
      const { percentageInBasisPoints } = req.body;
      
      if (!percentageInBasisPoints) {
        return res.status(400).json({
          success: false,
          message: 'Percentual em pontos-base é obrigatório'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'distributeReward', 
        [percentageInBasisPoints], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao distribuir recompensas',
        error: error.message
      });
    }
  }

  /**
   * Retirar recompensas do cofre (withdrawRewardTokens)
   */
  async withdrawRewardTokens(req, res) {
    try {
      const { address } = req.params;
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'withdrawRewardTokens', 
        [amount], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao retirar recompensas do cofre',
        error: error.message
      });
    }
  }

  /**
   * Definir duração do ciclo de recompensas (setCycleDuration)
   */
  async setCycleDuration(req, res) {
    try {
      const { address } = req.params;
      const { newDurationInDays } = req.body;
      
      if (!newDurationInDays) {
        return res.status(400).json({
          success: false,
          message: 'Nova duração em dias é obrigatória'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'setCycleDuration', 
        [newDurationInDays], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao definir duração do ciclo',
        error: error.message
      });
    }
  }

  /**
   * Permitir/Bloquear reinvestir (setAllowRestake)
   */
  async setAllowRestake(req, res) {
    try {
      const { address } = req.params;
      const { status, adminPublicKey } = req.body;
      
      if (typeof status !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Status deve ser um booleano'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'setAllowRestake', 
        [status], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao definir permissão de reinvestir',
        error: error.message
      });
    }
  }

  /**
   * Remover da blacklist (removeFromBlacklist)
   */
  async removeFromBlacklist(req, res) {
    try {
      const { address } = req.params;
      const { user } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'removeFromBlacklist', 
        [user], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao remover da blacklist',
        error: error.message
      });
    }
  }

  /**
   * Permitir/Bloquear novos investimentos (setStakingBlocked)
   */
  async setStakingBlocked(req, res) {
    try {
      const { address } = req.params;
      const { blocked } = req.body;
      
      if (typeof blocked !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Blocked deve ser um booleano'
        });
      }

      // Verificar se o stake existe
      const stake = await stakeService.getStakeByAddress(address);
      if (!stake.success) {
        return res.status(404).json(stake);
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'setStakingBlocked', 
        [blocked], 
        null
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao definir bloqueio de staking',
        error: error.message
      });
    }
  }

  /**
   * Definir tempo de carência (setTimelock)
   */
  async setTimelock(req, res) {
    try {
      const { address } = req.params;
      const { timestamp, adminPublicKey } = req.body;
      
      if (!timestamp) {
        return res.status(400).json({
          success: false,
          message: 'Timestamp é obrigatório'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'setTimelock', 
        [timestamp], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao definir timelock',
        error: error.message
      });
    }
  }

  /**
   * Permitir/Proibir retiradas parciais (setAllowPartialWithdrawal)
   */
  async setAllowPartialWithdrawal(req, res) {
    try {
      const { address } = req.params;
      const { allow, adminPublicKey } = req.body;
      
      if (typeof allow !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Allow deve ser um booleano'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'setAllowPartialWithdrawal', 
        [allow], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao definir permissão de retirada parcial',
        error: error.message
      });
    }
  }

  /**
   * Definir novo valor mínimo (updateMinValueStake)
   */
  async updateMinValueStake(req, res) {
    try {
      const { address } = req.params;
      const { value, adminPublicKey } = req.body;
      
      if (!value) {
        return res.status(400).json({
          success: false,
          message: 'Valor é obrigatório'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'updateMinValueStake', 
        [value], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar valor mínimo',
        error: error.message
      });
    }
  }

  /**
   * Adicionar na whitelist (addToWhitelist)
   */
  async addToWhitelist(req, res) {
    try {
      const { address } = req.params;
      const { user, adminPublicKey } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'addToWhitelist', 
        [user], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao adicionar na whitelist',
        error: error.message
      });
    }
  }

  /**
   * Remover da whitelist (removeFromWhitelist)
   */
  async removeFromWhitelist(req, res) {
    try {
      const { address } = req.params;
      const { user, adminPublicKey } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'removeFromWhitelist', 
        [user], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao remover da whitelist',
        error: error.message
      });
    }
  }

  /**
   * Ativar/Desativar whitelist (setWhitelistEnabled)
   */
  async setWhitelistEnabled(req, res) {
    try {
      const { address } = req.params;
      const { enabled, adminPublicKey } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Enabled deve ser um booleano'
        });
      }

      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      // Verificar se o adminPublicKey tem permissão
      const isAdmin = await stakeService.verifyStakeAdmin(address, adminPublicKey);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer ser admin do stake'
        });
      }

      const result = await stakeService.writeStakeContract(
        address, 
        'setWhitelistEnabled', 
        [enabled], 
        adminPublicKey
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao definir whitelist',
        error: error.message
      });
    }
  }

  // ===== ROTAS DE CONSULTA =====

  /**
   * Saldo do cofre (getAvailableRewardBalance)
   */
  async getAvailableRewardBalance(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.readStakeContract(address, 'getAvailableRewardBalance');
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter saldo do cofre',
        error: error.message
      });
    }
  }

  /**
   * Total investido (getTotalStakedSupply)
   */
  async getTotalStakedSupply(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.readStakeContract(address, 'getTotalStakedSupply');
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter total investido',
        error: error.message
      });
    }
  }

  /**
   * Total de investidores (getNumberOfActiveUsers)
   */
  async getNumberOfActiveUsers(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.readStakeContract(address, 'getNumberOfActiveUsers');
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter total de investidores',
        error: error.message
      });
    }
  }

  /**
   * Total de recompensas distribuídas (getTotalRewardDistributed)
   */
  async getTotalRewardDistributed(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.readStakeContract(address, 'getTotalRewardDistributed');
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter total de recompensas distribuídas',
        error: error.message
      });
    }
  }

  /**
   * Permissão de reinvestir (isRestakeAllowed)
   */
  async isRestakeAllowed(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.readStakeContract(address, 'isRestakeAllowed');
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao verificar permissão de reinvestir',
        error: error.message
      });
    }
  }

  /**
   * Verificar se usuário está na blacklist (getBlacklistStatus)
   */
  async getBlacklistStatus(req, res) {
    try {
      const { address } = req.params;
      const { user } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }
      
      const result = await stakeService.readStakeContract(address, 'getBlacklistStatus', [user]);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao verificar status da blacklist',
        error: error.message
      });
    }
  }

  /**
   * Total investido pelo usuário (getTotalStakeBalance)
   */
  async getTotalStakeBalance(req, res) {
    try {
      const { address } = req.params;
      const { user } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }
      
      const result = await stakeService.readStakeContract(address, 'getTotalStakeBalance', [user]);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter total investido pelo usuário',
        error: error.message
      });
    }
  }

  /**
   * Verificar lista da whitelist (getWhitelistedAddresses)
   */
  async getWhitelistedAddresses(req, res) {
    try {
      const { address } = req.params;
      
      const result = await stakeService.readStakeContract(address, 'getWhitelistedAddresses');
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter lista da whitelist',
        error: error.message
      });
    }
  }

  /**
   * Verificar recompensas pendentes de um usuário (getPendingReward)
   */
  async getPendingReward(req, res) {
    try {
      const { address } = req.params;
      const { user } = req.body;
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do usuário é obrigatório'
        });
      }
      
      const result = await stakeService.readStakeContract(address, 'getPendingReward', [user]);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter recompensas pendentes',
        error: error.message
      });
    }
  }

  /**
   * Lista todos os stakes
   */
  async listStakes(req, res) {
    try {
      const { page = 1, limit = 10, network, contractType } = req.query;
      
      const result = await stakeService.listStakes({
        page: parseInt(page),
        limit: parseInt(limit),
        network,
        contractType
      });
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar stakes',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de stakes
   */
  async testService(req, res) {
    try {
      const result = await stakeService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no teste do serviço',
        error: error.message
      });
    }
  }
}

module.exports = new StakeController(); 