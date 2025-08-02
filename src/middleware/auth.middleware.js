const databaseConfig = require('../config/database');
const crypto = require('crypto');

/**
 * Middleware de autenticação por API Key
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    // Obter API Key do header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API Key é obrigatória',
        error: 'MISSING_API_KEY'
      });
    }

    // Validar formato da API Key
    if (!/^[a-f0-9]{64}$/.test(apiKey)) {
      return res.status(401).json({
        success: false,
        message: 'API Key inválida',
        error: 'INVALID_API_KEY_FORMAT'
      });
    }

    // Buscar API Key e usuário no banco
    const ApiKey = global.models.ApiKey;
    
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await ApiKey.findByKeyHash(apiKeyHash);
    
    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        message: 'API Key inválida ou inativa',
        error: 'INVALID_API_KEY'
      });
    }

    const user = apiKeyRecord.user;
    const client = user.client;
    
    if (!user || !client) {
      return res.status(401).json({
        success: false,
        message: 'API Key inválida ou usuário/cliente inativo',
        error: 'INVALID_API_KEY'
      });
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo',
        error: 'INACTIVE_USER'
      });
    }

    // Verificar se o client está ativo
    if (!client.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Client inativo',
        error: 'INACTIVE_CLIENT'
      });
    }

    // Atualizar última atividade da API Key e do usuário
    await apiKeyRecord.update({ lastUsedAt: new Date() });
    await user.updateLastActivity();
    
    // Adicionar API Key, usuário e client ao request
    req.apiKey = apiKeyRecord;
    req.user = user;
    req.client = client;

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na autenticação',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

/**
 * Middleware para verificar se o usuário é API_ADMIN
 */
const requireApiAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.isApiAdminUser()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissões de API_ADMIN necessárias',
        error: 'API_ADMIN_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de API_ADMIN:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na verificação de permissões',
      error: 'API_ADMIN_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para verificar se o usuário é CLIENT_ADMIN
 */
const requireClientAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.isClientAdminUser()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissões de CLIENT_ADMIN necessárias',
        error: 'CLIENT_ADMIN_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de CLIENT_ADMIN:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na verificação de permissões',
      error: 'CLIENT_ADMIN_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para verificar se o usuário tem qualquer role de admin (API_ADMIN ou CLIENT_ADMIN)
 */
const requireAnyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.canAccessClientAdminRoutes()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissões de administrador necessárias',
        error: 'ADMIN_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na verificação de permissões',
      error: 'ADMIN_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para verificar se o usuário pode gerenciar API Keys
 */
const requireApiKeyManagement = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    if (!req.user.canManageApiKeys()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissões para gerenciar API Keys necessárias',
        error: 'API_KEY_MANAGEMENT_PERMISSION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de gerenciamento de API Keys:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na verificação de permissões',
      error: 'API_KEY_MANAGEMENT_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para verificar permissões
 */
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      if (!req.user.hasPermission(resource, action)) {
        return res.status(403).json({
          success: false,
          message: `Permissão negada: ${action} em ${resource}`,
          error: 'PERMISSION_DENIED',
          requiredPermission: `${resource}:${action}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de permissão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno na verificação de permissão',
        error: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware para verificar acesso à rede
 */
const checkNetworkAccess = (networkParam = 'network') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      // Obter rede da query, body ou parâmetros
      const network = req.query[networkParam] || req.body[networkParam] || req.params[networkParam];
      
      if (network && !req.user.canAccessNetwork(network)) {
        return res.status(403).json({
          success: false,
          message: `Acesso negado à rede: ${network}`,
          error: 'NETWORK_ACCESS_DENIED',
          allowedNetworks: req.user.allowedNetworks,
          requestedNetwork: network
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de acesso à rede:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno na verificação de acesso à rede',
        error: 'NETWORK_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware para verificar limites de uso
 */
const checkUsageLimits = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Obter estatísticas de uso
    const usageStats = await req.user.getUsageStats();
    
    // Verificar limite de carteiras
    if (req.path.includes('/wallets') && req.method === 'POST') {
      if (usageStats.wallets >= req.user.maxWallets) {
        return res.status(429).json({
          success: false,
          message: `Limite de carteiras atingido: ${usageStats.wallets}/${req.user.maxWallets}`,
          error: 'WALLET_LIMIT_EXCEEDED',
          currentUsage: usageStats.wallets,
          maxAllowed: req.user.maxWallets
        });
      }
    }

    // Verificar limite de contratos
    if (req.path.includes('/contracts') && req.method === 'POST') {
      if (usageStats.contracts >= req.user.maxContracts) {
        return res.status(429).json({
          success: false,
          message: `Limite de contratos atingido: ${usageStats.contracts}/${req.user.maxContracts}`,
          error: 'CONTRACT_LIMIT_EXCEEDED',
          currentUsage: usageStats.contracts,
          maxAllowed: req.user.maxContracts
        });
      }
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de limites de uso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na verificação de limites de uso',
      error: 'USAGE_LIMIT_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para adicionar informações do usuário na resposta
 */
const addUserInfo = (req, res, next) => {
  if (req.user) {
    // Adicionar headers com informações do usuário
    res.set({
      'X-User-ID': req.user.id,
      'X-User-Name': req.user.name,
      'X-User-Email': req.user.email,
      'X-Client-ID': req.user.clientId,
      'X-User-Roles': req.user.roles.join(','),
      'X-User-Is-Api-Admin': req.user.isApiAdminUser(),
      'X-User-Is-Client-Admin': req.user.isClientAdminUser(),
      'X-Rate-Limit-Minute': req.client.rateLimit.requestsPerMinute,
      'X-Rate-Limit-Hour': req.client.rateLimit.requestsPerHour,
      'X-Rate-Limit-Day': req.client.rateLimit.requestsPerDay
    });
  }
  next();
};

/**
 * Middleware para log de requisições autenticadas
 */
const logAuthenticatedRequest = (req, res, next) => {
  if (req.user) {
    console.log(`[AUTH] ${req.method} ${req.path} - User: ${req.user.name} (${req.user.id}) - Client: ${req.client.name} (${req.client.id}) - Roles: ${req.user.roles.join(', ')}`);
  }
  next();
};

module.exports = {
  authenticateApiKey,
  requireApiAdmin,
  requireClientAdmin,
  requireAnyAdmin,
  requireApiKeyManagement,
  checkPermission,
  checkNetworkAccess,
  checkUsageLimits,
  addUserInfo,
  logAuthenticatedRequest
}; 