// Função para obter o modelo User inicializado
const getUserModel = () => {
  return global.models.User;
};

// Função para obter o modelo ApiKey inicializado
const getApiKeyModel = () => {
  return global.models.ApiKey;
};

// Importar serviço JWT
const jwtService = require('../services/jwt.service');

/**
 * Login do usuário
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log(`🔐 Tentativa de login - Email: ${email}, IP: ${clientIP}, User-Agent: ${userAgent}`);

    // Validações básicas
    if (!email || !password) {
      console.log(`❌ Login falhou - Campos obrigatórios ausentes - Email: ${email}, IP: ${clientIP}`);
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`❌ Login falhou - Email inválido: ${email}, IP: ${clientIP}`);
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar tamanho da senha
    if (password.length < 6) {
      console.log(`❌ Login falhou - Senha muito curta - Email: ${email}, IP: ${clientIP}`);
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    const User = getUserModel();
    const user = await User.authenticate(email, password);
    
    if (!user) {
      console.log(`❌ Login falhou - Credenciais inválidas - Email: ${email}, IP: ${clientIP}`);
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    if (!user.isActive) {
      console.log(`❌ Login falhou - Usuário inativo - Email: ${email}, ID: ${user.id}, IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    // Buscar API Keys do usuário
    const ApiKey = getApiKeyModel();
    const apiKeys = await ApiKey.findAll({
      where: { userId: user.id, isActive: true },
      attributes: ['id', 'name', 'description', 'createdAt', 'lastUsedAt', 'expiresAt']
    });

    // Gerar tokens JWT
    const tokens = jwtService.generateTokenPair(user);

    // Log de sucesso do login
    console.log(`✅ Login realizado com sucesso - Email: ${email}, ID: ${user.id}, IP: ${clientIP}, Roles: ${user.roles.join(', ')}, API Keys: ${apiKeys.length}`);

    // Retornar dados da sessão
    const response = {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn,
        isFirstAccess: user.isFirstAccess,
        apiKeys: apiKeys,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          permissions: user.permissions,
          roles: user.roles,
          isApiAdmin: user.isApiAdmin,
          isClientAdmin: user.isClientAdmin
        }
      }
    };

    // Se é primeiro acesso, apenas alterar a mensagem
    if (user.isFirstAccess) {
      response.message = 'Primeiro acesso detectado. É necessário alterar a senha.';
      console.log(`⚠️ Primeiro acesso detectado - Email: ${email}, ID: ${user.id}, IP: ${clientIP}`);
    }

    res.json(response);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Logout do usuário
 */
const logout = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const userId = req.user?.id || 'unknown';
    const userEmail = req.user?.email || 'unknown';

    console.log(`🚪 Tentativa de logout - Email: ${userEmail}, ID: ${userId}, IP: ${clientIP}, User-Agent: ${userAgent}`);

    // Adicionar token à blacklist
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const blacklisted = await jwtService.blacklistToken(token);
      
      if (blacklisted) {
        console.log(`✅ Token adicionado à blacklist - Email: ${userEmail}, ID: ${userId}, IP: ${clientIP}`);
      } else {
        console.log(`⚠️ Falha ao adicionar token à blacklist - Email: ${userEmail}, ID: ${userId}, IP: ${clientIP}`);
      }
    } else {
      console.log(`⚠️ Logout sem token - Email: ${userEmail}, ID: ${userId}, IP: ${clientIP}`);
    }
    
    console.log(`✅ Logout realizado com sucesso - Email: ${userEmail}, ID: ${userId}, IP: ${clientIP}`);
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Alterar senha (primeiro acesso)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validações básicas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Validar tamanho da nova senha
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Validar se a nova senha é diferente da atual
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ser diferente da senha atual'
      });
    }

    // Validar complexidade da senha (opcional)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve conter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial'
      });
    }

    // Verificar senha atual
    const isValidPassword = await req.user.verifyPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual inválida'
      });
    }

    // Alterar senha
    req.user.password = newPassword;
    req.user.isFirstAccess = false;
    await req.user.save();

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Gerar API Key
 */
