const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Inicializa a conexão com o Redis
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          family: 4, // Forçar IPv4
          connectTimeout: 10000,
          lazyConnect: true
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: process.env.REDIS_DB || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('❌ Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('❌ Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('❌ Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log('✅ Redis service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Redis service:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Adiciona um token à blacklist
   */
  async addToBlacklist(token, expiresIn = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping blacklist operation');
        return false;
      }

      const key = `blacklist:${token}`;
      await this.client.setEx(key, expiresIn, 'blacklisted');
      console.log(`✅ Token added to blacklist: ${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Error adding token to blacklist:', error.message);
      return false;
    }
  }

  /**
   * Verifica se um token está na blacklist
   */
  async isBlacklisted(token) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, assuming token is not blacklisted');
        return false;
      }

      const key = `blacklist:${token}`;
      const result = await this.client.get(key);
      return result === 'blacklisted';
    } catch (error) {
      console.error('❌ Error checking blacklist:', error.message);
      return false;
    }
  }

  /**
   * Remove um token da blacklist
   */
  async removeFromBlacklist(token) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping blacklist removal');
        return false;
      }

      const key = `blacklist:${token}`;
      await this.client.del(key);
      console.log(`✅ Token removed from blacklist: ${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Error removing token from blacklist:', error.message);
      return false;
    }
  }

  /**
   * Limpa todos os tokens expirados da blacklist
   */
  async cleanupExpiredTokens() {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping cleanup');
        return 0;
      }

      const pattern = 'blacklist:*';
      const keys = await this.client.keys(pattern);
      let removedCount = 0;

      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl <= 0) {
          await this.client.del(key);
          removedCount++;
        }
      }

      console.log(`✅ Cleaned up ${removedCount} expired tokens from blacklist`);
      return removedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error.message);
      return 0;
    }
  }

  /**
   * Obtém estatísticas da blacklist
   */
  async getBlacklistStats() {
    try {
      if (!this.isConnected || !this.client) {
        return {
          totalTokens: 0,
          isConnected: false
        };
      }

      const pattern = 'blacklist:*';
      const keys = await this.client.keys(pattern);
      
      const stats = {
        totalTokens: keys.length,
        isConnected: true,
        tokens: []
      };

      // Obter informações detalhadas dos primeiros 10 tokens
      for (let i = 0; i < Math.min(keys.length, 10); i++) {
        const key = keys[i];
        const ttl = await this.client.ttl(key);
        stats.tokens.push({
          token: key.replace('blacklist:', '').substring(0, 20) + '...',
          expiresIn: ttl > 0 ? ttl : 'expired'
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting blacklist stats:', error.message);
      return {
        totalTokens: 0,
        isConnected: false,
        error: error.message
      };
    }
  }

  /**
   * Testa a conexão com o Redis
   */
  async testConnection() {
    try {
      if (!this.isConnected || !this.client) {
        return {
          success: false,
          message: 'Redis not connected',
          isConnected: false
        };
      }

      const result = await this.client.ping();
      return {
        success: result === 'PONG',
        message: result === 'PONG' ? 'Redis connection successful' : 'Redis connection failed',
        isConnected: this.isConnected
      };
    } catch (error) {
      return {
        success: false,
        message: `Redis connection error: ${error.message}`,
        isConnected: this.isConnected
      };
    }
  }

  /**
   * Fecha a conexão com o Redis
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('✅ Redis connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
}

// Exportar uma instância singleton
module.exports = new RedisService(); 