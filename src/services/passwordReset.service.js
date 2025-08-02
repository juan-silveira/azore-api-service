const crypto = require('crypto');

// Função para obter os modelos inicializados
const getModels = () => {
  return global.models;
};

/**
 * Serviço para gerenciamento de recuperação de senha
 */
class PasswordResetService {
  /**
   * Inicializa o serviço
   */
  static async initialize() {
    try {
      const models = getModels();
      if (!models.PasswordReset) {
        console.log('⚠️ Modelo PasswordReset não encontrado, aguardando inicialização...');
        return;
      }
      
      console.log('✅ Serviço de recuperação de senha inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de recuperação de senha:', error);
      // Não lançar erro para não parar a inicialização
    }
  }

  /**
   * Solicita recuperação de senha para um client
   */
  static async requestClientReset(email, ipAddress = null, userAgent = null) {
    try {
      console.log('🔍 Iniciando requestClientReset para:', email);
      const models = getModels();
      console.log('🔍 Models disponíveis:', Object.keys(models));
      const { Client, PasswordReset } = models;
      console.log('🔍 Client model:', !!Client);
      console.log('🔍 PasswordReset model:', !!PasswordReset);

      // Verificar se o client existe
      const client = await Client.findByEmail(email);
      if (!client) {
        return {
          success: false,
          message: 'Email não encontrado no sistema'
        };
      }

      if (!client.isActive) {
        return {
          success: false,
          message: 'Conta inativa. Entre em contato com o suporte.'
        };
      }

      // Invalidar tokens anteriores
      await PasswordReset.invalidateByEmail(email);

      // Criar novo token de reset
      console.log('🔍 Criando token de reset para:', email);
      console.log('🔍 Modelo PasswordReset:', !!PasswordReset);
      console.log('🔍 Método create:', !!PasswordReset.create);
      
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutos
      
      console.log('🔍 Token gerado:', token.substring(0, 10) + '...');
      console.log('🔍 Token hash:', tokenHash.substring(0, 10) + '...');
      
      const passwordReset = await PasswordReset.create({
        email,
        token,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent
      });
      console.log('✅ Token criado:', passwordReset.id);

      // Em um ambiente real, aqui seria enviado um email
      // Por enquanto, retornamos o token para teste
      return {
        success: true,
        message: 'Token de recuperação gerado com sucesso',
        data: {
          token: passwordReset.token,
          expiresAt: passwordReset.expiresAt,
          // Em produção, não retornar o token - enviar por email
          _debug: {
            token: process.env.NODE_ENV === 'development' ? passwordReset.token : undefined
          }
        }
      };
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Valida um token de recuperação
   */
  static async validateToken(token) {
    try {
      const models = getModels();
      const { PasswordReset } = models;

      const passwordReset = await PasswordReset.findByToken(token);
      
      if (!passwordReset) {
        return {
          success: false,
          message: 'Token inválido ou expirado'
        };
      }

      if (passwordReset.isExpired()) {
        return {
          success: false,
          message: 'Token expirado'
        };
      }

      if (passwordReset.isUsed) {
        return {
          success: false,
          message: 'Token já foi utilizado'
        };
      }

      return {
        success: true,
        message: 'Token válido',
        data: {
          email: passwordReset.email,
          expiresAt: passwordReset.expiresAt
        }
      };
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Redefine a senha usando um token válido
   */
  static async resetPassword(token, newPassword) {
    try {
      const models = getModels();
      const { Client, PasswordReset } = models;

      // Validar token
      const passwordReset = await PasswordReset.findByToken(token);
      
      if (!passwordReset) {
        return {
          success: false,
          message: 'Token inválido ou expirado'
        };
      }

      if (passwordReset.isExpired()) {
        return {
          success: false,
          message: 'Token expirado'
        };
      }

      if (passwordReset.isUsed) {
        return {
          success: false,
          message: 'Token já foi utilizado'
        };
      }

      // Buscar o client
      const client = await Client.findByEmail(passwordReset.email);
      if (!client) {
        return {
          success: false,
          message: 'Client não encontrado'
        };
      }

      // Validar nova senha
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: 'Nova senha deve ter pelo menos 6 caracteres'
        };
      }

      // Atualizar senha do client
      client.password = newPassword;
      client.isFirstAccess = false;
      await client.save();

      // Marcar token como usado
      await PasswordReset.markAsUsed(passwordReset.id);

      return {
        success: true,
        message: 'Senha redefinida com sucesso',
        data: {
          email: client.email,
          isFirstAccess: false
        }
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Limpa tokens expirados
   */
  static async cleanupExpiredTokens() {
    try {
      const models = getModels();
      const { PasswordReset } = models;

      const sequelize = global.sequelize;
      const result = await PasswordReset.update(
        {
          isUsed: true,
          usedAt: new Date()
        },
        {
          where: {
            isUsed: false,
            expiresAt: {
              [sequelize.Sequelize.Op.lt]: new Date()
            }
          }
        }
      );

      console.log(`🧹 Limpeza de tokens: ${result[0]} tokens expirados marcados como usados`);
      
      return {
        success: true,
        message: 'Limpeza de tokens concluída',
        data: {
          cleanedCount: result[0]
        }
      };
    } catch (error) {
      console.error('Erro ao limpar tokens expirados:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Obtém estatísticas de tokens
   */
  static async getTokenStats() {
    try {
      console.log('🔍 Iniciando getTokenStats');
      const models = getModels();
      console.log('🔍 Models disponíveis:', Object.keys(models));
      const { PasswordReset } = models;
      console.log('🔍 PasswordReset model:', !!PasswordReset);
      console.log('🔍 PasswordReset.count:', !!PasswordReset?.count);

      // Contar todos os registros
      const total = await PasswordReset.count();
      
      // Contar registros usados
      const used = await PasswordReset.count({
        where: { isUsed: true }
      });
      
      // Contar registros não usados
      const unused = await PasswordReset.count({
        where: { isUsed: false }
      });

      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: {
          total: total,
          used: used,
          unused: unused
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }
}

module.exports = PasswordResetService; 