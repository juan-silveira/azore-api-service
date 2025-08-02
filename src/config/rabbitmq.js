const amqp = require('amqplib');

class RabbitMQConfig {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 segundos
    
    // Configurações das filas
    this.queues = {
      BLOCKCHAIN_TRANSACTIONS: 'blockchain_transactions',
      BLOCKCHAIN_QUERIES: 'blockchain_queries',
      CONTRACT_OPERATIONS: 'contract_operations',
      WALLET_OPERATIONS: 'wallet_operations'
    };
    
    // Configurações de exchange
    this.exchanges = {
      BLOCKCHAIN_EVENTS: 'blockchain_events'
    };
  }

  /**
   * Obtém a URL de conexão do RabbitMQ
   */
  getConnectionUrl() {
    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = process.env.RABBITMQ_PORT || 5672;
    const user = process.env.RABBITMQ_USER || 'azore';
    const pass = process.env.RABBITMQ_PASS || 'azore123';
    const vhost = process.env.RABBITMQ_VHOST || '/';
    
    return `amqp://${user}:${pass}@${host}:${port}${vhost}`;
  }

  /**
   * Conecta ao RabbitMQ
   */
  async connect() {
    try {
      if (this.isConnected) {
        return this.connection;
      }

      console.log('Conectando ao RabbitMQ...');
      const url = this.getConnectionUrl();
      this.connection = await amqp.connect(url);
      
      this.connection.on('error', (error) => {
        console.error('Erro na conexão RabbitMQ:', error);
        this.isConnected = false;
        this.handleReconnect();
      });

      this.connection.on('close', () => {
        console.log('Conexão RabbitMQ fechada');
        this.isConnected = false;
        this.handleReconnect();
      });

      this.channel = await this.connection.createChannel();
      await this.setupQueues();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Conectado ao RabbitMQ com sucesso');
      
      return this.connection;
    } catch (error) {
      console.error('Erro ao conectar ao RabbitMQ:', error);
      this.handleReconnect();
      throw error;
    }
  }

  /**
   * Configura as filas e exchanges
   */
  async setupQueues() {
    try {
      // Criar exchange para eventos
      await this.channel.assertExchange(
        this.exchanges.BLOCKCHAIN_EVENTS,
        'topic',
        { durable: true }
      );

      // Criar filas principais
      for (const [name, queueName] of Object.entries(this.queues)) {
        await this.channel.assertQueue(queueName, {
          durable: true,
          arguments: {
            'x-message-ttl': 300000, // 5 minutos TTL
            'x-max-priority': 10, // Prioridade máxima
            'x-dead-letter-exchange': `${queueName}_dlx`,
            'x-dead-letter-routing-key': 'failed'
          }
        });

        // Criar fila de dead letter para cada fila principal
        await this.channel.assertQueue(`${queueName}_dlx`, {
          durable: true
        });

        // Criar fila de retry para cada fila principal
        await this.channel.assertQueue(`${queueName}_retry`, {
          durable: true,
          arguments: {
            'x-message-ttl': 60000, // 1 minuto TTL
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': queueName
          }
        });

        console.log(`Fila ${queueName} configurada`);
      }

      // Configurar bindings
      await this.channel.bindQueue(
        this.queues.BLOCKCHAIN_TRANSACTIONS,
        this.exchanges.BLOCKCHAIN_EVENTS,
        'transaction.*'
      );

      await this.channel.bindQueue(
        this.queues.BLOCKCHAIN_QUERIES,
        this.exchanges.BLOCKCHAIN_EVENTS,
        'query.*'
      );

      await this.channel.bindQueue(
        this.queues.CONTRACT_OPERATIONS,
        this.exchanges.BLOCKCHAIN_EVENTS,
        'contract.*'
      );

      await this.channel.bindQueue(
        this.queues.WALLET_OPERATIONS,
        this.exchanges.BLOCKCHAIN_EVENTS,
        'wallet.*'
      );

    } catch (error) {
      console.error('Erro ao configurar filas:', error);
      throw error;
    }
  }

  /**
   * Gerencia reconexão automática
   */
  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Número máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Falha na reconexão:', error);
      }
    }, this.reconnectDelay);
  }

  /**
   * Obtém o canal atual
   */
  async getChannel() {
    if (!this.isConnected || !this.channel) {
      await this.connect();
    }
    return this.channel;
  }

  /**
   * Publica uma mensagem em uma fila
   */
  async publishToQueue(queueName, message, options = {}) {
    try {
      const channel = await this.getChannel();
      const defaultOptions = {
        persistent: true,
        priority: 5,
        timestamp: Date.now(),
        ...options
      };

      const result = await channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(message)),
        defaultOptions
      );

      console.log(`Mensagem publicada na fila ${queueName}:`, message.id || 'sem ID');
      return result;
    } catch (error) {
      console.error(`Erro ao publicar na fila ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Publica uma mensagem em um exchange
   */
  async publishToExchange(exchangeName, routingKey, message, options = {}) {
    try {
      const channel = await this.getChannel();
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now(),
        ...options
      };

      const result = await channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        defaultOptions
      );

      console.log(`Mensagem publicada no exchange ${exchangeName} com routing key ${routingKey}`);
      return result;
    } catch (error) {
      console.error(`Erro ao publicar no exchange ${exchangeName}:`, error);
      throw error;
    }
  }

  /**
   * Consome mensagens de uma fila
   */
  async consumeQueue(queueName, callback, options = {}) {
    try {
      const channel = await this.getChannel();
      const defaultOptions = {
        noAck: false,
        ...options
      };

      const result = await channel.consume(queueName, callback, defaultOptions);
      console.log(`Consumidor iniciado para a fila ${queueName}`);
      return result;
    } catch (error) {
      console.error(`Erro ao consumir fila ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats(queueName) {
    try {
      const channel = await this.getChannel();
      const queueInfo = await channel.checkQueue(queueName);
      return {
        queue: queueName,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erro ao obter estatísticas da fila ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Fecha a conexão
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('Conexão RabbitMQ fechada');
    } catch (error) {
      console.error('Erro ao fechar conexão RabbitMQ:', error);
    }
  }
}

// Singleton instance
const rabbitMQConfig = new RabbitMQConfig();

module.exports = rabbitMQConfig; 