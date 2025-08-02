const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const encryptionService = require('./encryption.service');
const userService = require('./user.service');
const databaseConfig = require('../config/database');

class WalletService {
  constructor() {
    this.Wallet = null;
    this.sequelize = null;
  }

  /**
   * Inicializa o serviço de carteiras
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Inicializar banco de dados
      this.sequelize = await databaseConfig.initialize();
      
      // Importar modelo Wallet
      const WalletModel = require('../models/Wallet');
      this.Wallet = WalletModel(this.sequelize);
      
      // Não sincronizar - usar apenas o arquivo de inicialização SQL
      
      console.log('✅ Serviço de carteiras inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de carteiras:', error.message);
      throw error;
    }
  }

  /**
   * Cria uma nova carteira
   * @param {Object} options - Opções para criação da carteira
   * @param {string} options.externalSystemId - ID do usuário no sistema externo
   * @param {string} options.clientId - ID do cliente (opcional)
   * @param {Object} options.metadata - Metadados adicionais (opcional)
   * @returns {Promise<Object>} Carteira criada
   */
  async createWallet(options = {}) {
    try {
      const { externalSystemId, clientId, metadata } = options;

      // Gerar nova carteira usando ethers
      const wallet = ethers.Wallet.createRandom();
      
      // Criptografar chave privada
      const encryptedPrivateKey = encryptionService.encryptPrivateKey(wallet.privateKey);
      
      // Preparar dados da carteira
      const walletData = {
        publicAddress: wallet.address,
        encryptedPrivateKey,
        externalSystemId,
        clientId,
        metadata: metadata || {},
        isActive: true
      };

      // Salvar no banco de dados
      const savedWallet = await this.Wallet.create(walletData);
      
      // Retornar dados da carteira (sem chave privada)
      return {
        id: savedWallet.id,
        publicAddress: savedWallet.publicAddress,
        externalSystemId: savedWallet.externalSystemId,
        clientId: savedWallet.clientId,
        isActive: savedWallet.isActive,
        createdAt: savedWallet.createdAt,
        updatedAt: savedWallet.updatedAt,
        metadata: savedWallet.metadata
      };
    } catch (error) {
      throw new Error(`Erro ao criar carteira: ${error.message}`);
    }
  }

  /**
   * Busca uma carteira por ID
   * @param {string} id - ID da carteira
   * @returns {Promise<Object|null>} Carteira encontrada
   */
  async getWalletById(id) {
    try {
      const wallet = await this.Wallet.findByPk(id);
      
      if (!wallet) {
        return null;
      }

      // Atualizar último uso
      await this.Wallet.updateLastUsed(wallet.publicAddress);
      
      return wallet.toJSON();
    } catch (error) {
      throw new Error(`Erro ao buscar carteira por ID: ${error.message}`);
    }
  }

