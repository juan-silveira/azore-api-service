const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const walletService = require('./wallet.service');
const userService = require('./user.service');
const databaseConfig = require('../config/database');

class ContractService {
  constructor() {
    this.SmartContract = null;
    this.sequelize = null;
  }

  async initialize() {
    try {
      this.sequelize = await databaseConfig.initialize();
      const SmartContractModel = require('../models/SmartContract');
      this.SmartContract = SmartContractModel(this.sequelize);
      // Não sincronizar - usar apenas o arquivo de inicialização SQL
      console.log('✅ Serviço de contratos inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de contratos:', error.message);
      throw error;
    }
  }

  /**
   * Registra um novo contrato inteligente
   */
  async registerContract(contractData) {
    try {
      // Validar ABI
      this.SmartContract.validateABI(contractData.abi);

      // Normalizar endereço
      contractData.address = contractData.address.toLowerCase();

      // Verificar se o contrato já existe
      const existingContract = await this.SmartContract.findByAddress(contractData.address);
      if (existingContract) {
        throw new Error('Contrato já registrado com este endereço');
      }

      // Verificar se adminPublicKey foi fornecido
      if (!contractData.adminPublicKey) {
        throw new Error('adminPublicKey é obrigatório para registrar um token');
      }

      // Nota: A verificação de role será feita quando necessário, não no registro
      // O adminPublicKey é armazenado como referência para operações futuras

      // Criar contrato
      const contract = await this.SmartContract.create(contractData);
      
      return {
        success: true,
        message: 'Contrato registrado com sucesso',
        data: contract
      };
    } catch (error) {
      throw new Error(`Erro ao registrar contrato: ${error.message}`);
    }
  }

  /**
   * Obtém um contrato por endereço
   */
  async getContractByAddress(address) {
    try {
      const contract = await this.SmartContract.findByAddress(address);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      return {
        success: true,
        message: 'Contrato encontrado com sucesso',
        data: contract
      };
    } catch (error) {
      throw new Error(`Erro ao obter contrato: ${error.message}`);
    }
  }

  /**
   * Lista contratos com paginação
   */
  async listContracts(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        network,
        contractType,
        isActive = true
      } = options;

      const offset = (page - 1) * limit;
      const where = { isActive };

      if (network) where.network = network;
      if (contractType) where.contractType = contractType;

