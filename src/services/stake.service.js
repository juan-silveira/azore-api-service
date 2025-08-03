const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');
const databaseConfig = require('../config/database');

class StakeService {
  constructor() {
    this.Stake = null;
    this.sequelize = null;
  }

  async initialize() {
    try {
      this.sequelize = await databaseConfig.initialize();
      const StakeModel = require('../models/Stake');
      const UserModel = require('../models/User');
      this.Stake = StakeModel(this.sequelize);
      this.User = UserModel(this.sequelize);
      console.log('✅ Serviço de stakes inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de stakes:', error.message);
      throw error;
    }
  }

  /**
   * Registra um novo stake no banco de dados
   */
  async registerStake(stakeData) {
    try {
      const {
        name,
        address,
        abi = [],
        network = 'testnet',
        contractType = 'STAKE',
        adminPublicKey,
        metadata = {}
      } = stakeData;

      // Validar endereço
      if (!ethers.isAddress(address)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Verificar se o stake já existe
      const existingStake = await this.Stake.findByAddress(address);
      if (existingStake) {
        throw new Error('Stake já está registrado');
      }

      // Obter informações do stake na blockchain
      let stakeInfo = {};
      let finalABI = abi;
      
      // Usar STAKE_ABI padrão se não tivermos ABI específico
      if (!abi || abi.length === 0) {
        try {
          const stakeABI = process.env.STAKE_ABI;
          if (stakeABI) {
            finalABI = JSON.parse(stakeABI);
          }
        } catch (error) {
          console.warn(`Erro ao parsear STAKE_ABI: ${error.message}`);
        }
      }
      
      if (finalABI && finalABI.length > 0) {
        try {
          const provider = blockchainService.config.getProvider(network);
          const contractInstance = new ethers.Contract(address, finalABI, provider);
          
          // Obter informações específicas do stake
          const [stakeToken, rewardToken, minValueStake] = await Promise.all([
            contractInstance.stakeToken(),
            contractInstance.rewardToken(),
            contractInstance.minValueStake()
          ]);

          stakeInfo = {
            stakeToken,
            rewardToken,
            minStake: ethers.formatEther(minValueStake)
          };
        } catch (error) {
          console.warn(`Não foi possível obter informações do stake na blockchain: ${error.message}`);
        }
      }

      // Criar stake no banco
      const stake = await this.Stake.create({
        name: stakeInfo.name || name,
        address: address,
        abi: finalABI,
        network,
        contractType,
        adminPublicKey: adminPublicKey ? adminPublicKey : null,
        metadata: {
          ...metadata,
          ...stakeInfo,
          explorer: network === 'mainnet' ? 'https://azorescan.com' : 'https://floripa.azorescan.com'
        },
        isActive: true
      });

      return {
        success: true,
        message: 'Stake registrado com sucesso',
        data: stake
      };
    } catch (error) {
      throw new Error(`Erro ao registrar stake: ${error.message}`);
    }
  }

  /**
   * Obtém informações do stake da blockchain
   */
  async getStakeInfo(address) {
    try {
      const stake = await this.Stake.findByAddress(address);
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(stake.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        address,
        stake.abi,
        provider
      );

      // Obter informações específicas do stake
      const [stakeToken, rewardToken, minValueStake] = await Promise.all([
        contractInstance.stakeToken(),
        contractInstance.rewardToken(),
        contractInstance.minValueStake()
      ]);

      return {
        success: true,
        message: 'Informações do stake obtidas com sucesso',
        data: {
          address,
          stakeToken,
          rewardToken,
          minStake: ethers.formatEther(minValueStake),
          network: stake.network,
          contractType: stake.contractType,
          metadata: stake.metadata,
          adminPublicKey: stake.adminPublicKey
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do stake: ${error.message}`);
    }
  }

  /**
   * Executa uma operação de escrita no contrato de stake
   */
  async writeStakeContract(stakeAddress, functionName, params = [], walletAddress, options = {}) {
    try {
      // Obter stake do banco
      const stake = await this.Stake.findByAddress(stakeAddress);
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter função do ABI
      const abiFunction = stake.getFunction(functionName);
      if (!abiFunction) {
        throw new Error(`Função '${functionName}' não encontrada no ABI`);
      }

      // Verificar se é uma função de escrita
      if (abiFunction.stateMutability === 'view' || abiFunction.stateMutability === 'pure') {
        throw new Error(`Função '${functionName}' não é uma função de escrita`);
      }

      // Buscar usuário
      const user = await this.User.findOne({
        where: {
          publicKey: walletAddress
        }
      });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const privateKey = user.privateKey;
      if (!privateKey) {
        throw new Error('Chave privada não encontrada para o usuário');
      }

      // Obter provider e signer
      const provider = blockchainService.config.getProvider(stake.network);
      const signer = new ethers.Wallet(privateKey, provider);

      // Forçar uso do ABI padrão do .env se for STAKE
      let abiToUse = stake.abi;
      if (stake.contractType === 'STAKE' && process.env.STAKE_ABI) {
        try {
          abiToUse = JSON.parse(process.env.STAKE_ABI);
        } catch (e) {
          console.error('❌ Erro ao fazer parse do STAKE_ABI do .env:', e.message);
        }
      }

      // Criar instância do contrato com signer
      const contractInstance = new ethers.Contract(
        stake.address,
        abiToUse,
        signer
      );

      // Preparar transação
      const txOptions = {
        gasLimit: options.gasLimit || 300000,
        ...options
      };

      // Executar função
      const tx = await contractInstance[functionName](...params);
      
      // Aguardar confirmação
      const receipt = await tx.wait();

      // Atualizar lastActivityAt do usuário
      if (user.updateLastActivity) {
        await user.updateLastActivity();
      }

      return {
        success: true,
        message: 'Operação de escrita executada com sucesso',
        data: {
          stakeAddress: stake.address,
          functionName,
          params,
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          network: stake.network,
          walletAddress,
          timestamp: new Date().toISOString(),
          receipt: {
            blockNumber: receipt.blockNumber,
            confirmations: receipt.confirmations,
            status: receipt.status
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro na operação de escrita: ${error.message}`);
    }
  }

  /**
   * Executa uma operação de leitura no contrato de stake
   */
  async readStakeContract(stakeAddress, functionName, params = [], options = {}) {
    try {
      // Obter stake do banco
      const stake = await this.Stake.findByAddress(stakeAddress);
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter função do ABI
      const abiFunction = stake.getFunction(functionName);
      if (!abiFunction) {
        throw new Error(`Função '${functionName}' não encontrada no ABI`);
      }

      // Verificar se é uma função de leitura
      if (abiFunction.stateMutability === 'payable' || abiFunction.stateMutability === 'nonpayable') {
        throw new Error(`Função '${functionName}' não é uma função de leitura`);
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(stake.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        stake.address,
        stake.abi,
        provider
      );

      // Executar função
      const result = await contractInstance[functionName](...params);

      return {
        success: true,
        message: 'Operação de leitura executada com sucesso',
        data: {
          stakeAddress: stake.address,
          functionName,
          params,
          result: result.toString(),
          network: stake.network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro na operação de leitura: ${error.message}`);
    }
  }

  /**
   * Verifica se um usuário tem a role DEFAULT_ADMIN_ROLE em um stake
   */
  async verifyStakeAdmin(stakeAddress, adminPublicKey) {
    try {
      // Obter stake do banco
      const stake = await this.Stake.findByAddress(stakeAddress);
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(stake.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        stake.address,
        stake.abi,
        provider
      );

      // Verificar se o contrato tem a função hasRole
      if (!contractInstance.hasRole) {
        throw new Error('Contrato não possui sistema de roles');
      }

      // Verificar se o usuário tem a role DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const hasRole = await contractInstance.hasRole(DEFAULT_ADMIN_ROLE, adminPublicKey);

      return hasRole;
    } catch (error) {
      throw new Error(`Erro ao verificar admin do stake: ${error.message}`);
    }
  }

  /**
   * Obtém stake por endereço
   */
  async getStakeByAddress(address) {
    try {
      const stake = await this.Stake.findByAddress(address);
      if (!stake) {
        return {
          success: false,
          message: 'Stake não encontrado'
        };
      }

      return {
        success: true,
        message: 'Stake encontrado com sucesso',
        data: stake
      };
    } catch (error) {
      throw new Error(`Erro ao buscar stake: ${error.message}`);
    }
  }

  /**
   * Lista todos os stakes
   */
  async listStakes(options = {}) {
    try {
      const { page = 1, limit = 10, network, contractType } = options;
      const offset = (page - 1) * limit;

      const whereClause = { isActive: true };
      if (network) whereClause.network = network;
      if (contractType) whereClause.contractType = contractType;

      const { count, rows } = await this.Stake.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        message: 'Stakes listados com sucesso',
        data: {
          stakes: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar stakes: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de stakes
   */
  async testService() {
    try {
      // Teste de validação de ABI
      const testABI = [
        {
          "type": "function",
          "name": "stakeToken",
          "inputs": [],
          "outputs": [{"name": "", "type": "address"}],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "stake",
          "inputs": [
            {"name": "user", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "_customTimestamp", "type": "uint256"}
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        }
      ];

      this.Stake.validateABI(testABI);

      return {
        success: true,
        message: 'Teste do serviço de stakes realizado com sucesso',
        data: {
          abiValidation: true,
          serviceInitialized: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de stakes',
        error: error.message
      };
    }
  }
}

module.exports = new StakeService(); 