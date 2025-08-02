const contractService = require('../services/contract.service');

/**
 * Controller para gerenciamento de contratos inteligentes
 */
class ContractController {
  /**
   * Registra um novo contrato
   */
  async registerContract(req, res) {
    try {
      const contractData = req.body;
      const result = await contractService.registerContract(contractData);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao registrar contrato',
        error: error.message
      });
    }
  }

  /**
   * Obtém um contrato por endereço
   */
  async getContractByAddress(req, res) {
    try {
      const { address } = req.params;
      const result = await contractService.getContractByAddress(address);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter contrato',
        error: error.message
      });
    }
  }

  /**
   * Lista contratos com paginação
   */
  async listContracts(req, res) {
    try {
      const { page, limit, network, contractType } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        network,
        contractType
      };
      
      const result = await contractService.listContracts(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar contratos',
        error: error.message
      });
    }
  }

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
   * Atualiza metadados do contrato
   */
  async updateContractMetadata(req, res) {
    try {
      const { address } = req.params;
      const { metadata } = req.body;
      
      if (!metadata) {
        return res.status(400).json({
          success: false,
          message: 'Metadados são obrigatórios'
        });
      }

      const result = await contractService.updateContractMetadata(address, metadata);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar metadados',
        error: error.message
      });
    }
  }

  /**
   * Desativa um contrato
   */
  async deactivateContract(req, res) {
    try {
      const { address } = req.params;
      const result = await contractService.deactivateContract(address);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar contrato',
        error: error.message
      });
    }
  }

  /**
   * Reativa um contrato
   */
  async activateContract(req, res) {
    try {
      const { address } = req.params;
      const result = await contractService.activateContract(address);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao reativar contrato',
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
   * Concede a role MINTER_ROLE a um usuário
   */
  async grantMinterRole(req, res) {
    try {
      const { address } = req.params;
      const { newMinterPublicKey, currentAdminPublicKey } = req.body;
      
      if (!newMinterPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'newMinterPublicKey é obrigatório'
        });
      }

      if (!currentAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'currentAdminPublicKey é obrigatório'
        });
      }

      const result = await contractService.grantMinterRole(address, newMinterPublicKey, currentAdminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role minter',
        error: error.message
      });
    }
  }

  /**
   * Concede a role BURNER_ROLE a um usuário
   */
  async grantBurnerRole(req, res) {
    try {
      const { address } = req.params;
      const { newBurnerPublicKey, currentAdminPublicKey } = req.body;
      
      if (!newBurnerPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'newBurnerPublicKey é obrigatório'
        });
      }

      if (!currentAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'currentAdminPublicKey é obrigatório'
        });
      }

      const result = await contractService.grantBurnerRole(address, newBurnerPublicKey, currentAdminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role burner',
        error: error.message
      });
    }
  }

  /**
   * Concede a role TRANSFER_ROLE a um usuário
   */
  async grantTransferRole(req, res) {
    try {
      const { address } = req.params;
      const { newTransferPublicKey, currentAdminPublicKey } = req.body;
      
      if (!newTransferPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'newTransferPublicKey é obrigatório'
        });
      }

      if (!currentAdminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'currentAdminPublicKey é obrigatório'
        });
      }

      const result = await contractService.grantTransferRole(address, newTransferPublicKey, currentAdminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role transfer',
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
   * Lista os tokens padrão configurados
   */
  async listDefaultTokens(req, res) {
    try {
      const tokenInitializerService = require('../services/tokenInitializer.service');
      const result = await tokenInitializerService.listDefaultTokens();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar tokens padrão',
        error: error.message
      });
    }
  }

  /**
   * Atualiza metadados do token
   */
  async updateTokenMetadata(req, res) {
    try {
      const { address } = req.params;
      const { description, website, explorer } = req.body;
      
      const result = await contractService.updateTokenMetadata(address, {
        description,
        website,
        explorer
      });
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar metadados do token',
        error: error.message
      });
    }
  }

  /**
   * Concede role de admin para um token
   */
  async grantTokenAdminRole(req, res) {
    try {
      const { address } = req.params;
      const { adminPublicKey } = req.body;
      
      if (!adminPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey é obrigatório'
        });
      }

      const result = await contractService.grantTokenAdminRole(address, adminPublicKey);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao conceder role de admin',
        error: error.message
      });
    }
  }

  /**
   * Verifica se um endereço tem determinada role
   */
  async checkRole(req, res) {
    try {
      const { address } = req.params;
      const { targetAddress, role } = req.body;
      
      if (!targetAddress || !role) {
        return res.status(400).json({
          success: false,
          message: 'targetAddress e role são obrigatórios'
        });
      }

      const result = await contractService.checkRole(address, targetAddress, role);
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
   * Obtém informações do token da blockchain
   */
  async getTokenInfo(req, res) {
    try {
      const { address } = req.params;
      const result = await contractService.getTokenInfo(address);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações do token',
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
      const { role, targetAddress, walletAddress } = req.body;
      
      if (!role || !targetAddress || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'role, targetAddress e walletAddress são obrigatórios'
        });
      }

      const result = await contractService.grantRole(address, role, targetAddress, walletAddress);
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
      const { role, targetAddress, walletAddress } = req.body;
      
      if (!role || !targetAddress || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'role, targetAddress e walletAddress são obrigatórios'
        });
      }

      const result = await contractService.revokeRole(address, role, targetAddress, walletAddress);
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