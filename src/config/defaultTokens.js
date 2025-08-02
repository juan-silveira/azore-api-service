/**
 * Configuração dos tokens padrão que serão criados automaticamente
 * quando o banco de dados for inicializado
 */

// Função para obter o ABI do token da variável de ambiente
const getTokenABI = () => {
  try {
    const tokenABI = process.env.TOKEN_ABI;
    if (!tokenABI) {
      console.warn('⚠️  TOKEN_ABI não encontrada no .env, usando ABI padrão');
      return [];
    }
    return JSON.parse(tokenABI);
  } catch (error) {
    console.error('❌ Erro ao parsear TOKEN_ABI:', error.message);
    return [];
  }
};

const defaultTokens = [
  // Token nativo da Mainnet - Azore (AZE)
  {
    name: 'Azore',
    symbol: 'AZE',
    address: '0x0000000000000000000000000000000000000000', // Endereço zero para token nativo
    network: 'mainnet',
    contractType: 'NATIVE',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminPublicKey: null, // Token nativo não tem admin
    metadata: {
      decimals: 18,
      totalSupply: null, // Supply ilimitado para token nativo
      description: 'Token nativo da rede Azore Mainnet',
      website: 'https://azore.technology',
      explorer: 'https://explorer.azore.technology',
      isNative: true
    },
    abi: [] // Token nativo não tem ABI
  },
  
  // Token nativo da Testnet - Azore (AZE-t)
  {
    name: 'Azore',
    symbol: 'AZE-t',
    address: '0x0000000000000000000000000000000000000000', // Endereço zero para token nativo
    network: 'testnet',
    contractType: 'NATIVE',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminPublicKey: null, // Token nativo não tem admin
    metadata: {
      decimals: 18,
      totalSupply: null, // Supply ilimitado para token nativo
      description: 'Token nativo da rede Azore Testnet',
      website: 'https://azore.technology',
      explorer: 'https://testnet-explorer.azore.technology',
      isNative: true
    },
    abi: [] // Token nativo não tem ABI
  },
  
  // cBRL - Token ERC20 da Testnet
  {
    name: 'Coinage Real Brasil',
    symbol: 'cBRL',
    address: '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
    network: 'testnet',
    contractType: 'ERC20',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminPublicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
    metadata: {
      decimals: 18,
      totalSupply: '1000000000000000000000000', // 1 milhão de tokens
      description: 'Token cBRL da rede Azore Testnet',
      website: 'https://',
      explorer: 'https://floripa.azorescan.com',
      isNative: false
    },
    abi: getTokenABI()
  },
  
  // cBRL - Token ERC20 da Mainnet (placeholder)
  {
    name: 'Coinage Real Brasil',
    symbol: 'cBRL',
    address: '0x2f8d31627a1f014691eb6e56c235b2382702f4b9',
    network: 'mainnet',
    contractType: 'ERC20',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminPublicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
    metadata: {
      decimals: 18,
      totalSupply: '1000000000000000000000000', // 1 milhão de tokens
      description: 'Token cBRL da rede Azore Mainnet',
      website: 'https://',
      explorer: 'https://azorescan.com',
      isNative: false
    },
    abi: getTokenABI()
  }
];

module.exports = defaultTokens; 