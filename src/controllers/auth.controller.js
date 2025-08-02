// Função para obter o modelo User inicializado
const getUserModel = () => {
  return global.models.User;
};

// Função para obter o modelo ApiKey inicializado
const getApiKeyModel = () => {
  return global.models.ApiKey;
};

/**
 * Login do usuário
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const User = getUserModel();
    const user = await User.authenticate(email, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    // Criar nova sessão
    await user.createSession();

    // Buscar API Keys do usuário
    const ApiKey = getApiKeyModel();
    const apiKeys = await ApiKey.findAll({
      where: { userId: user.id, isActive: true },
      attributes: ['id', 'name', 'description', 'createdAt', 'lastUsedAt', 'expiresAt']
    });

    // Retornar dados da sessão
    const response = {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        sessionToken: user.sessionToken,
        expiresAt: user.sessionExpiresAt,
        timeout: user.sessionTimeout,
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
    await req.user.invalidateSession();
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
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

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
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
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key é obrigatório'
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
 * Obter informações da sessão
 */
const getSessionInfo = async (req, res) => {
  try {
    // Buscar API Keys do cliente
    const ApiKey = getApiKeyModel();
    const apiKeys = await ApiKey.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'name', 'description', 'isActive', 'createdAt', 'lastUsedAt', 'expiresAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      message: 'Informações da sessão obtidas com sucesso',
      data: {
        sessionToken: req.user.sessionToken,
        expiresAt: req.user.sessionExpiresAt,
        timeout: req.user.sessionTimeout,
        isFirstAccess: req.user.isFirstAccess,
        apiKeys: apiKeys,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          permissions: req.user.permissions,
          roles: req.user.roles,
          isApiAdmin: req.user.isApiAdmin,
          isClientAdmin: req.user.isClientAdmin
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações da sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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
  setSessionTimeout,
  getSessionInfo
}; 