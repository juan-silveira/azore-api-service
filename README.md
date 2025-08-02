# Azore Blockchain API Service v2.0

API para gerenciamento de blockchain, carteiras, contratos e transações na rede Azore com sistema RBAC (Role-Based Access Control).

## 🚀 Funcionalidades

- **Sistema RBAC**: Controle de acesso baseado em roles (API_ADMIN, CLIENT_ADMIN, USER)
- **Gestão de Clientes**: Criação e gerenciamento de clientes da API
- **Gestão de Usuários**: Criação e gerenciamento de usuários com chaves públicas/privadas
- **Gestão de Carteiras**: Criação, consulta e gerenciamento de carteiras blockchain
- **Transferência de AZE**: Transferência de tokens nativos AZE entre carteiras
- **Gestão de Contratos**: Registro e gerenciamento de contratos inteligentes
- **Administração de Tokens**: Sistema de roles para administração de tokens ERC20
- **Gerenciamento de API Keys**: Geração, revogação e edição de API Keys
- **Autenticação**: Sistema de API Keys com diferentes níveis de permissão
- **Auditoria**: Logs completos de todas as operações

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- PostgreSQL (via Docker)

## 🔧 Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd azore-api-service
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `env.example`:

```env
# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5433
DB_NAME=azore_blockchain_service
DB_USER=postgres
DB_PASSWORD=postgres123

# Configurações da API
PORT=8800
NODE_ENV=development

# Chave de Criptografia (gerar uma chave de 32 bytes)
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Chave Privada do Admin (para operações de sistema)
ADMIN_PRIVATE_KEY=0x0430d24bff8c003b8c619d533f1f1c8d5fac1cbbc24c07ee7f3f06de01ded28f

# Configurações Blockchain
TESTNET_RPC_URL=https://testnet-rpc.azore.com
MAINNET_RPC_URL=https://mainnet-rpc.azore.com

# Configurações de Segurança
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 3. Inicialize o banco de dados

```bash
# Iniciar os containers
docker-compose up -d

# Executar migrations
npx sequelize-cli db:migrate

# Verificar status das migrations
npx sequelize-cli db:migrate:status
```

### 4. Verificar a instalação

```bash
# Verificar se a API está funcionando
curl http://localhost:8800/health

# Verificar se o banco foi inicializado corretamente
PGPASSWORD=postgres123 psql -h localhost -p 5433 -U postgres -d azore_blockchain_service -c "SELECT name, email, is_api_admin, is_client_admin FROM clients WHERE name = 'Navi';"
PGPASSWORD=postgres123 psql -h localhost -p 5433 -U postgres -d azore_blockchain_service -c "SELECT name, email, public_key FROM users WHERE name = 'João Silva';"
```

## 🏃‍♂️ Como Executar

### Usando Docker (Recomendado)
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down
```

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Iniciar apenas o banco de dados
docker-compose up -d db

# Executar migrations
npx sequelize-cli db:migrate

# Iniciar a API
npm run dev
```

## 📚 Documentação da API

### Swagger UI
Acesse a documentação interativa em: http://localhost:8800/api-docs

### Postman Collection
Importe os arquivos:
- `Azore_Blockchain_API_Final.postman_collection.json` - Collection com todos os endpoints
- `Azore_Blockchain_API_Final.postman_environment.json` - Environment com variáveis pré-configuradas

## 🔐 Sistema RBAC (Role-Based Access Control)

A API v2.0 utiliza um sistema de controle de acesso baseado em roles com três níveis principais:

### 🏆 API_ADMIN
- **Descrição**: Administrador global da plataforma
- **Permissões**: Acesso total a todas as funcionalidades
- **Rotas**: Todas as rotas admin e de gerenciamento
- **Exemplo**: admin@navi.com

### 👨‍💼 CLIENT_ADMIN
- **Descrição**: Administrador de um client específico
- **Permissões**: Acesso limitado ao próprio client
- **Rotas**: Gerenciamento de API Keys, contratos próprios, usuários do client
- **Restrições**: Não pode acessar dados de outros clients

### 👤 USER
- **Descrição**: Usuário comum
- **Permissões**: Acesso limitado às próprias informações
- **Rotas**: Consultas básicas, sem gerenciamento de API Keys
- **Restrições**: Não pode acessar rotas administrativas

## 🔑 Autenticação

A API utiliza sistema de API Keys para autenticação:

### Client Admin "Navi"
- **Email**: admin@navi.com
- **Password**: azore@admin123
- **API Key**: navi_api_key_2024_complete_admin_full_access
- **Roles**: API_ADMIN, CLIENT_ADMIN
- **Permissões**: Acesso total ao sistema

### Client Admin "Coinage Trade"
- **Email**: admin@coinagetrade.com
- **Password**: azore@admin123
- **API Key**: coinage_api_key_2024_admin_full_access
- **Roles**: API_ADMIN, CLIENT_ADMIN
- **Permissões**: Acesso total ao sistema

### Usuários de Exemplo
- **João Silva**: joao.silva@navi.com (Admin do Navi)
- **Maria Santos**: maria.santos@navi.com (Usuário do Navi)
- **Pedro Costa**: pedro.costa@coinagetrade.com (Admin do Coinage Trade)

## 🌐 Endpoints Principais

### Health Check
- `GET /health` - Status da API

### Autenticação e Sessões
- `POST /api/auth/login` - Login do client
- `POST /api/auth/logout` - Logout do client
- `POST /api/auth/change-password` - Alterar senha
- `GET /api/auth/session-info` - Informações da sessão

### Gerenciamento de API Keys (RBAC)
- `POST /api/auth/generate-api-key` - Gerar nova API Key
- `POST /api/auth/revoke-api-key` - Revogar API Key
- `PUT /api/auth/edit-api-key` - Editar API Key

### Clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obter cliente

### Usuários
- `POST /api/users` - Criar usuário
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário
- `GET /api/users/public-key/:publicKey` - Buscar por public key

### Carteiras
- `POST /api/wallets` - Criar carteira
- `GET /api/wallets/:address` - Obter carteira
- `GET /api/wallets/:address/balance` - Consultar saldo
- `POST /api/wallets/:address/transfer-aze` - Transferir AZE

### Contratos
- `POST /api/contracts` - Registrar contrato
- `GET /api/contracts/:address` - Obter contrato
- `GET /api/contracts/:address/verify-admin` - Verificar admin
- `POST /api/contracts/:address/grant-admin-role` - Conceder role admin
- `PUT /api/contracts/:address/update-admin` - Atualizar admin

### Concessão de Roles em Contratos (RBAC)
- `POST /api/contracts/:address/grant-minter-role` - Conceder MINTER_ROLE
- `POST /api/contracts/:address/grant-burner-role` - Conceder BURNER_ROLE
- `POST /api/contracts/:address/grant-transfer-role` - Conceder TRANSFER_ROLE

### Admin (Apenas API_ADMIN)
- `POST /api/admin/contracts/:address/grant-admin-role` - Conceder role (sistema)
- `GET /api/admin/users` - Listar todos os usuários
- `GET /api/admin/clients` - Listar todos os clients
- `POST /api/admin/password-reset` - Reset de senha admin

## 🧪 Testes

```bash
# Testar a API manualmente
curl http://localhost:8800/health

