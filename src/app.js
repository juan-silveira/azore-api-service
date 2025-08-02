const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Importar configuração do Swagger
const swaggerSpecs = require('./config/swagger');

// Importar rotas
const testRoutes = require('./routes/test.routes');

const contractRoutes = require('./routes/contract.routes');
const tokenRoutes = require('./routes/token.routes');
const clientRoutes = require('./routes/client.routes');
const logRoutes = require('./routes/log.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const passwordResetRoutes = require('./routes/passwordReset.routes');
const transactionRoutes = require('./routes/transaction.routes');
const queueRoutes = require('./routes/queue.routes');

// Importar serviços
const contractService = require('./services/contract.service');
const clientService = require('./services/client.service');
const logService = require('./services/log.service');

// Importar middlewares
const { 
  authenticateApiKey, 
  checkPermission, 
  checkNetworkAccess, 
  checkUsageLimits,
  addUserInfo,
  logAuthenticatedRequest 
} = require('./middleware/auth.middleware');
const { 
  requireApiAdmin, 
  requireClientAdmin, 
  requireAnyAdmin,
  addUserInfo: addAdminUserInfo,
  logAdminRequest 
} = require('./middleware/admin.middleware');
const { 
  apiRateLimiter, 
  transactionRateLimiter, 
  loginRateLimiter,
  apiKeyRateLimiter,
  getRateLimitStats 
} = require('./middleware/rateLimit.middleware');
const { 
  requestLogger, 
  transactionLogger, 
  errorLogger, 
  performanceLogger 
} = require('./middleware/logging.middleware');

// Removidas todas as referências a databaseConfig e modelos do app.js

// Criar aplicação Express
const app = express();

// Middlewares de segurança
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-Token']
}));

// Middleware de logging personalizado (antes do morgan)
app.use(requestLogger);
app.use(performanceLogger);

// Middleware de logging padrão
app.use(morgan('combined'));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Azore Blockchain API Service',
    version: '1.0.0',
    description: 'Microserviço para abstrair a complexidade da blockchain Azore',
    endpoints: {
      health: '/health',
      test: '/api/test',
      docs: '/api-docs',
      swagger: '/api-docs'
    }
  });
});

// Configuração do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Azore Blockchain API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true
  }
}));

// Removida inicialização assíncrona dos serviços do app.js

// Rotas públicas (sem autenticação)
app.use('/api/test', testRoutes);
app.use('/api/clients', clientRoutes);

// Rotas de autenticação (públicas)
app.use('/api/auth', authRoutes);

// Rotas de recuperação de senha (públicas)
app.use('/api/password-reset', passwordResetRoutes);

// Rotas de usuários (com autenticação)
app.use('/api/users', authenticateApiKey, apiRateLimiter, addUserInfo, logAuthenticatedRequest, userRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/api/contracts', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, transactionLogger, contractRoutes);
// Middleware de autenticação para rotas protegidas
app.use('/api/tokens', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, transactionLogger, tokenRoutes);

// Rotas de transações (com autenticação)
app.use('/api/transactions', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, transactionRoutes);

// Rotas de logs (com autenticação)
app.use('/api/logs', authenticateApiKey, apiRateLimiter, addUserInfo, logAuthenticatedRequest, logRoutes);

// Rotas de fila (com autenticação admin)
app.use('/api/queue', queueRoutes);

// Rotas admin (com autenticação admin)
app.use('/api/admin', authenticateApiKey, requireApiAdmin, apiRateLimiter, addAdminUserInfo, logAdminRequest, adminRoutes);

// Middleware de tratamento de erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de tratamento de erros global (com logging)
app.use(errorLogger);

module.exports = app; 