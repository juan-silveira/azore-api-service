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
      const { txHash } = req.params;
      const { network } = req.query;

      if (!txHash) {
        return res.status(400).json({
          success: false,
          message: 'Hash da transação é obrigatório'
        });
      }

      const transaction = await blockchainService.getTransaction(txHash, network);
      
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
   * Testa o endereço de exemplo configurado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async testExampleAddress(req, res) {
    try {
      const testAddress = process.env.TEST_ADDRESS;
      
      if (!testAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de teste não configurado no .env'
        });
      }

      const balance = await blockchainService.getBalance(testAddress);
      
      res.json({
        success: true,
        message: 'Teste do endereço de exemplo realizado com sucesso',
        data: {
          testAddress,
          balance
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao testar endereço de exemplo',
        error: error.message
      });
    }
  }
}

module.exports = new TestController(); 