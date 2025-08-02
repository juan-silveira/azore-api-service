const contractService = require('../services/contract.service');

/**
 * Controller para gerenciamento de contratos inteligentes
 */
class ContractController {


  /**
   * Executa operação de leitura no contrato
   */
  async readContract(req, res) {
    try {
      const { address } = req.params;
      const { functionName, params = [], options = {} } = req.body;
      
      if (!functionName) {
        return res.status(400).json({
          success: false,
          message: 'Nome da função é obrigatório'
        });
      }

      const result = await contractService.readContract(address, functionName, params, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro na operação de leitura',
        error: error.message
      });
    }
  }

  /**
   * Executa operação de escrita no contrato
   */
  async writeContract(req, res) {
    try {
      const { address } = req.params;
      const { functionName, params = [], walletAddress, options = {} } = req.body;
      
      if (!functionName) {
        return res.status(400).json({
          success: false,
          message: 'Nome da função é obrigatório'
        });
      }

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço da carteira é obrigatório'
        });
      }

      const result = await contractService.writeContract(address, functionName, params, walletAddress, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro na operação de escrita',
        error: error.message
      });
    }
  }

  /**
   * Implanta um novo contrato
   */
  async deployContract(req, res) {
    try {
      const { contractData, walletAddress, options = {} } = req.body;
      
      if (!contractData) {
        return res.status(400).json({
          success: false,
          message: 'Dados do contrato são obrigatórios'
        });
      }

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço da carteira é obrigatório'
        });
      }

      const result = await contractService.deployContract(contractData, walletAddress, options);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro na implantação do contrato',
        error: error.message
      });
    }
  }

  /**
   * Obtém eventos do contrato
   */
  async getContractEvents(req, res) {
    try {
      const { address } = req.params;
      const { eventName, fromBlock = 0, toBlock = 'latest', options = {} } = req.body;
      
      if (!eventName) {
        return res.status(400).json({
          success: false,
          message: 'Nome do evento é obrigatório'
        });
      }

      const result = await contractService.getContractEvents(address, eventName, fromBlock, toBlock, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter eventos',
        error: error.message
      });
    }
  }



  /**
   * Obtém funções do contrato
   */
  async getContractFunctions(req, res) {
    try {
      const { address } = req.params;
      const contract = await contractService.getContractByAddress(address);
      
      if (!contract.success) {
        return res.status(404).json(contract);
      }

      const functions = contract.data.getFunctions();
      
      res.status(200).json({
        success: true,
        message: 'Funções do contrato obtidas com sucesso',
        data: {
          contractAddress: address,
          functions: functions.map(func => ({
            name: func.name,
            inputs: func.inputs || [],
            outputs: func.outputs || [],
            stateMutability: func.stateMutability,
            type: func.type
          })),
          count: functions.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter funções do contrato',
        error: error.message
      });
    }
  }

  /**
   * Obtém eventos do contrato
   */
  async getContractEventsList(req, res) {
    try {
      const { address } = req.params;
      const contract = await contractService.getContractByAddress(address);
      
      if (!contract.success) {
        return res.status(404).json(contract);
      }

      const events = contract.data.getEvents();
      
      res.status(200).json({
        success: true,
        message: 'Eventos do contrato obtidos com sucesso',
        data: {
          contractAddress: address,
          events: events.map(event => ({
            name: event.name,
            inputs: event.inputs || [],
            type: event.type,
            anonymous: event.anonymous
          })),
          count: events.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter eventos do contrato',
        error: error.message
      });
    }
  }

  /**
   * Valida ABI
   */
  async validateABI(req, res) {
    try {
      const { abi } = req.body;
      
      if (!abi) {
        return res.status(400).json({
          success: false,
          message: 'ABI é obrigatório'
        });
      }

      const isValid = contractService.SmartContract.validateABI(abi);
      
      res.status(200).json({
        success: true,
        message: 'ABI válido',
        data: {
          isValid: true,
          functions: abi.filter(item => item.type === 'function').length,
          events: abi.filter(item => item.type === 'event').length,
          total: abi.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'ABI inválido',
        error: error.message
      });
    }
  }

  /**
   * Concede a role DEFAULT_ADMIN_ROLE a um usuário
   */
  async grantAdminRole(req, res) {
    try {
      const { address } = req.params;
      const { newAdminPublicKey, currentAdminPublicKey } = req.body;
      
      if (!newAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'newAdminPublicKey é obrigatório'
        });
      }

      if (!currentAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'currentAdminPublicKey é obrigatório'
        });
      }

      const result = await contractService.grantAdminRole(address, newAdminPublicKey, currentAdminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role admin',
        error: error.message
      });
    }
  }

  /**
   * Concede a role DEFAULT_ADMIN_ROLE a um usuário (Admin)
   */
  async grantAdminRoleAdmin(req, res) {
    try {
      const { address } = req.params;
      const { newAdminPublicKey } = req.body;
      
      if (!newAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'newAdminPublicKey é obrigatório'
        });
      }

      // Para admin, não precisamos verificar currentAdminPublicKey
      // O admin pode conceder a role diretamente
      const result = await contractService.grantAdminRoleByAdmin(address, newAdminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role admin',
        error: error.message
      });
    }
  }

  /**
   * Atualiza o admin de um token
   */
  async updateTokenAdmin(req, res) {
    try {
      const { address } = req.params;
      const { newAdminPublicKey, currentAdminPublicKey } = req.body;
      
      if (!newAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'newAdminPublicKey é obrigatório'
        });
      }

      if (!currentAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'currentAdminPublicKey é obrigatório'
        });
      }

      const result = await contractService.updateTokenAdmin(address, newAdminPublicKey, currentAdminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar admin do token',
        error: error.message
      });
    }
  }

  /**
   * Verifica se um usuário tem a role DEFAULT_ADMIN_ROLE em um token
   */
  async verifyTokenAdmin(req, res) {
    try {
      const { address } = req.params;
      const { adminPublicKey } = req.body;
      
      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      const isAdmin = await contractService.verifyTokenAdmin(address, adminPublicKey);
      res.status(200).json({
        success: true,
        message: 'Verificação de admin realizada com sucesso',
        data: {
          contractAddress: address,
          adminPublicKey,
          isAdmin,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao verificar admin do token',
        error: error.message
      });
    }
  }



  /**
   * Testa o serviço de contratos
   */
  async testService(req, res) {
    try {
      const result = await contractService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no teste do serviço',
        error: error.message
      });
    }
  }





  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(req, res) {
    try {
      const { address } = req.params;
      const { targetAddress, role } = req.body;
      
      if (!targetAddress || !role) {
        return res.status(400).json({
          success: false,
          message: 'targetAddress e role são obrigatórios'
        });
      }

      const result = await contractService.revokeRole(address, targetAddress, role);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao revogar role',
        error: error.message
      });
    }
  }



  /**
   * Concede uma role a um endereço
   */
  async grantRole(req, res) {
    try {
      const { address } = req.params;
      const { role, targetAddress, adminPublicKey } = req.body;
      
      if (!role || !targetAddress || !adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'role, targetAddress e adminPublicKey são obrigatórios'
        });
      }

      const result = await contractService.grantRole(address, role, targetAddress, adminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role',
        error: error.message
      });
    }
  }

  /**
   * Verifica se um endereço tem determinada role
   */
  async hasRole(req, res) {
    try {
      const { address } = req.params;
      const { role, targetAddress } = req.body;
      
      if (!role || !targetAddress) {
        return res.status(400).json({
          success: false,
          message: 'role e targetAddress são obrigatórios'
        });
      }

      const result = await contractService.hasRole(address, role, targetAddress);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao verificar role',
        error: error.message
      });
    }
  }

  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(req, res) {
    try {
      const { address } = req.params;
      const { role, targetAddress, adminPublicKey } = req.body;
      
      if (!role || !targetAddress || !adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'role, targetAddress e adminPublicKey são obrigatórios'
        });
      }

      const result = await contractService.revokeRole(address, role, targetAddress, adminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao revogar role',
        error: error.message
      });
    }
  }
}

module.exports = new ContractController(); 