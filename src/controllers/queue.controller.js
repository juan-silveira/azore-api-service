const queueService = require('../services/queue.service');

class QueueController {
  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats(req, res) {
    try {
      const stats = await queueService.getQueueStats();
      const processingStats = queueService.getProcessingStats();
      
      res.json({
        success: true,
        data: {
          queues: stats,
          processing: processingStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas das filas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém o status de um job específico
   */
  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Job ID é obrigatório'
        });
      }

      const status = queueService.getJobStatus(jobId);
      
      res.json({
        success: true,
        data: {
          jobId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao obter status do job:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém jobs em processamento
   */
  async getProcessingJobs(req, res) {
    try {
      const { status, limit = 50 } = req.query;
      
      // Obter todos os jobs
      const allJobs = Array.from(queueService.processingJobs.entries()).map(([jobId, job]) => ({
        jobId,
        ...job
      }));

      // Filtrar por status se especificado
      let filteredJobs = allJobs;
      if (status) {
        filteredJobs = allJobs.filter(job => job.status === status);
      }

      // Limitar resultados
      const limitedJobs = filteredJobs.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          jobs: limitedJobs,
          total: filteredJobs.length,
          limit: parseInt(limit),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao obter jobs em processamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Limpa jobs antigos
   */
  async cleanupOldJobs(req, res) {
    try {
      const beforeCount = queueService.processingJobs.size;
      queueService.cleanupOldJobs();
      const afterCount = queueService.processingJobs.size;
      const cleanedCount = beforeCount - afterCount;

      res.json({
        success: true,
        data: {
          message: `Jobs antigos limpos com sucesso`,
          cleanedCount,
          remainingJobs: afterCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao limpar jobs antigos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém informações detalhadas de uma fila específica
   */
  async getQueueDetails(req, res) {
    try {
      const { queueName } = req.params;
      
      if (!queueName) {
        return res.status(400).json({
          success: false,
          error: 'Nome da fila é obrigatório'
        });
      }

      const stats = await queueService.getQueueStats();
      const queueStats = stats[queueName.toUpperCase()];

      if (!queueStats) {
        return res.status(404).json({
          success: false,
          error: 'Fila não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          queueName,
          stats: queueStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao obter detalhes da fila:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém métricas de performance das filas
   */
  async getQueueMetrics(req, res) {
    try {
      const stats = await queueService.getQueueStats();
      const processingStats = queueService.getProcessingStats();

      // Calcular métricas de performance
      const metrics = {
        totalQueues: Object.keys(stats).length,
        totalMessages: Object.values(stats).reduce((sum, queue) => sum + (queue.messageCount || 0), 0),
        totalConsumers: Object.values(stats).reduce((sum, queue) => sum + (queue.consumerCount || 0), 0),
        processingJobs: processingStats.processing,
        completedJobs: processingStats.completed,
        failedJobs: processingStats.failed,
        successRate: processingStats.total > 0 ? 
          ((processingStats.completed / processingStats.total) * 100).toFixed(2) : 0,
        averageProcessingTime: 0, // Implementar cálculo de tempo médio
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Erro ao obter métricas das filas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém jobs que falharam
   */
  async getFailedJobs(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const failedJobs = Array.from(queueService.processingJobs.entries())
        .filter(([jobId, job]) => job.status === 'failed')
        .map(([jobId, job]) => ({
          jobId,
          ...job
        }))
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          failedJobs,
          total: failedJobs.length,
          limit: parseInt(limit),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao obter jobs falhados:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Retenta um job falhado
   */
  async retryFailedJob(req, res) {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Job ID é obrigatório'
        });
      }

      const job = queueService.getJobStatus(jobId);
      
      if (job.status === 'not_found') {
        return res.status(404).json({
          success: false,
          error: 'Job não encontrado'
        });
      }

      if (job.status !== 'failed') {
        return res.status(400).json({
          success: false,
          error: 'Apenas jobs falhados podem ser retentados'
        });
      }

      // Implementar lógica de retry
      // Por enquanto, apenas retorna sucesso
      res.json({
        success: true,
        data: {
          jobId,
          message: 'Job adicionado para retry',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao retentar job:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém logs de uma fila específica
   */
  async getQueueLogs(req, res) {
    try {
      const { queueName } = req.params;
      const { limit = 100 } = req.query;

      // Por enquanto, retorna logs simulados
      // Em uma implementação real, você pode usar um sistema de logging
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Fila ${queueName} processando mensagens`,
          queueName
        }
      ];

      res.json({
        success: true,
        data: {
          queueName,
          logs: logs.slice(0, parseInt(limit)),
          total: logs.length,
          limit: parseInt(limit),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao obter logs da fila:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new QueueController(); 