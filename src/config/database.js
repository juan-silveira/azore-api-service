const { Sequelize } = require('sequelize');

class DatabaseConfig {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
  }

  /**
   * Inicializa a conexão com o banco de dados
   * @returns {Promise<Sequelize>} Instância do Sequelize
   */
  async initialize() {
    try {
      // Configuração do banco de dados
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'azore_blockchain_service',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: parseInt(process.env.DB_POOL_MAX) || 20,
          min: parseInt(process.env.DB_POOL_MIN) || 5,
          acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
          idle: parseInt(process.env.DB_POOL_IDLE) || 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: false
        }
      };

      // Criar instância do Sequelize
      this.sequelize = new Sequelize(config);

      // Testar conexão
      await this.sequelize.authenticate();
      this.isConnected = true;

      console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
      
      return this.sequelize;
    } catch (error) {
      console.error('❌ Erro ao conectar com o banco de dados:', error.message);
      throw error;
    }
  }

  /**
   * Obtém a instância do Sequelize
   * @returns {Sequelize} Instância do Sequelize
   */
  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
    }
    return this.sequelize;
  }

  /**
   * Testa a conexão com o banco de dados
   * @returns {Promise<Object>} Status da conexão
   */
  async testConnection() {
    try {
      if (!this.sequelize) {
        await this.initialize();
      }

      await this.sequelize.authenticate();
      
      return {
        success: true,
        message: 'Conexão com o banco de dados estabelecida',
        database: process.env.DB_NAME || 'azore_blockchain_service',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha na conexão com o banco de dados',
        error: error.message
      };
    }
  }

  /**
   * Sincroniza os modelos com o banco de dados
   * @param {boolean} force - Força a recriação das tabelas
   * @returns {Promise<void>}
   */
  async sync(force = false) {
    try {
      if (!this.sequelize) {
        await this.initialize();
      }

      await this.sequelize.sync({ force });
      console.log(`✅ Banco de dados sincronizado${force ? ' (forçado)' : ''}`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar banco de dados:', error.message);
      throw error;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        this.isConnected = false;
        console.log('✅ Conexão com o banco de dados fechada');
      }
    } catch (error) {
      console.error('❌ Erro ao fechar conexão com o banco de dados:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se a conexão está ativa
   * @returns {boolean} True se conectado
   */
  isConnected() {
    return this.isConnected;
  }
}

module.exports = new DatabaseConfig(); 