  /**
   * Busca uma carteira por endereço
   * @param {string} address - Endereço da carteira
   * @returns {Promise<Object|null>} Carteira encontrada
   */
  async getWalletByAddress(address) {
    try {
      if (!this.Wallet.validateAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const wallet = await this.Wallet.findByAddress(address);
      
      if (!wallet) {
        return null;
      }

      // Atualizar último uso
      await this.Wallet.updateLastUsed(address);
      
      return wallet.toJSON();
    } catch (error) {
      throw new Error(`Erro ao buscar carteira: ${error.message}`);
    }
  }

  /**
   * Busca carteiras por ID do sistema externo
   * @param {string} externalSystemId - ID do usuário no sistema externo
   * @returns {Promise<Array>} Lista de carteiras
   */
  async getWalletsByExternalId(externalSystemId) {
    try {
      if (!externalSystemId) {
        throw new Error('ID do sistema externo é obrigatório');
      }

      const wallets = await this.Wallet.findByExternalId(externalSystemId);
      return wallets.map(wallet => wallet.toJSON());
    } catch (error) {
      throw new Error(`Erro ao buscar carteiras: ${error.message}`);
    }
  }

  /**
   * Lista todas as carteiras com paginação
   * @param {Object} options - Opções de paginação
   * @param {number} options.page - Página atual
   * @param {number} options.limit - Limite por página
   * @param {boolean} options.isActive - Filtrar por status ativo
   * @returns {Promise<Object>} Lista paginada de carteiras
   */
  async listWallets(options = {}) {
    try {
      const { page = 1, limit = 10, isActive = true } = options;
      const offset = (page - 1) * limit;

      const where = {};
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const { count, rows } = await this.Wallet.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        wallets: rows.map(wallet => wallet.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar carteiras: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de uma carteira
   * @param {string} address - Endereço da carteira
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Saldo da carteira
   */
  async getWalletBalance(address, network) {
    try {
      // Verificar se a carteira existe no banco
      const wallet = await this.getWalletByAddress(address);
      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      // Obter saldo da blockchain
      const balance = await blockchainService.getBalance(address, network);
      
      return {
        ...balance,
        wallet: wallet
      };
    } catch (error) {
      throw new Error(`Erro ao obter saldo da carteira: ${error.message}`);
    }
  }

  /**
   * Transfere AZE nativo entre carteiras
   * @param {string} fromAddress - Endereço de origem
   * @param {string} toAddress - Endereço de destino
   * @param {string} amount - Quantidade em AZE
   * @param {string} network - Rede (mainnet/testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da transferência
   */
  async transferAZE(fromAddress, toAddress, amount, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Obter usuário pela publicKey para pegar a privateKey
      const user = await userService.getUserByPublicKey(fromAddress, true);
      if (!user.success) {
        throw new Error('Usuário não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(network);
      const signer = new ethers.Wallet(user.data.privateKey, provider);

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Preparar transação
      const txOptions = {
        to: toAddress,
        value: amountWei,
        gasLimit: options.gasLimit || 21000,
        ...options
      };

      // Enviar transação
      const tx = await signer.sendTransaction(txOptions);
      
      // Aguardar confirmação
      const receipt = await tx.wait();

      // Atualizar lastActivityAt do usuário
      await userService.updateUser(user.data.id, {
        lastActivityAt: new Date()
      });

      return {
        success: true,
        message: 'Transferência AZE executada com sucesso',
        data: {
          fromAddress: fromAddress.toLowerCase(),
          toAddress: toAddress.toLowerCase(),
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          network: network,
          timestamp: new Date().toISOString(),
          receipt: {
            blockNumber: receipt.blockNumber,
            status: receipt.status
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro na transferência AZE: ${error.message}`);
    }
  }

  /**
   * Descriptografa a chave privada de uma carteira
   * @param {string} address - Endereço da carteira
   * @returns {Promise<string>} Chave privada descriptografada
   */
  async getPrivateKey(address) {
    try {
      if (!this.Wallet.validateAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const wallet = await this.Wallet.findByAddress(address);
      
      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      if (!wallet.isActive) {
        throw new Error('Carteira está inativa');
      }

      // Descriptografar chave privada
      const privateKey = encryptionService.decryptPrivateKey(wallet.encryptedPrivateKey);
      
      return privateKey;
    } catch (error) {
      throw new Error(`Erro ao obter chave privada: ${error.message}`);
    }
  }

  /**
   * Atualiza metadados de uma carteira
   * @param {string} address - Endereço da carteira
   * @param {Object} metadata - Novos metadados
   * @returns {Promise<Object>} Carteira atualizada
   */
  async updateWalletMetadata(address, metadata) {
    try {
      if (!this.Wallet.validateAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const wallet = await this.Wallet.findByAddress(address);
      
      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      // Atualizar metadados
      await wallet.update({ metadata });
      
      return wallet.toJSON();
    } catch (error) {
      throw new Error(`Erro ao atualizar metadados: ${error.message}`);
    }
  }

  /**
   * Desativa uma carteira
   * @param {string} address - Endereço da carteira
   * @returns {Promise<boolean>} True se desativada
   */
  async deactivateWallet(address) {
    try {
      if (!this.Wallet.validateAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const result = await this.Wallet.deactivate(address);
      
      if (result[0] === 0) {
        throw new Error('Carteira não encontrada');
      }

      return true;
    } catch (error) {
      throw new Error(`Erro ao desativar carteira: ${error.message}`);
    }
  }

  /**
   * Reativa uma carteira
   * @param {string} address - Endereço da carteira
   * @returns {Promise<boolean>} True se reativada
   */
  async activateWallet(address) {
    try {
      if (!this.Wallet.validateAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const result = await this.Wallet.activate(address);
      
      if (result[0] === 0) {
        throw new Error('Carteira não encontrada');
      }

      return true;
    } catch (error) {
      throw new Error(`Erro ao reativar carteira: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de carteiras
   * @returns {Promise<Object>} Resultado do teste
   */
  async testService() {
    try {
      // Testar criptografia
      const encryptionTest = encryptionService.testEncryption();
      
      // Testar criação de carteira
      const testWallet = await this.createWallet({
        externalSystemId: 'test-user-123',
        metadata: { test: true }
      });

      // Testar busca por endereço
      const foundWallet = await this.getWalletByAddress(testWallet.publicAddress);
      
      // Testar obtenção de chave privada
      const privateKey = await this.getPrivateKey(testWallet.publicAddress);
      
      // Limpar carteira de teste
      await this.deactivateWallet(testWallet.publicAddress);

      return {
        success: true,
        encryptionTest,
        walletCreated: !!testWallet,
        walletFound: !!foundWallet,
        privateKeyRetrieved: !!privateKey,
        message: 'Serviço de carteiras funcionando corretamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro no teste do serviço de carteiras'
      };
    }
  }
}

module.exports = new WalletService(); 