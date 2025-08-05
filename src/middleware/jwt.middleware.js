const jwtService = require('../services/jwt.service');

/**
 * Middleware para autenticação JWT
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const path = req.path;

    // Verificar se o token está presente
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`🔒 Acesso negado - Token não fornecido - Path: ${path}, IP: ${clientIP}, User-Agent: ${userAgent}`);
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar se token está na blacklist
    const isBlacklisted = await jwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.log(`🚫 Acesso negado - Token na blacklist - Path: ${path}, IP: ${clientIP}, User-Agent: ${userAgent}`);
      return res.status(401).json({
        success: false,
        message: 'Token inválido (blacklisted)',
        error: 'TOKEN_BLACKLISTED'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwtService.verifyAccessToken(token);

    // Adicionar informações do usuário ao request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      clientId: decoded.clientId,
      roles: decoded.roles,
      permissions: decoded.permissions,
      isApiAdmin: decoded.isApiAdmin,
      isClientAdmin: decoded.isClientAdmin
    };

    console.log(`✅ Autenticação JWT bem-sucedida - Email: ${decoded.email}, ID: ${decoded.id}, Path: ${path}, IP: ${clientIP}, Roles: ${decoded.roles.join(', ')}`);

    next();
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const path = req.path;
    
    console.log(`❌ Autenticação JWT falhou - Path: ${path}, IP: ${clientIP}, User-Agent: ${userAgent}, Erro: ${error.message}`);
    
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido'
    });
  }
};

/**
 * Middleware para verificar se usuário tem role específica
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!req.user.roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Role '${role}' é necessária.`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se usuário tem permissão específica
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const permissions = req.user.permissions;
    
    // Verificar se tem permissão específica
    if (permissions[resource] && permissions[resource][action]) {
      return next();
    }

    // Verificar se tem acesso total
    if (permissions.admin && permissions.admin.fullAccess) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acesso negado. Permissão '${action}' em '${resource}' é necessária.`
    });
  };
};

/**
 * Middleware para verificar se é API Admin
 */
const requireApiAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  if (!req.user.isApiAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões de API_ADMIN são necessárias.'
    });
  }

  next();
};

/**
 * Middleware para verificar se é Client Admin
 */
const requireClientAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  if (!req.user.isClientAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões de CLIENT_ADMIN são necessárias.'
    });
  }

  next();
};

/**
 * Middleware para verificar se é qualquer tipo de admin
 */
const requireAnyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  if (!req.user.isApiAdmin && !req.user.isClientAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões administrativas são necessárias.'
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário pertence ao client
 */
const requireClientAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  const requestedClientId = req.params.clientId || req.body.clientId;
  
  if (requestedClientId && req.user.clientId !== requestedClientId) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Você só pode acessar recursos do seu próprio client.'
    });
  }

  next();
};

/**
 * Middleware opcional - adiciona usuário se token válido, mas não falha se não houver token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (jwtService.isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwtService.verifyAccessToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      clientId: decoded.clientId,
      roles: decoded.roles,
      permissions: decoded.permissions,
      isApiAdmin: decoded.isApiAdmin,
      isClientAdmin: decoded.isClientAdmin
    };

    next();
  } catch (error) {
    // Se token inválido, continuar sem usuário
    next();
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  requirePermission,
  requireApiAdmin,
  requireClientAdmin,
  requireAnyAdmin,
  requireClientAccess,
  optionalAuth
}; 