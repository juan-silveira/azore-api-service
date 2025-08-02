// Função para obter o modelo User inicializado
const getUserModel = () => {
  return global.models.User;
};

/**
 * Middleware para autenticação por sessão
 */
const authenticateSession = async (req, res, next) => {
  try {
    const sessionToken = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
    
    console.log('🔍 Debug - Session Token:', sessionToken);
    console.log('🔍 Debug - Headers:', req.headers);
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Token de sessão não fornecido'
      });
    }

    const User = getUserModel();
    console.log('🔍 Debug - User Model:', !!User);
    const user = await User.findBySessionToken(sessionToken);
    console.log('🔍 Debug - User Found:', !!user);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token de sessão inválido'
      });
    }

    if (!user.isSessionValid()) {
      // Invalidar sessão expirada
      await user.invalidateSession();
      return res.status(401).json({
        success: false,
        message: 'Sessão expirada'
      });
    }

    // Renovar sessão se necessário
    if (user.sessionTimeout > 0) {
      await user.refreshSession();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação por sessão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar se é primeiro acesso
 */
const requirePasswordChange = async (req, res, next) => {
  try {
    if (req.user.isFirstAccess) {
      return res.status(403).json({
        success: false,
        message: 'Primeiro acesso detectado. É necessário alterar a senha antes de continuar.',
        requiresPasswordChange: true
      });
    }
    next();
  } catch (error) {
    console.error('Erro ao verificar primeiro acesso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar se tem API Key
 */
const requireApiKey = async (req, res, next) => {
  try {
    // Verificar se o usuário tem pelo menos uma API Key ativa
    const ApiKey = global.models.ApiKey;
    const apiKey = await ApiKey.findOne({
      where: { 
        userId: req.user.id, 
        isActive: true 
      }
    });
    
    if (!apiKey) {
      return res.status(403).json({
        success: false,
        message: 'API Key não configurada. É necessário gerar uma API Key antes de continuar.',
        requiresApiKey: true
      });
    }
    next();
  } catch (error) {
    console.error('Erro ao verificar API Key:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  authenticateSession,
  requirePasswordChange,
  requireApiKey
}; 