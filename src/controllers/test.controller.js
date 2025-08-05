const blockchainService = require('../services/blockchain.service');

class TestController {
  /**
   * Testa a conexão com a blockchain
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async testConnection(req, res) {
    try {
      const { network } = req.query;
      const result = await blockchainService.testConnection(network);

      if (result.success) {
        res.json({
          success: true,
          message: 'Conexão com a blockchain estabelecida com sucesso',
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Falha na conexão com a blockchain',
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

  /**
   * Obtém informações da rede atual
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getNetworkInfo(req, res) {
    try {
      const networkInfo = blockchainService.getNetworkInfo();
      
      res.json({
        success: true,
        message: 'Informações da rede obtidas com sucesso',
        data: networkInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter informações da rede',
        error: error.message
      });
    }
  }

  /**
   * Consulta o saldo de um endereço
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getBalance(req, res) {
    try {
      const { address } = req.params;
      const { network } = req.query;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço é obrigatório'
        });
      }

      const balance = await blockchainService.getBalance(address, network);
      
      res.json({
        success: true,
        message: 'Saldo consultado com sucesso',
        data: balance
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao consultar saldo',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações de um bloco
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getBlock(req, res) {
    try {
      const { blockNumber = 'latest' } = req.params;
      const { network } = req.query;

      const block = await blockchainService.getBlock(blockNumber, network);
      
      res.json({
        success: true,
        message: 'Informações do bloco obtidas com sucesso',
        data: block
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações do bloco',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações de uma transação
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getTransaction(req, res) {
    try {
      const { transactionHash } = req.params;
      const { network } = req.query;

      if (!transactionHash) {
        return res.status(400).json({
          success: false,
          message: 'Hash da transação é obrigatório'
        });
      }

      const transaction = await blockchainService.getTransaction(transactionHash, network);
      
      res.json({
        success: true,
        message: 'Informações da transação obtidas com sucesso',
        data: transaction
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações da transação',
        error: error.message
      });
    }
  }

  /**
   * Obtém o preço atual do gás
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getGasPrice(req, res) {
    try {
      const { network } = req.query;
      const gasPrice = await blockchainService.getGasPrice(network);
      
      res.json({
        success: true,
        message: 'Preço do gás obtido com sucesso',
        data: gasPrice
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter preço do gás',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações da rede
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getNetwork(req, res) {
    try {
      const { network } = req.query;
      const networkInfo = await blockchainService.getNetwork(network);
      
      res.json({
        success: true,
        message: 'Informações da rede obtidas com sucesso',
        data: networkInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter informações da rede',
        error: error.message
      });
    }
  }

  /**
   * Obtém o bloco mais recente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getLatestBlock(req, res) {
    try {
      const { network } = req.query;
      const block = await blockchainService.getBlock('latest', network);
      
      res.json({
        success: true,
        message: 'Informações do bloco mais recente obtidas com sucesso',
        data: block
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter informações do bloco mais recente',
        error: error.message
      });
    }
  }

  /**
   * Consulta o saldo de uma carteira
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getWalletBalance(req, res) {
    try {
      const { walletAddress } = req.params;
      const { network } = req.query;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço da carteira é obrigatório'
        });
      }

      const balance = await blockchainService.getBalance(walletAddress, network);
      
      res.json({
        success: true,
        message: 'Saldo da carteira consultado com sucesso',
        data: balance
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao consultar saldo da carteira',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações detalhadas de uma transação usando AzoreScan
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getTransactionDetails(req, res) {
    try {
      const { transactionHash } = req.params;
      const { network } = req.query;

      if (!transactionHash) {
        return res.status(400).json({
          success: false,
          message: 'Hash da transação é obrigatório'
        });
      }

      const transaction = await blockchainService.getTransactionDetails(transactionHash, network);
      
      res.json({
        success: true,
        message: 'Informações detalhadas da transação obtidas com sucesso',
        data: transaction
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações detalhadas da transação',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações detalhadas de um bloco usando AzoreScan
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getBlockDetails(req, res) {
    try {
      const { blockNumber } = req.params;
      const { network } = req.query;

      if (!blockNumber) {
        return res.status(400).json({
          success: false,
          message: 'Número do bloco é obrigatório'
        });
      }

      const block = await blockchainService.getBlockDetails(blockNumber, network);
      
      res.json({
        success: true,
        message: 'Informações detalhadas do bloco obtidas com sucesso',
        data: block
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações detalhadas do bloco',
        error: error.message
      });
    }
  }

  /**
   * Obtém saldos de múltiplos endereços
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMultipleBalances(req, res) {
    try {
      const { addresses } = req.body;
      const { network } = req.query;

      if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de endereços é obrigatória'
        });
      }

      if (addresses.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Máximo de 20 endereços por consulta'
        });
      }

      const balances = await blockchainService.getMultipleBalances(addresses, network);
      
      res.json({
        success: true,
        message: 'Saldos consultados com sucesso',
        data: balances
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao consultar saldos múltiplos',
        error: error.message
      });
    }
  }

  /**
   * Teste simples de webhook
   */
  async testWebhook(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL é obrigatória'
        });
      }

      // Dados de teste
      const webhookData = {
        event: 'test.event',
        timestamp: new Date().toISOString(),
        message: 'Teste de webhook da API Azore',
        testId: Date.now()
      };

      console.log(`🌐 Testando webhook para: ${url}`);
      console.log(`📦 Dados:`, JSON.stringify(webhookData, null, 2));

      res.json({
        success: true,
        message: 'Teste de webhook configurado',
        data: {
          url,
          webhookData,
          note: 'Este é um teste simulado. Em produção, o webhook seria enviado para a URL.'
        }
      });

    } catch (error) {
      console.error('❌ Erro no teste de webhook:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Erro no teste de webhook',
        error: error.message
      });
    }
  }
}

module.exports = new TestController(); 