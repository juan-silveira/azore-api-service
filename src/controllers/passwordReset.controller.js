const PasswordResetService = require('../services/passwordReset.service');

/**
 * Solicita recuperação de senha
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await PasswordResetService.requestClientReset(email, ipAddress, userAgent);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Valida um token de recuperação
 */
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    const result = await PasswordResetService.validateToken(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Redefine a senha usando um token válido
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha é obrigatória'
      });
    }

    const result = await PasswordResetService.resetPassword(token, newPassword);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Limpa tokens expirados (endpoint administrativo)
 */
const cleanupExpiredTokens = async (req, res) => {
  try {
    const result = await PasswordResetService.cleanupExpiredTokens();
    res.json(result);
  } catch (error) {
    console.error('Erro ao limpar tokens expirados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém estatísticas de tokens (endpoint administrativo)
 */
const getTokenStats = async (req, res) => {
  try {
    const result = await PasswordResetService.getTokenStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanupExpiredTokens,
  getTokenStats
}; 