const generateApiKey = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validações básicas
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key é obrigatório'
      });
    }

    // Validar tamanho do nome
    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key deve ter entre 3 e 50 caracteres'
      });
    }

    // Validar formato do nome (apenas letras, números, espaços e hífens)
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key deve conter apenas letras, números, espaços, hífens e underscores'
      });
    }

    // Validar descrição se fornecida
    if (description && description.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Descrição deve ter no máximo 200 caracteres'
      });
    }

    const ApiKey = getApiKeyModel();
    const crypto = require('crypto');
    
    // Gerar nova API Key
    const apiKeyValue = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');
    
    // Criar registro da API Key
    const apiKey = await ApiKey.create({
      key: apiKeyValue,
      keyHash: apiKeyHash,
      name: name,
      description: description || null,
      userId: req.user.id,
      permissions: req.user.permissions || {}
    });
    
    res.json({
      success: true,
      message: 'API Key gerada com sucesso',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        apiKey: apiKeyValue, // Retornar apenas uma vez
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao gerar API Key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Listar API Keys do cliente
 */
const listApiKeys = async (req, res) => {
  try {
    const ApiKey = getApiKeyModel();
    
    const apiKeys = await ApiKey.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'name', 'description', 'isActive', 'createdAt', 'lastUsedAt', 'expiresAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      message: 'API Keys listadas com sucesso',
      data: {
        apiKeys: apiKeys
      }
    });
  } catch (error) {
    console.error('Erro ao listar API Keys:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Revogar API Key
 */
const revokeApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.params;
    
    if (!apiKeyId) {
      return res.status(400).json({
        success: false,
        message: 'ID da API Key é obrigatório'
      });
    }

    const ApiKey = getApiKeyModel();
    
    // Buscar API Key
    const apiKey = await ApiKey.findOne({
      where: { 
        id: apiKeyId, 
        userId: req.user.id 
      }
    });
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API Key não encontrada'
      });
    }

    // Desativar API Key
    await apiKey.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'API Key revogada com sucesso',
      data: {
        id: apiKey.id,
        name: apiKey.name
      }
    });
  } catch (error) {
    console.error('Erro ao revogar API Key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Editar API Key
 */
const editApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.params;
    const { name, description } = req.body;

    if (!apiKeyId) {
      return res.status(400).json({
        success: false,
        message: 'ID da API Key é obrigatório'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key é obrigatório'
      });
    }

    const ApiKey = getApiKeyModel();
    
    // Buscar API Key
    const apiKey = await ApiKey.findOne({
      where: { 
        id: apiKeyId, 
        userId: req.user.id 
      }
    });
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API Key não encontrada'
      });
    }

    // Atualizar API Key
    await apiKey.update({
      name: name,
      description: description || null
    });
    
    res.json({
      success: true,
      message: 'API Key editada com sucesso',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        updatedAt: apiKey.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao editar API Key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Configurar timeout da sessão
 */
const setSessionTimeout = async (req, res) => {
  try {
    const { timeout } = req.body;

    if (timeout === undefined || timeout < 0) {
      return res.status(400).json({
        success: false,
        message: 'Timeout deve ser um número maior ou igual a 0 (0 = sem expiração)'
      });
    }

    req.user.sessionTimeout = timeout;
    
    // Se timeout for 0, remover expiração atual
    if (timeout === 0) {
      req.user.sessionExpiresAt = null;
    } else if (req.user.sessionExpiresAt) {
      // Renovar sessão com novo timeout
      req.user.sessionExpiresAt = new Date(Date.now() + (timeout * 1000));
    }
    
    await req.user.save();

    res.json({
      success: true,
      message: 'Timeout da sessão configurado com sucesso',
      data: {
        timeout: req.user.sessionTimeout,
        expiresAt: req.user.sessionExpiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao configurar timeout da sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Renovar access token usando refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log(`🔄 Tentativa de refresh token - IP: ${clientIP}, User-Agent: ${userAgent}`);

    if (!refreshToken) {
      console.log(`❌ Refresh token falhou - Token não fornecido - IP: ${clientIP}`);
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }

    // Buscar usuário pelo refresh token
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    const User = getUserModel();
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      console.log(`❌ Refresh token falhou - Usuário não encontrado ou inativo - ID: ${decoded.id}, IP: ${clientIP}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Gerar novo access token
    const newAccessToken = jwtService.generateAccessToken(user);

    console.log(`✅ Refresh token realizado com sucesso - Email: ${user.email}, ID: ${user.id}, IP: ${clientIP}`);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: jwtService.getExpiryTime(jwtService.accessTokenExpiry)
      }
    });
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido ou expirado'
    });
  }
};

/**
 * Obter informações do usuário atual
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          permissions: user.permissions,
          roles: user.roles,
          isApiAdmin: user.isApiAdmin,
          isClientAdmin: user.isClientAdmin
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Testa a blacklist do Redis
 */
const testBlacklist = async (req, res) => {
  try {
    const redisService = require('../services/redis.service');
    
    // Testar conexão
    const connectionTest = await redisService.testConnection();
    
    // Obter estatísticas
    const stats = await redisService.getBlacklistStats();
    
    // Testar adicionar token à blacklist
    const testToken = 'test-token-' + Date.now();
    const added = await redisService.addToBlacklist(testToken, 60); // 60 segundos
    
    // Verificar se foi adicionado
    const isBlacklisted = await redisService.isBlacklisted(testToken);
    
    // Remover token de teste
    await redisService.removeFromBlacklist(testToken);
    
    res.json({
      success: true,
      message: 'Teste da blacklist realizado com sucesso',
      data: {
        connection: connectionTest,
        stats,
        testResults: {
          tokenAdded: added,
          isBlacklisted,
          tokenRemoved: true
        }
      }
    });
  } catch (error) {
    console.error('Erro no teste da blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste da blacklist',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  changePassword,
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  editApiKey,
  refreshToken,
  getCurrentUser,
  testBlacklist
}; 