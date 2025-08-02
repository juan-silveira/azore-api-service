const transactionService = require('../services/transaction.service');

/**
 * Controller para gerenciamento de transações da blockchain
 */
class TransactionController {
  /**
   * Obtém transações de um cliente
   */
  async getTransactionsByClient(req, res) {
    try {
      const { page = 1, limit = 50, status, network, transactionType, startDate, endDate } = req.query;
      const clientId = req.client?.id;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'ID do cliente não encontrado'
        });
      }

      const result = await transactionService.getTransactionsByClient(clientId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        network,
        transactionType,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        message: 'Transações obtidas com sucesso',
        data: {
          transactions: result.rows.map(tx => tx.getFormattedResponse()),
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(result.count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transações',
        error: error.message
      });
    }
  }

  /**
   * Obtém uma transação específica por hash
   */
  async getTransactionByHash(req, res) {
    try {
      const { txHash } = req.params;

      if (!txHash) {
        return res.status(400).json({
          success: false,
          message: 'Hash da transação é obrigatório'
        });
      }

      const transaction = await transactionService.getTransactionByHash(txHash);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transação obtida com sucesso',
        data: transaction.getFormattedResponse()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transação',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de transações
   */
  async getTransactionStats(req, res) {
    try {
      const { startDate, endDate, network } = req.query;
      const clientId = req.client?.id;

      const stats = await transactionService.getTransactionStats({
        startDate,
        endDate,
        clientId,
        network
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats[0] || {
          totalTransactions: 0,
          confirmedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          totalGasCost: 0,
          avgGasUsed: 0
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas por status
   */
  async getStatusStats(req, res) {
    try {
      const { startDate, endDate, network } = req.query;
      const clientId = req.client?.id;

      const stats = await transactionService.getStatusStats({
        startDate,
        endDate,
        clientId,
        network
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas por status obtidas com sucesso',
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas por status',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas por tipo de transação
   */
  async getTypeStats(req, res) {
    try {
      const { startDate, endDate, network } = req.query;
      const clientId = req.client?.id;

      const stats = await transactionService.getTypeStats({
        startDate,
        endDate,
        clientId,
        network
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas por tipo obtidas com sucesso',
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas por tipo',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de transações
   */
  async testService(req, res) {
    try {
      const result = await transactionService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao testar serviço de transações',
        error: error.message
      });
    }
  }
}

module.exports = new TransactionController(); 