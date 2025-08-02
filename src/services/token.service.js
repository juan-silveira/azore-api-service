const { ethers } = require('ethers');
const axios = require('axios');
const blockchainService = require('./blockchain.service');
const contractService = require('./contract.service');

class TokenService {
  constructor() {
    // Remover inicialização automática do construtor
  }

  async initialize() {
    try {
      await contractService.initialize();
      console.log('✅ Serviço de tokens inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de tokens:', error.message);
      // Não lançar erro para evitar quebrar a aplicação
      console.log('⚠️ Serviço de tokens inicializado com limitações');
    }
  }

  /**
   * Obtém o saldo de um token ERC20 usando a API do AzoreScan
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} walletAddress - Endereço da carteira
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Saldo do token
   */
  async getTokenBalance(contractAddress, walletAddress, network = 'testnet') {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Endereço da carteira inválido');
      }

      // Determinar URL da API baseada na rede
      const apiUrl = network === 'mainnet' 
        ? 'https://azorescan.com/api'
        : 'https://floripa.azorescan.com/api';

      // Fazer requisição para a API do AzoreScan
      const response = await axios.get(`${apiUrl}`, {
        params: {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: walletAddress
        },
        timeout: 10000
      });

      if (response.data.status === '0') {
        throw new Error(`Erro na API: ${response.data.message}`);
      }

      const balanceWei = response.data.result;
      const balanceEth = ethers.formatUnits(balanceWei, 18);

