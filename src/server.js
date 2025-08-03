const app = require('./app');

const databaseConfig = require('./config/database');
const ClientModel = require('./models/Client');
const UserModel = require('./models/User');

const SmartContractModel = require('./models/SmartContract');
const RequestLogModel = require('./models/RequestLog');
const TransactionModel = require('./models/Transaction');
const PasswordResetModel = require('./models/PasswordReset');
const ApiKeyModel = require('./models/ApiKey');
const StakeModel = require('./models/Stake');

// Importar serviços

const contractService = require('./services/contract.service');
const clientService = require('./services/client.service');
const userService = require('./services/user.service');
const logService = require('./services/log.service');
const adminService = require('./services/admin.service');
const passwordResetService = require('./services/passwordReset.service');
const tokenInitializerService = require('./services/tokenInitializer.service');
const tokenService = require('./services/token.service');
const stakeService = require('./services/stake.service');
const queueService = require('./services/queue.service');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Função para iniciar o servidor
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log('🚀 Azore Blockchain API Service iniciado com sucesso!');
      console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`🌍 Ambiente: ${NODE_ENV}`);
      console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Info: http://localhost:${PORT}/`);
      console.log(`   Test Connection: http://localhost:${PORT}/api/test/connection`);
      console.log(`   Network Info: http://localhost:${PORT}/api/test/network-info`);

      console.log('');
      console.log('🔗 Para testar a conexão com a blockchain:');
      console.log(`   curl http://localhost:${PORT}/api/test/connection`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Inicialização assíncrona do banco e servidor
(async () => {
  try {
    console.log('🔍 Inicializando conexão com o banco...');
    const sequelize = await databaseConfig.initialize();
    console.log('✅ Conexão estabelecida');
    console.log('🔍 Carregando modelos...');
    // Registrar modelos
    const models = {};
    models.Client = ClientModel(sequelize);
    models.User = UserModel(sequelize);
  
    models.SmartContract = SmartContractModel(sequelize);
    models.RequestLog = RequestLogModel(sequelize);
    models.Transaction = TransactionModel(sequelize);
    models.PasswordReset = PasswordResetModel(sequelize);
    models.ApiKey = ApiKeyModel(sequelize);
    models.Stake = StakeModel(sequelize);
    // Chamar associate
    Object.values(models).forEach(model => {
      if (model.associate) model.associate(models);
    });
    console.log('✅ Modelos carregados');
    console.log('🔍 Sincronizando banco de dados...');
    await sequelize.sync({ force: false });
    console.log('✅ Banco sincronizado');
    
    // Exportar modelos para uso global
    global.sequelize = sequelize;
    global.models = models;
    
    // Aguardar inicialização dos serviços
    console.log('🔍 Inicializando serviços...');
  
    await contractService.initialize();
    await clientService.initialize();
    await userService.init();
    await logService.initialize();
    await passwordResetService.initialize();
    await tokenService.initialize();
    await stakeService.initialize();
    await queueService.initialize();
    console.log('✅ Serviços inicializados com sucesso');
    
    // Inicializar client admin padrão (após os serviços)
    console.log('🔍 Inicializando client admin padrão...');
    await adminService.initializeDefaultAdmin();
    console.log('✅ Client admin inicializado');
    
    // Inicializar tokens padrão
    console.log('🔍 Inicializando tokens padrão...');
    tokenInitializerService.initialize(models.SmartContract);
    await tokenInitializerService.initializeDefaultTokens();
    console.log('✅ Tokens padrão inicializados');
    
    startServer();
  } catch (err) {
    console.error('❌ Erro na inicialização do banco:', err);
    process.exit(1);
  }
})();

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
}); 