# Testar login
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@navi.com", "password": "azore@admin123"}'

# Testar com API Key
curl -X GET http://localhost:8800/api/clients \
  -H "X-API-Key: navi_api_key_2024_complete_admin_full_access"
```

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações
├── controllers/     # Controladores da API
├── middleware/      # Middlewares
├── models/          # Modelos do banco de dados
├── routes/          # Rotas da API
├── services/        # Lógica de negócio
├── blockchain/      # Integração com blockchain
└── app.js          # Aplicação principal
```

## 🔒 Segurança

- **Sistema RBAC**: Controle de acesso baseado em roles
- **Criptografia**: Todas as chaves privadas são criptografadas no banco de dados
- **API Keys**: Sistema de autenticação por API Keys com hash SHA256
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Validação**: Validação de entrada em todos os endpoints
- **Auditoria**: Logs completos de todas as operações
- **Sessões**: Sistema de sessões com timeout configurável
- **Permissões**: Controle granular de permissões por client

## 🚀 Como Usar a API

### 1. Login e Autenticação

```bash
# Login para obter sessão
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@navi.com",
    "password": "azore@admin123"
  }'
```

### 2. Usar API Key

```bash
# Requisições com API Key
curl -X GET http://localhost:8800/api/clients \
  -H "X-API-Key: navi_api_key_2024_complete_admin_full_access"

# Gerar nova API Key (apenas CLIENT_ADMIN e API_ADMIN)
curl -X POST http://localhost:8800/api/auth/generate-api-key \
  -H "X-API-Key: navi_api_key_2024_complete_admin_full_access" \
  -H "Content-Type: application/json" \
  -d '{"applicationName": "Minha Aplicação"}'
```

### 3. Gerenciar Contratos

```bash
# Conceder MINTER_ROLE (apenas admin do contrato)
curl -X POST http://localhost:8800/api/contracts/0x123.../grant-minter-role \
  -H "X-API-Key: navi_api_key_2024_complete_admin_full_access" \
  -H "Content-Type: application/json" \
  -d '{"targetAddress": "0x456..."}'
```

### 4. Verificar Permissões

```bash
# Verificar informações da sessão
curl -X GET http://localhost:8800/api/auth/session-info \
  -H "X-Session-Token: seu_token_aqui"
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   ```bash
   docker-compose restart db
   ```

2. **API não inicia**
   ```bash
   docker-compose logs api
   ```

3. **Erro de permissão (403 Forbidden)**
   - Verifique se as API Keys estão corretas
   - Confirme se o client tem as permissões necessárias (API_ADMIN ou CLIENT_ADMIN)
   - Verifique se está usando a API Key correta para a operação

4. **Erro de autenticação (401 Unauthorized)**
   - Verifique se a API Key está sendo enviada no header `X-API-Key`
   - Confirme se a API Key não foi revogada
   - Verifique se a sessão não expirou (para rotas que usam `X-Session-Token`)

5. **Erro de blockchain**
   - Verifique se as URLs RPC estão corretas no `.env`
   - Confirme se a rede está acessível
   - Verifique se o contrato existe e você tem permissões de admin

6. **Migration falha**
   ```bash
   # Verificar status
   npx sequelize-cli db:migrate:status
   
   # Forçar execução
   npx sequelize-cli db:migrate --force
   ```

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação Swagger: http://localhost:8800/api-docs
- Logs da aplicação: `docker-compose logs api`
- Issues do projeto

## 📄 Licença

Este projeto está sob a licença MIT. 