      return {
        success: true,
        message: 'Saldo do token obtido com sucesso',
        data: {
          contractAddress: contractAddress.toLowerCase(),
          walletAddress: walletAddress.toLowerCase(),
          balanceWei: balanceWei,
          balanceEth: balanceEth,
          network: network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo do token: ${error.message}`);
    }
  }

  /**
   * Executa função mint do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} toAddress - Endereço que receberá os tokens
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} clientWalletAddress - Endereço da carteira do client que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async mintToken(contractAddress, toAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }
      if (!ethers.isAddress(gasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // gasPayer é o endereço do client que paga a transação
      const clientWalletAddress = gasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Executar função mint através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'mint',
        [toAddress, amountWei],
        clientWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      return {
        success: true,
        message: 'Tokens mintados com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          toAddress: toAddress.toLowerCase()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao mintar tokens: ${error.message}`);
    }
  }

  /**
   * Executa função burnFrom do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de onde os tokens serão queimados
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} clientWalletAddress - Endereço da carteira do client que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async burnFromToken(contractAddress, fromAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(gasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // gasPayer é o endereço do client que paga a transação
      const clientWalletAddress = gasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Executar função burnFrom através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'burnFrom',
        [fromAddress, amountWei],
        clientWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      return {
        success: true,
        message: 'Tokens queimados com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          fromAddress: fromAddress.toLowerCase()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao queimar tokens: ${error.message}`);
    }
  }

  /**
   * Executa função transferFromGasless do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de origem
   * @param {string} toAddress - Endereço de destino
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} clientWalletAddress - Endereço da carteira do client que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async transferFromGasless(contractAddress, fromAddress, toAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }
      if (!ethers.isAddress(gasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // gasPayer é o endereço do client que paga a transação
      const clientWalletAddress = gasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Converter quantidade para wei
      const amountWei = ethers.parseEther(amount.toString());

      // Executar função transferFromGasless através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'transferFromGasless',
        [fromAddress, toAddress, amountWei],
        clientWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      return {
        success: true,
        message: 'Transferência sem gás executada com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: amountWei.toString(),
          amountEth: amount.toString(),
          fromAddress: fromAddress.toLowerCase(),
          toAddress: toAddress.toLowerCase()
        }
      };
    } catch (error) {
      throw new Error(`Erro na transferência sem gás: ${error.message}`);
    }
  }

  /**
   * Registra um contrato de token no sistema
   * @param {Object} tokenData - Dados do token (apenas address é obrigatório)
   * @returns {Promise<Object>} Resultado do registro
   */
  async registerToken(tokenData) {
    try {
      // Validar endereço
      if (!tokenData.address) {
        throw new Error('Endereço do contrato é obrigatório');
      }

      if (!ethers.isAddress(tokenData.address)) {
        throw new Error('Endereço do contrato inválido');
      }

      const network = tokenData.network || 'testnet';
      const contractAddress = tokenData.address.toLowerCase();

      // Carregar ABI do token do .env
      const tokenABI = JSON.parse(process.env.TOKEN_ABI);

      // Obter provider
      const provider = blockchainService.config.getProvider(network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        tokenABI,
        provider
      );

      // Consultar dados reais do token na blockchain (4 consultas)
      const [name, symbol, decimals, totalSupplyWei] = await Promise.all([
        contractInstance.name(),
        contractInstance.symbol(),
        contractInstance.decimals(),
        contractInstance.totalSupply()
      ]);

      // Converter totalSupply para ETH (unidades inteiras)
      const totalSupplyEth = ethers.formatUnits(totalSupplyWei, decimals);

      // Verificar se o token já existe no banco (opcional)
      let existingContract;
      let isUpdate = false;
      try {
        existingContract = await contractService.getContractByAddress(contractAddress);
        isUpdate = existingContract.success;
      } catch (error) {
        // Contrato não encontrado, será registrado como novo
        isUpdate = false;
      }

      // Gerar adminPublicKey a partir do ADMIN_PRIVATE_KEY
      const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY);
      const adminPublicKey = adminWallet.address;

      // Preparar dados do contrato
      const contractData = {
        name: `${name} Token`,
        address: contractAddress,
        abi: tokenABI,
        network: network,
        contractType: 'ERC20',
        adminPublicKey: adminPublicKey,
        metadata: {
          tokenName: name,
          tokenSymbol: symbol,
          decimals: Number(decimals),
          totalSupplyWei: totalSupplyWei.toString(),
          totalSupplyEth: totalSupplyEth,
          lastUpdated: new Date().toISOString()
        }
      };

      let result;
      if (isUpdate) {
        // Atualizar contrato existente
        result = await contractService.updateContractMetadata(contractAddress, contractData.metadata);
        result.message = 'Token atualizado com sucesso';
      } else {
        // Registrar novo contrato
        result = await contractService.registerContract(contractData);
        result.message = 'Token registrado com sucesso';
      }
      
      return {
        success: true,
        message: result.message,
        data: {
          ...result.data,
          tokenInfo: {
            name: name,
            symbol: symbol,
            decimals: Number(decimals),
            totalSupplyWei: totalSupplyWei.toString(),
            totalSupplyEth: totalSupplyEth,
            network: network,
            isUpdate: isUpdate
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao registrar token: ${error.message}`);
    }
  }

  /**
   * Obtém informações básicas do token
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Informações do token
   */
  async getTokenInfo(contractAddress, network = 'testnet') {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Carregar ABI do token do .env
      const tokenABI = JSON.parse(process.env.TOKEN_ABI);

      // Obter provider
      const provider = blockchainService.config.getProvider(network);
      
      // Criar instância do contrato
      const contractInstance = new ethers.Contract(
        contractAddress,
        tokenABI,
        provider
      );

      // Obter informações básicas diretamente da blockchain
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contractInstance.name(),
        contractInstance.symbol(),
        contractInstance.decimals(),
        contractInstance.totalSupply()
      ]);

      // Verificar se o token existe no banco (opcional)
      let metadata = null;
      try {
        const contract = await contractService.getContractByAddress(contractAddress);
        metadata = contract.success ? contract.data.metadata : null;
      } catch (error) {
        // Contrato não encontrado no banco, mas continuamos com os dados da blockchain
        metadata = null;
      }

      return {
        success: true,
        message: 'Informações do token obtidas com sucesso',
        data: {
          contractAddress: contractAddress.toLowerCase(),
          name: name,
          symbol: symbol,
          decimals: Number(decimals),
          totalSupplyWei: totalSupply.toString(),
          totalSupplyEth: ethers.formatUnits(totalSupply, decimals),
          network: network,
          metadata: metadata
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do token: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo da moeda nativa AZE
   * @param {string} walletAddress - Endereço da carteira
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Saldo da moeda AZE
   */
  async getAzeBalance(walletAddress, network = 'testnet') {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Endereço da carteira inválido');
      }
      // Obter provider da rede
      const provider = blockchainService.config.getProvider(network);
      // Consultar saldo
      const balanceWei = await provider.getBalance(walletAddress);
      const balanceEth = ethers.formatUnits(balanceWei, 18);
      return {
        success: true,
        message: 'Saldo da moeda AZE obtido com sucesso',
        data: {
          walletAddress: walletAddress.toLowerCase(),
          balanceWei: balanceWei.toString(),
          balanceEth: balanceEth,
          network: network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo da moeda AZE: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de tokens
   * @returns {Promise<Object>} Resultado do teste
   */
  async testService() {
    try {
      // Token de teste na testnet
      const testTokenAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
      const testWalletAddress = '0x95aDDd264023038D7Aa77B0974Ef3C4dc43E3bd6';

      // Teste básico de conectividade
      const balanceTest = await this.getTokenBalance(testTokenAddress, testWalletAddress, 'testnet');

      return {
        success: true,
        message: 'Teste do serviço de tokens realizado com sucesso',
        data: {
          balanceTest: balanceTest.success,
          testTokenAddress,
          testWalletAddress,
          serviceStatus: 'operational'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de tokens',
        error: error.message,
        data: {
          serviceStatus: 'error',
          error: error.message
        }
      };
    }
  }
}

module.exports = new TokenService(); 