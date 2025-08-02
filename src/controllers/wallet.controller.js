const walletService = require('../services/wallet.service');
const userService = require('../services/user.service');

class WalletController {
  /**
   * Cria uma nova carteira
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async createWallet(req, res) {
    try {
      const { externalSystemId, clientId, metadata, userId } = req.body;

      // Usar userId como externalSystemId se não fornecido
      const finalExternalSystemId = externalSystemId || userId || `wallet-${Date.now()}`;

      const wallet = await walletService.createWallet({
        externalSystemId: finalExternalSystemId,
        clientId: clientId || (req.client ? req.client.id : null),
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Carteira criada com sucesso',
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao criar carteira',
        error: error.message
      });
    }
  }

  /**
   * Busca uma carteira por ID ou endereço
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getWalletByIdOrAddress(req, res) {
    try {
      const { idOrAddress } = req.params;

      if (!idOrAddress) {
        return res.status(400).json({
          success: false,
          message: 'ID ou endereço é obrigatório'
        });
      }

      // Verificar se é um UUID (ID) ou endereço Ethereum
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrAddress);
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(idOrAddress);

      let wallet;
      if (isUuid) {
        wallet = await walletService.getWalletById(idOrAddress);
      } else if (isAddress) {
        wallet = await walletService.getWalletByAddress(idOrAddress);
      } else {
        return res.status(400).json({
          success: false,
          message: 'ID ou endereço inválido'
        });
      }

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Carteira não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Carteira encontrada com sucesso',
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao buscar carteira',
        error: error.message
      });
    }
  }

  /**
   * Busca carteiras por ID do sistema externo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getWalletsByExternalId(req, res) {
    try {
      const { externalSystemId } = req.params;

      if (!externalSystemId) {
        return res.status(400).json({
          success: false,
          message: 'ID do sistema externo é obrigatório'
        });
      }

      const wallets = await walletService.getWalletsByExternalId(externalSystemId);

      res.json({
        success: true,
        message: 'Carteiras encontradas com sucesso',
        data: {
          externalSystemId,
          wallets,
          count: wallets.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao buscar carteiras',
        error: error.message
      });
    }
  }

  /**
   * Lista todas as carteiras com paginação
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async listWallets(req, res) {
    try {
      const { page = 1, limit = 10, isActive } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      // Filtrar por status ativo se especificado
      if (isActive !== undefined) {
        options.isActive = isActive === 'true';
      }

      const result = await walletService.listWallets(options);

      res.json({
        success: true,
        message: 'Carteiras listadas com sucesso',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar carteiras',
        error: error.message
      });
    }
  }

  /**
   * Obtém o saldo de uma carteira
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getWalletBalance(req, res) {
    try {
      const { address } = req.params;
      const { network } = req.query;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço é obrigatório'
        });
      }

      const balance = await walletService.getWalletBalance(address, network);

      res.json({
        success: true,
        message: 'Saldo da carteira obtido com sucesso',
        data: balance
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter saldo da carteira',
        error: error.message
      });
    }
  }

  /**
   * Atualiza metadados de uma carteira
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateWalletMetadata(req, res) {
    try {
      const { address } = req.params;
      const { metadata } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço é obrigatório'
        });
      }

      if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Metadados são obrigatórios e devem ser um objeto'
        });
      }

      const wallet = await walletService.updateWalletMetadata(address, metadata);

      res.json({
        success: true,
        message: 'Metadados da carteira atualizados com sucesso',
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar metadados da carteira',
        error: error.message
      });
    }
  }

  /**
   * Desativa uma carteira
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async deactivateWallet(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço é obrigatório'
        });
      }

      await walletService.deactivateWallet(address);

      res.json({
        success: true,
        message: 'Carteira desativada com sucesso',
        data: { address }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar carteira',
        error: error.message
      });
    }
  }

  /**
   * Reativa uma carteira
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async activateWallet(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço é obrigatório'
        });
      }

      await walletService.activateWallet(address);

      res.json({
        success: true,
        message: 'Carteira reativada com sucesso',
        data: { address }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao reativar carteira',
        error: error.message
      });
    }
  }

  /**
   * Transfere AZE nativo entre carteiras
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async transferAZE(req, res) {
    try {
      const { fromAddress } = req.params;
      const { toAddress, amount, network = 'testnet', options = {} } = req.body;

      if (!fromAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de origem é obrigatório'
        });
      }

      if (!toAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de destino é obrigatório'
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      const result = await walletService.transferAZE(
        fromAddress,
        toAddress,
        amount,
        network,
        options
      );

      res.json({
        success: true,
        message: 'Transferência AZE executada com sucesso',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro na transferência AZE',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de carteiras
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async testService(req, res) {
    try {
      const result = await walletService.testService();

      if (result.success) {
        res.json({
          success: true,
          message: 'Teste do serviço de carteiras realizado com sucesso',
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Falha no teste do serviço de carteiras',
          error: result.error,
          data: result
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }


}

module.exports = new WalletController(); 