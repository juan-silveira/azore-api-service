/**
 * Serviço para inicialização dos tokens padrão
 * Cria automaticamente os tokens nativos e principais tokens ERC20
 */

const defaultTokens = require('../config/defaultTokens');

class TokenInitializerService {
  constructor() {
    this.SmartContract = null;
  }

  /**
   * Inicializa o serviço
   * @param {Object} SmartContract - Modelo SmartContract
   */
  initialize(SmartContract) {
    this.SmartContract = SmartContract;
  }

  /**
   * Inicializa os tokens padrão no banco de dados
   * @returns {Promise<Object>} Resultado da inicialização
   */
  async initializeDefaultTokens() {
    try {
      if (!this.SmartContract) {
        throw new Error('Modelo SmartContract não inicializado');
      }

      console.log('🔍 Inicializando tokens padrão...');
      
      const results = {
        created: 0,
        skipped: 0,
        errors: 0,
        tokens: []
      };

      for (const tokenData of defaultTokens) {
        try {
          // Verificar se o token já existe (por endereço E rede para evitar conflitos)
          const existingToken = await this.SmartContract.findOne({
            where: {
              address: tokenData.address,
              network: tokenData.network
            }
          });

          if (existingToken) {
            console.log(`⏭️  Token ${tokenData.name} (${tokenData.symbol}) já existe na ${tokenData.network}`);
            results.skipped++;
            results.tokens.push({
              name: tokenData.name,
              symbol: tokenData.symbol,
              network: tokenData.network,
              status: 'skipped',
              address: existingToken.address
            });
            continue;
          }

          // Criar o token
          const newToken = await this.SmartContract.create({
            name: tokenData.name,
            address: tokenData.address,
            abi: tokenData.abi,
            network: tokenData.network,
            contractType: tokenData.contractType,
            version: tokenData.version,
            isVerified: tokenData.isVerified,
            isActive: tokenData.isActive,
            adminPublicKey: tokenData.adminPublicKey,
            metadata: tokenData.metadata,
            deployedAt: new Date()
          });

          console.log(`✅ Token ${tokenData.name} (${tokenData.symbol}) criado na ${tokenData.network}`);
          results.created++;
          results.tokens.push({
            name: tokenData.name,
            symbol: tokenData.symbol,
            network: tokenData.network,
            status: 'created',
            address: newToken.address,
            id: newToken.id
          });

        } catch (error) {
          console.error(`❌ Erro ao criar token ${tokenData.name} (${tokenData.symbol}):`, error.message);
          results.errors++;
          results.tokens.push({
            name: tokenData.name,
            symbol: tokenData.symbol,
            network: tokenData.network,
            status: 'error',
            error: error.message
          });
        }
      }

      console.log(`✅ Tokens padrão inicializados: ${results.created} criados, ${results.skipped} ignorados, ${results.errors} erros`);

      return {
        success: true,
        message: 'Tokens padrão inicializados com sucesso',
        data: results
      };

    } catch (error) {
      console.error('❌ Erro ao inicializar tokens padrão:', error);
      return {
        success: false,
        message: 'Erro ao inicializar tokens padrão',
        error: error.message
      };
    }
  }

  /**
   * Verifica se os tokens padrão existem
   * @returns {Promise<Object>} Status dos tokens
   */
  async checkDefaultTokens() {
    try {
      if (!this.SmartContract) {
        throw new Error('Modelo SmartContract não inicializado');
      }

      const status = {
        total: defaultTokens.length,
        exists: 0,
        missing: 0,
        tokens: []
      };

      for (const tokenData of defaultTokens) {
        const existingToken = await this.SmartContract.findOne({
          where: {
            address: tokenData.address,
            network: tokenData.network
          }
        });

        if (existingToken) {
          status.exists++;
          status.tokens.push({
            name: tokenData.name,
            symbol: tokenData.symbol,
            network: tokenData.network,
            exists: true,
            address: existingToken.address,
            isActive: existingToken.isActive
          });
        } else {
          status.missing++;
          status.tokens.push({
            name: tokenData.name,
            symbol: tokenData.symbol,
            network: tokenData.network,
            exists: false
          });
        }
      }

      return {
        success: true,
        data: status
      };

    } catch (error) {
      console.error('❌ Erro ao verificar tokens padrão:', error);
      return {
        success: false,
        message: 'Erro ao verificar tokens padrão',
        error: error.message
      };
    }
  }

  /**
   * Lista todos os tokens padrão configurados
   * @returns {Promise<Object>} Lista dos tokens
   */
  async listDefaultTokens() {
    try {
      return {
        success: true,
        data: {
          total: defaultTokens.length,
          tokens: defaultTokens.map(token => ({
            name: token.name,
            symbol: token.symbol,
            network: token.network,
            contractType: token.contractType,
            address: token.address,
            isNative: token.metadata?.isNative || false
          }))
        }
      };
    } catch (error) {
      console.error('❌ Erro ao listar tokens padrão:', error);
      return {
        success: false,
        message: 'Erro ao listar tokens padrão',
        error: error.message
      };
    }
  }
}

module.exports = new TokenInitializerService(); 