      const { count, rows } = await this.SmartContract.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        message: 'Contratos listados com sucesso',
        data: {
          contracts: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar contratos: ${error.message}`);
    }
  }

  /**
   * Executa uma operação de leitura no contrato
   */
  async readContract(contractAddress, functionName, params = [], options = {}) {
    try {
      // Obter contrato do banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Obter função do ABI
      const abiFunction = contract.getFunction(functionName);
      if (!abiFunction) {
        throw new Error(`Função '${functionName}' não encontrada no ABI`);
      }

      // Verificar se é uma função de leitura
      if (abiFunction.stateMutability === 'payable' || abiFunction.stateMutability === 'nonpayable') {
        throw new Error(`Função '${functionName}' não é uma função de leitura`);
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        provider
      );

      // Executar função
      const result = await contractInstance[functionName](...params);

      return {
        success: true,
        message: 'Operação de leitura executada com sucesso',
        data: {
          contractAddress: contract.address,
          functionName,
          params,
          result: result.toString(),
          network: contract.network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro na operação de leitura: ${error.message}`);
    }
  }

  /**
   * Executa uma operação de escrita no contrato
   */
  async writeContract(contractAddress, functionName, params = [], walletAddress, options = {}) {
    try {
      // Obter contrato do banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Obter função do ABI
      const abiFunction = contract.getFunction(functionName);
      if (!abiFunction) {
        throw new Error(`Função '${functionName}' não encontrada no ABI`);
      }

      // Verificar se é uma função de escrita
      if (abiFunction.stateMutability === 'view' || abiFunction.stateMutability === 'pure') {
        throw new Error(`Função '${functionName}' não é uma função de escrita`);
      }

      // Obter usuário pela publicKey para pegar a privateKey
      const user = await userService.getUserByPublicKey(walletAddress, true);
      if (!user.success) {
        throw new Error('Usuário não encontrado');
      }

      // Obter provider e signer
      const provider = blockchainService.config.getProvider(contract.network);
      const signer = new ethers.Wallet(user.data.privateKey, provider);

      // Criar instância do contrato com signer
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        signer
      );

      // Preparar transação
      const txOptions = {
        gasLimit: options.gasLimit || 300000,
        ...options
      };

      // Executar função
      const tx = await contractInstance[functionName](...params, txOptions);
      
      // Aguardar confirmação
      const receipt = await tx.wait();

      // Atualizar lastActivityAt do usuário
      await userService.updateUser(user.data.id, {
        lastActivityAt: new Date()
      });

      return {
        success: true,
        message: 'Operação de escrita executada com sucesso',
        data: {
          contractAddress: contract.address,
          functionName,
          params,
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          network: contract.network,
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
   * Implanta um novo contrato
   */
  async deployContract(contractData, walletAddress, options = {}) {
    try {
      // Validar ABI e bytecode
      this.SmartContract.validateABI(contractData.abi);
      if (!contractData.bytecode) {
        throw new Error('Bytecode é obrigatório para implantação');
      }

      // Obter usuário pela publicKey para pegar a privateKey
      const user = await userService.getUserByPublicKey(walletAddress, true);
      if (!user.success) {
        throw new Error('Usuário não encontrado');
      }

      // Obter provider e signer
      const provider = blockchainService.config.getProvider(contractData.network || 'testnet');
      const signer = new ethers.Wallet(user.data.privateKey, provider);

      // Criar factory do contrato
      const contractFactory = new ethers.ContractFactory(
        contractData.abi,
        contractData.bytecode,
        signer
      );

      // Preparar parâmetros de implantação
      const deployParams = contractData.constructorParams || [];
      const deployOptions = {
        gasLimit: options.gasLimit || 3000000,
        ...options
      };

      // Implantar contrato
      const contract = await contractFactory.deploy(...deployParams, deployOptions);
      
      // Aguardar implantação
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      // Registrar contrato no banco
      const contractRecord = await this.registerContract({
        ...contractData,
        address: contractAddress,
        deployedBy: wallet.data.id,
        deployedAt: new Date()
      });

      // Atualizar lastActivityAt do usuário
      await userService.updateUser(user.data.id, {
        lastActivityAt: new Date()
      });

      return {
        success: true,
        message: 'Contrato implantado com sucesso',
        data: {
          contractAddress,
          contractName: contractData.name,
          network: contractData.network || 'testnet',
          deployedBy: walletAddress,
          deployedAt: new Date().toISOString(),
          contract: contractRecord.data
        }
      };
    } catch (error) {
      throw new Error(`Erro na implantação do contrato: ${error.message}`);
    }
  }

  /**
   * Obtém eventos do contrato
   */
  async getContractEvents(contractAddress, eventName, fromBlock = 0, toBlock = 'latest', options = {}) {
    try {
      // Obter contrato do banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Obter evento do ABI
      const abiEvent = contract.getEvent(eventName);
      if (!abiEvent) {
        throw new Error(`Evento '${eventName}' não encontrado no ABI`);
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        provider
      );

      // Obter eventos
      const events = await contractInstance.queryFilter(
        contractInstance.filters[eventName](),
        fromBlock,
        toBlock
      );

      return {
        success: true,
        message: 'Eventos obtidos com sucesso',
        data: {
          contractAddress: contract.address,
          eventName,
          events: events.map(event => ({
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.logIndex,
            args: event.args,
            timestamp: new Date().toISOString()
          })),
          count: events.length,
          network: contract.network
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter eventos: ${error.message}`);
    }
  }

  /**
   * Atualiza metadados do contrato
   */
  async updateContractMetadata(address, metadata) {
    try {
      const [updated] = await this.SmartContract.updateContract(address, { metadata });
      
      if (updated === 0) {
        throw new Error('Contrato não encontrado');
      }

      const contract = await this.SmartContract.findByAddress(address);
      
      return {
        success: true,
        message: 'Metadados do contrato atualizados com sucesso',
        data: contract
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar metadados: ${error.message}`);
    }
  }

  /**
   * Desativa um contrato
   */
  async deactivateContract(address) {
    try {
      const [updated] = await this.SmartContract.deactivateContract(address);
      
      if (updated === 0) {
        throw new Error('Contrato não encontrado');
      }

      return {
        success: true,
        message: 'Contrato desativado com sucesso'
      };
    } catch (error) {
      throw new Error(`Erro ao desativar contrato: ${error.message}`);
    }
  }

  /**
   * Reativa um contrato
   */
  async activateContract(address) {
    try {
      const [updated] = await this.SmartContract.activateContract(address);
      
      if (updated === 0) {
        throw new Error('Contrato não encontrado');
      }

      return {
        success: true,
        message: 'Contrato reativado com sucesso'
      };
    } catch (error) {
      throw new Error(`Erro ao reativar contrato: ${error.message}`);
    }
  }

  /**
   * Verifica se um usuário tem a role DEFAULT_ADMIN_ROLE em um token
   */
  async verifyTokenAdmin(contractAddress, adminPublicKey) {
    try {
      // Obter contrato do banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
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
      throw new Error(`Erro ao verificar admin do token: ${error.message}`);
    }
  }

  /**
   * Concede a role DEFAULT_ADMIN_ROLE a um usuário
   */
  async grantAdminRole(contractAddress, newAdminPublicKey, currentAdminPublicKey) {
    try {
      // Obter contrato do banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Verificar se o currentAdminPublicKey tem a role DEFAULT_ADMIN_ROLE
      const isCurrentAdmin = await this.verifyTokenAdmin(contractAddress, currentAdminPublicKey);
      if (!isCurrentAdmin) {
        throw new Error('O usuário atual não possui a role DEFAULT_ADMIN_ROLE no token');
      }

      // Obter usuário atual para pegar a privateKey
      const currentUser = await userService.getUserByPublicKey(currentAdminPublicKey, true);
      if (!currentUser.success) {
        throw new Error('Usuário admin atual não encontrado');
      }

      // Obter provider e signer
      const provider = blockchainService.config.getProvider(contract.network);
      const signer = new ethers.Wallet(currentUser.data.privateKey, provider);

      // Criar instância do contrato com signer
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        signer
      );

      // Verificar se o contrato tem a função grantRole
      if (!contractInstance.grantRole) {
        throw new Error('Contrato não possui função grantRole');
      }

      // Conceder a role DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const tx = await contractInstance.grantRole(DEFAULT_ADMIN_ROLE, newAdminPublicKey);
      
      // Aguardar confirmação
      const receipt = await tx.wait();

      // Atualizar o admin do contrato no banco
      await this.SmartContract.updateContract(contractAddress, {
        adminPublicKey: newAdminPublicKey
      });

      return {
        success: true,
        message: 'Role DEFAULT_ADMIN_ROLE concedida com sucesso',
        data: {
          contractAddress: contract.address,
          newAdminPublicKey,
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          network: contract.network,
          timestamp: new Date().toISOString(),
          receipt: {
            blockNumber: receipt.blockNumber,
            confirmations: receipt.confirmations,
            status: receipt.status
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role admin: ${error.message}`);
    }
  }

  /**
   * Concede a role DEFAULT_ADMIN_ROLE a um usuário (Admin)
   */
  async grantAdminRoleByAdmin(contractAddress, newAdminPublicKey) {
    try {
      // Obter contrato do banco
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Para admin, usamos uma chave privada específica do sistema
      // Esta chave deve ser configurada no ambiente
      const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
      if (!adminPrivateKey) {
        throw new Error('ADMIN_PRIVATE_KEY não configurada no ambiente');
      }

      // Obter provider e signer
      const provider = blockchainService.config.getProvider(contract.network);
      const signer = new ethers.Wallet(adminPrivateKey, provider);

      // Criar instância do contrato com signer
      const contractInstance = new ethers.Contract(
        contract.address,
        contract.abi,
        signer
      );

      // Verificar se o contrato tem a função grantRole
      if (!contractInstance.grantRole) {
        throw new Error('Contrato não possui função grantRole');
      }

      // Conceder a role DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const tx = await contractInstance.grantRole(DEFAULT_ADMIN_ROLE, newAdminPublicKey);
      
      // Aguardar confirmação
      const receipt = await tx.wait();

      // Atualizar o admin do contrato no banco
      await this.SmartContract.updateContract(contractAddress, {
        adminPublicKey: newAdminPublicKey
      });

      return {
        success: true,
        message: 'Role DEFAULT_ADMIN_ROLE concedida com sucesso pelo admin',
        data: {
          contractAddress: contract.address,
          newAdminPublicKey,
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          network: contract.network,
          timestamp: new Date().toISOString(),
          receipt: {
            blockNumber: receipt.blockNumber,
            confirmations: receipt.confirmations,
            status: receipt.status
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role admin: ${error.message}`);
    }
  }

  /**
   * Atualiza o admin de um token
   */
  async updateTokenAdmin(contractAddress, newAdminPublicKey, currentAdminPublicKey) {
    try {
      // Verificar se o currentAdminPublicKey tem a role DEFAULT_ADMIN_ROLE
      const isCurrentAdmin = await this.verifyTokenAdmin(contractAddress, currentAdminPublicKey);
      if (!isCurrentAdmin) {
        throw new Error('O usuário atual não possui a role DEFAULT_ADMIN_ROLE no token');
      }

      // Verificar se o newAdminPublicKey tem a role DEFAULT_ADMIN_ROLE
      const isNewAdmin = await this.verifyTokenAdmin(contractAddress, newAdminPublicKey);
      if (!isNewAdmin) {
        throw new Error('O novo usuário não possui a role DEFAULT_ADMIN_ROLE no token');
      }

      // Atualizar o admin do contrato no banco
      await this.SmartContract.updateContract(contractAddress, {
        adminPublicKey: newAdminPublicKey
      });

      return {
        success: true,
        message: 'Admin do token atualizado com sucesso',
        data: {
          contractAddress,
          newAdminPublicKey,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar admin do token: ${error.message}`);
    }
  }

  /**
   * Concede a role MINTER_ROLE a um usuário
   */
  async grantMinterRole(contractAddress, newMinterPublicKey, currentAdminPublicKey) {
    try {
      // Verificar se o contrato existe
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Verificar se o currentAdminPublicKey tem a role DEFAULT_ADMIN_ROLE
      const isCurrentAdmin = await this.verifyTokenAdmin(contractAddress, currentAdminPublicKey);
      if (!isCurrentAdmin) {
        throw new Error('O usuário atual não possui a role DEFAULT_ADMIN_ROLE no token');
      }

      // Obter provider e wallet
      const provider = blockchainService.config.getProvider(contract.network);
      const wallet = await walletService.getWalletByAddress(currentAdminPublicKey);
      
      if (!wallet) {
        throw new Error('Carteira do admin não encontrada');
      }

      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        wallet
      );

      // Role MINTER_ROLE: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
      const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

      // Executar grantRole
      const tx = await contractInstance.grantRole(MINTER_ROLE, newMinterPublicKey);
      await tx.wait();

      return {
        success: true,
        message: 'Role MINTER_ROLE concedida com sucesso',
        data: {
          contractAddress,
          newMinterPublicKey,
          role: 'MINTER_ROLE',
          roleHash: MINTER_ROLE,
          transactionHash: tx.hash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role MINTER_ROLE: ${error.message}`);
    }
  }

  /**
   * Concede a role BURNER_ROLE a um usuário
   */
  async grantBurnerRole(contractAddress, newBurnerPublicKey, currentAdminPublicKey) {
    try {
      // Verificar se o contrato existe
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Verificar se o currentAdminPublicKey tem a role DEFAULT_ADMIN_ROLE
      const isCurrentAdmin = await this.verifyTokenAdmin(contractAddress, currentAdminPublicKey);
      if (!isCurrentAdmin) {
        throw new Error('O usuário atual não possui a role DEFAULT_ADMIN_ROLE no token');
      }

      // Obter provider e wallet
      const provider = blockchainService.config.getProvider(contract.network);
      const wallet = await walletService.getWalletByAddress(currentAdminPublicKey);
      
      if (!wallet) {
        throw new Error('Carteira do admin não encontrada');
      }

      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        wallet
      );

      // Role BURNER_ROLE: 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
      const BURNER_ROLE = '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848';

      // Executar grantRole
      const tx = await contractInstance.grantRole(BURNER_ROLE, newBurnerPublicKey);
      await tx.wait();

      return {
        success: true,
        message: 'Role BURNER_ROLE concedida com sucesso',
        data: {
          contractAddress,
          newBurnerPublicKey,
          role: 'BURNER_ROLE',
          roleHash: BURNER_ROLE,
          transactionHash: tx.hash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role BURNER_ROLE: ${error.message}`);
    }
  }

  /**
   * Concede a role TRANSFER_ROLE a um usuário
   */
  async grantTransferRole(contractAddress, newTransferPublicKey, currentAdminPublicKey) {
    try {
      // Verificar se o contrato existe
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }

      // Verificar se o currentAdminPublicKey tem a role DEFAULT_ADMIN_ROLE
      const isCurrentAdmin = await this.verifyTokenAdmin(contractAddress, currentAdminPublicKey);
      if (!isCurrentAdmin) {
        throw new Error('O usuário atual não possui a role DEFAULT_ADMIN_ROLE no token');
      }

      // Obter provider e wallet
      const provider = blockchainService.config.getProvider(contract.network);
      const wallet = await walletService.getWalletByAddress(currentAdminPublicKey);
      
      if (!wallet) {
        throw new Error('Carteira do admin não encontrada');
      }

      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        wallet
      );

      // Role TRANSFER_ROLE: 0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c
      const TRANSFER_ROLE = '0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c';

      // Executar grantRole
      const tx = await contractInstance.grantRole(TRANSFER_ROLE, newTransferPublicKey);
      await tx.wait();

      return {
        success: true,
        message: 'Role TRANSFER_ROLE concedida com sucesso',
        data: {
          contractAddress,
          newTransferPublicKey,
          role: 'TRANSFER_ROLE',
          roleHash: TRANSFER_ROLE,
          transactionHash: tx.hash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role TRANSFER_ROLE: ${error.message}`);
    }
  }

  /**
   * Atualiza metadados do token (description, website, explorer)
   */
  async updateTokenMetadata(address, metadata) {
    try {
      const contract = await this.SmartContract.findByAddress(address);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Atualizar apenas os campos permitidos
      const allowedFields = ['description', 'website', 'explorer'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (metadata[field] !== undefined) {
          updateData[field] = metadata[field];
        }
      }

      // Atualizar metadata
      const currentMetadata = contract.metadata || {};
      const updatedMetadata = { ...currentMetadata, ...updateData };

      await this.SmartContract.update(
        { metadata: updatedMetadata },
        { where: { address: address.toLowerCase() } }
      );

      return {
        success: true,
        message: 'Metadados do token atualizados com sucesso',
        data: {
          address,
          updatedFields: Object.keys(updateData),
          metadata: updatedMetadata
        }
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar metadados do token: ${error.message}`);
    }
  }

  /**
   * Concede role de admin para um token
   */
  async grantTokenAdminRole(address, adminPublicKey) {
    try {
      const contract = await this.SmartContract.findByAddress(address);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Validar formato do adminPublicKey
      if (!ethers.isAddress(adminPublicKey)) {
        throw new Error('adminPublicKey deve ser um endereço válido');
      }

      // Atualizar adminPublicKey
      await this.SmartContract.update(
        { adminPublicKey: adminPublicKey.toLowerCase() },
        { where: { address: address.toLowerCase() } }
      );

      return {
        success: true,
        message: 'Role de admin concedida com sucesso',
        data: {
          address,
          adminPublicKey: adminPublicKey.toLowerCase(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role de admin: ${error.message}`);
    }
  }

  /**
   * Verifica se um endereço tem determinada role
   */
  async checkRole(contractAddress, targetAddress, role) {
    try {
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        provider
      );

      // Mapear roles para hashes
      const roleHashes = {
        'DEFAULT_ADMIN_ROLE': '0x0000000000000000000000000000000000000000000000000000000000000000',
        'MINTER_ROLE': '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
        'BURNER_ROLE': '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
        'TRANSFER_ROLE': '0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c'
      };

      const roleHash = roleHashes[role];
      if (!roleHash) {
        throw new Error(`Role inválida: ${role}. Roles válidas: DEFAULT_ADMIN_ROLE, MINTER_ROLE, BURNER_ROLE, TRANSFER_ROLE`);
      }

      // Verificar role
      const hasRole = await contractInstance.hasRole(roleHash, targetAddress);

      return {
        success: true,
        message: 'Verificação de role realizada com sucesso',
        data: {
          contractAddress,
          targetAddress,
          role,
          roleHash,
          hasRole,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao verificar role: ${error.message}`);
    }
  }

  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(contractAddress, targetAddress, role) {
    try {
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Verificar se o usuário atual é admin do token
      if (!contract.adminPublicKey) {
        throw new Error('Token não possui admin configurado');
      }

      // Obter wallet do admin
      const adminWallet = await walletService.getWalletByAddress(contract.adminPublicKey);
      if (!adminWallet) {
        throw new Error('Carteira do admin não encontrada');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato com wallet do admin
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        adminWallet
      );

      // Mapear roles para hashes
      const roleHashes = {
        'DEFAULT_ADMIN_ROLE': '0x0000000000000000000000000000000000000000000000000000000000000000',
        'MINTER_ROLE': '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
        'BURNER_ROLE': '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
        'TRANSFER_ROLE': '0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c'
      };

      const roleHash = roleHashes[role];
      if (!roleHash) {
        throw new Error(`Role inválida: ${role}. Roles válidas: DEFAULT_ADMIN_ROLE, MINTER_ROLE, BURNER_ROLE, TRANSFER_ROLE`);
      }

      // Revogar role
      const tx = await contractInstance.revokeRole(roleHash, targetAddress);
      await tx.wait();

      return {
        success: true,
        message: 'Role revogada com sucesso',
        data: {
          contractAddress,
          targetAddress,
          role,
          roleHash,
          transactionHash: tx.hash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao revogar role: ${error.message}`);
    }
  }

  /**
   * Mapeia roles para hashes
   */
  getRoleHash(role) {
    const roleHashes = {
      'admin': '0x0000000000000000000000000000000000000000000000000000000000000000',
      'minter': '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
      'burner': '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
      'transfer': '0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c'
    };

    const roleHash = roleHashes[role];
    if (!roleHash) {
      throw new Error(`Role inválida: ${role}. Roles válidas: admin, minter, burner, transfer`);
    }

    return roleHash;
  }

  /**
   * Concede uma role a um endereço
   */
  async grantRole(contractAddress, role, targetAddress, walletAddress) {
    try {
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter wallet para assinatura
      const wallet = await walletService.getWalletByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato com wallet
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        wallet
      );

      // Obter hash da role
      const roleHash = this.getRoleHash(role);

      // Executar grantRole
      const tx = await contractInstance.grantRole(roleHash, targetAddress);
      await tx.wait();

      // Se for admin role, atualizar adminPublicKey no banco
      if (role === 'admin') {
        await this.updateAdminPublicKey(contractAddress, targetAddress);
      }

      return {
        success: true,
        message: `Role ${role.toUpperCase()} concedida com sucesso`,
        data: {
          contractAddress,
          targetAddress,
          role,
          roleHash,
          transactionHash: tx.hash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao conceder role ${role}: ${error.message}`);
    }
  }

  /**
   * Verifica se um endereço tem determinada role
   */
  async hasRole(contractAddress, role, targetAddress) {
    try {
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        provider
      );

      // Obter hash da role
      const roleHash = this.getRoleHash(role);

      // Verificar role
      const hasRole = await contractInstance.hasRole(roleHash, targetAddress);

      return {
        success: true,
        message: 'Verificação de role realizada com sucesso',
        data: {
          contractAddress,
          targetAddress,
          role,
          roleHash,
          hasRole,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao verificar role ${role}: ${error.message}`);
    }
  }

  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(contractAddress, role, targetAddress, walletAddress) {
    try {
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter wallet para assinatura
      const wallet = await walletService.getWalletByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato com wallet
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        wallet
      );

      // Obter hash da role
      const roleHash = this.getRoleHash(role);

      // Revogar role
      const tx = await contractInstance.revokeRole(roleHash, targetAddress);
      await tx.wait();

      return {
        success: true,
        message: `Role ${role.toUpperCase()} revogada com sucesso`,
        data: {
          contractAddress,
          targetAddress,
          role,
          roleHash,
          transactionHash: tx.hash,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao revogar role ${role}: ${error.message}`);
    }
  }

  /**
   * Atualiza adminPublicKey e revoga role do admin anterior
   */
  async updateAdminPublicKey(contractAddress, newAdminAddress) {
    try {
      const contract = await this.SmartContract.findByAddress(contractAddress);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Se já existe um admin, revogar a role dele
      if (contract.adminPublicKey && contract.adminPublicKey !== newAdminAddress) {
        // Verificar se o novo admin realmente tem a role de admin
        const hasRoleResult = await this.hasRole(contractAddress, 'admin', newAdminAddress);
        
        if (hasRoleResult.data.hasRole) {
          // Revogar role do admin anterior
          await this.revokeRole(contractAddress, 'admin', contract.adminPublicKey, newAdminAddress);
        }
      }

      // Atualizar adminPublicKey no banco
      await this.SmartContract.update(
        { adminPublicKey: newAdminAddress.toLowerCase() },
        { where: { address: contractAddress.toLowerCase() } }
      );

      return {
        success: true,
        message: 'AdminPublicKey atualizado com sucesso',
        data: {
          contractAddress,
          newAdminAddress: newAdminAddress.toLowerCase(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar adminPublicKey: ${error.message}`);
    }
  }

  /**
   * Obtém informações do token da blockchain
   */
  async getTokenInfo(address) {
    try {
      const contract = await this.SmartContract.findByAddress(address);
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(contract.network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        address,
        contract.abi,
        provider
      );

      // Obter informações básicas do token
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contractInstance.name(),
        contractInstance.symbol(),
        contractInstance.decimals(),
        contractInstance.totalSupply()
      ]);

      return {
        success: true,
        message: 'Informações do token obtidas com sucesso',
        data: {
          address,
          name,
          symbol,
          decimals: decimals.toString(),
          totalSupply: totalSupply.toString(),
          network: contract.network,
          contractType: contract.contractType,
          metadata: contract.metadata,
          adminPublicKey: contract.adminPublicKey
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do token: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de contratos
   */
  async testService() {
    try {
      // Teste de validação de ABI
      const testABI = [
        {
          "type": "function",
          "name": "balanceOf",
          "inputs": [{"name": "account", "type": "address"}],
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "transfer",
          "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"}
          ],
          "outputs": [{"name": "", "type": "bool"}],
          "stateMutability": "nonpayable"
        }
      ];

      this.SmartContract.validateABI(testABI);

      // Teste de criação de contrato
      const testContract = await this.registerContract({
        name: 'Test Contract',
        address: '0x1234567890123456789012345678901234567890',
        abi: testABI,
        network: 'testnet',
        contractType: 'ERC20',
        metadata: { test: true }
      });

      // Teste de busca
      const foundContract = await this.getContractByAddress('0x1234567890123456789012345678901234567890');

      // Teste de listagem
      const contracts = await this.listContracts({ page: 1, limit: 5 });

      // Limpar contrato de teste
      await this.deactivateContract('0x1234567890123456789012345678901234567890');

      return {
        success: true,
        message: 'Teste do serviço de contratos realizado com sucesso',
        data: {
          abiValidation: true,
          contractCreated: true,
          contractFound: true,
          contractsListed: true,
          testContractCleaned: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de contratos',
        error: error.message,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }
}

module.exports = new ContractService(); 