const databaseConfig = require('../config/database');
const crypto = require('crypto');

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
 * Middleware para verificar permissões específicas
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
 * Middleware para verificar se o usuário pertence ao client específico
 */
const requireSameClient = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const clientId = req.params.clientId || req.params.id;
    
    if (req.user.clientId !== clientId && !req.user.isApiAdminUser()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: usuário não pertence ao client especificado',
        error: 'CLIENT_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na verificação de client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno na verificação de client',
      error: 'CLIENT_CHECK_ERROR'
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
      'X-User-Is-Client-Admin': req.user.isClientAdminUser()
    });
  }
  next();
};

/**
 * Middleware para log de requisições de admin
 */
const logAdminRequest = (req, res, next) => {
  if (req.user) {
    console.log(`[ADMIN] ${req.method} ${req.path} - User: ${req.user.name} (${req.user.id}) - Client: ${req.user.clientId} - Roles: ${req.user.roles.join(', ')}`);
  }
  next();
};

module.exports = {
  requireApiAdmin,
  requireClientAdmin,
  requireAnyAdmin,
  requireApiKeyManagement,
  checkPermission,
  requireSameClient,
  addUserInfo,
  logAdminRequest
}; 