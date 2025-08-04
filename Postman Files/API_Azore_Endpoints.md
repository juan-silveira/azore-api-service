# 📚 Documentação Completa da API Azore Blockchain

## 🏥 Health Check

### Verificação de Saúde da API
- **GET** `/health` - Status da API, uptime e informações do ambiente

---

## 🔐 Autenticação e Sessões

### Login e Sessão
- **POST** `/api/auth/login` - Login do client com email e senha
- **POST** `/api/auth/logout` - Logout e invalidação da sessão
- **GET** `/api/auth/session-info` - Informações da sessão atual
- **POST** `/api/auth/change-password` - Alterar senha (usado no primeiro acesso)
- **POST** `/api/auth/session-timeout` - Configurar timeout da sessão

### Recuperação de Senha
- **POST** `/api/password-reset/request` - Solicita recuperação de senha
- **GET** `/api/password-reset/validate/{token}` - Valida token de recuperação
- **POST** `/api/password-reset/reset/{token}` - Redefine senha usando token
- **POST** `/api/password-reset/cleanup` - Limpa tokens expirados (Admin)
- **GET** `/api/password-reset/stats` - Estatísticas de tokens (Admin)

### Gerenciamento de API Keys
- **POST** `/api/auth/generate-api-key` - Gerar nova API Key
- **GET** `/api/auth/api-keys` - Listar API Keys do client
- **POST** `/api/auth/api-keys/{apiKeyId}/revoke` - Revogar API Key
- **PUT** `/api/auth/api-keys/{apiKeyId}/edit` - Editar API Key

---

## 🔄 Gerenciamento de Fila

### Monitoramento de Filas (Admin)
- **GET** `/api/queue/stats` - Estatísticas das filas
- **GET** `/api/queue/jobs/{jobId}` - Status de job específico
- **GET** `/api/queue/jobs` - Jobs em processamento
- **GET** `/api/queue/jobs/failed` - Jobs que falharam
- **POST** `/api/queue/jobs/{jobId}/retry` - Retenta job falhado
- **POST** `/api/queue/cleanup` - Limpa jobs antigos
- **GET** `/api/queue/queues/{queueName}` - Informações detalhadas de fila
- **GET** `/api/queue/metrics` - Métricas de performance
- **GET** `/api/queue/queues/{queueName}/logs` - Logs de fila específica

> **Nota**: As rotas de teste (`/api/test/`) e tokens (`/api/tokens/`) agora fazem comunicação direta com a blockchain, sem passar pela fila.

---

## 👥 Gerenciamento de Usuários

### Operações Básicas
- **POST** `/api/users` - Criar novo usuário
- **GET** `/api/users` - Listar usuários com paginação
- **GET** `/api/users/{id}` - Obter usuário por ID
- **PUT** `/api/users/{id}` - Atualizar usuário
- **POST** `/api/users/{id}/deactivate` - Desativar usuário
- **POST** `/api/users/{id}/activate` - Reativar usuário

### Busca de Usuários
- **GET** `/api/users/email/{email}` - Buscar por email
- **GET** `/api/users/cpf/{cpf}` - Buscar por CPF
- **GET** `/api/users/address/{address}` - Buscar por endereço
- **GET** `/api/users/client/{clientId}` - Usuários de um client

### Saldos e Chaves
- **GET** `/api/users/address/{address}/balances` - Saldos de um usuário
- **GET** `/api/users/{userId}/keys` - Chaves públicas/privadas (Admin)
- **GET** `/api/users/{userId}/keys/client` - Chaves (Client)
- **GET** `/api/users/search/{type}/{value}/keys` - Busca por critérios

### Teste
- **GET** `/api/users/test/service` - Testar serviço de usuários

---

## 🏢 Gerenciamento de Cliente

### Operações Básicas
- **POST** `/api/clients` - Criar novo cliente (Admin)
- **GET** `/api/clients` - Listar clientes (Admin)
- **GET** `/api/clients/{id}` - Obter cliente por ID
- **PUT** `/api/clients/{id}` - Atualizar cliente (Admin)
- **POST** `/api/clients/{id}/deactivate` - Desativar cliente (Admin)
- **POST** `/api/clients/{id}/activate` - Reativar cliente (Admin)

### Configurações e Estatísticas
- **PUT** `/api/clients/{id}/rate-limits` - Atualizar rate limits (Admin)
- **GET** `/api/clients/{id}/usage-stats` - Estatísticas de uso
- **GET** `/api/clients/{id}/users` - Usuários de um cliente
- **GET** `/api/clients/{id}/users/stats` - Estatísticas dos usuários
- **GET** `/api/clients/{id}/requests/stats` - Estatísticas de requests

### Teste
- **GET** `/api/clients/test/service` - Testar serviço de clientes

---

## 👑 Rotas Admin

### Gerenciamento de Clientes (Admin)
- **GET** `/api/admin/clients` - Lista todos os clients
- **GET** `/api/admin/clients/{id}` - Obtém client por ID
- **POST** `/api/admin/clients` - Cria novo client
- **PUT** `/api/admin/clients/{id}` - Atualiza client
- **DELETE** `/api/admin/clients/{id}` - Desativa client
- **POST** `/api/admin/clients/{id}/activate` - Reativa client
- **GET** `/api/admin/clients/{id}/users` - Usuários de um client

### Gerenciamento de Usuários (Admin)
- **POST** `/api/admin/users` - Cria novo usuário
- **GET** `/api/admin/users` - Lista todos os usuários
- **GET** `/api/admin/users/{id}` - Obtém usuário por ID
- **GET** `/api/admin/users/email/{email}` - Obtém usuário por email
- **GET** `/api/admin/users/cpf/{cpf}` - Obtém usuário por CPF
- **GET** `/api/admin/users/{userId}/keys` - Chaves de usuário

### Controle de Permissões (Admin)
- **POST** `/api/admin/users/{userId}/add-api-admin` - Concede API_ADMIN
- **POST** `/api/admin/users/{userId}/remove-api-admin` - Remove API_ADMIN
- **POST** `/api/admin/users/{userId}/add-client-admin` - Concede CLIENT_ADMIN
- **POST** `/api/admin/users/{userId}/remove-client-admin` - Remove CLIENT_ADMIN

### Dashboard e Estatísticas (Admin)
- **GET** `/api/admin/dashboard/stats` - Estatísticas gerais do sistema
- **POST** `/api/admin/contracts/{address}/grant-admin-role` - Concede role admin

### Teste
- **GET** `/api/admin/test/service` - Testar serviços admin

---

## 🧪 Teste de Blockchain

### Conexão e Informações
- **GET** `/api/test/connection` - Testa conexão com blockchain
- **GET** `/api/test/network-info` - Informações da rede atual
- **GET** `/api/test/network` - Informações da rede blockchain

### Consultas Blockchain
- **GET** `/api/test/balance/{address}` - Consulta saldo de endereço
- **GET** `/api/test/block/{blockNumber}` - Informações de bloco
- **GET** `/api/test/transaction/{txHash}` - Informações de transação
- **GET** `/api/test/gas-price` - Preço atual do gás

---

## 📄 Gerenciamento de Contratos

### Validação e Implantação
- **POST** `/api/contracts/validate-abi` - Valida ABI
- **POST** `/api/contracts/deploy` - Implanta novo contrato

### Consultas de Contrato
- **GET** `/api/contracts/{address}/functions` - Funções do contrato
- **GET** `/api/contracts/{address}/events` - Eventos do contrato
- **POST** `/api/contracts/{address}/events/query` - Consulta eventos

### Operações de Escrita
- **POST** `/api/contracts/{address}/write` - Executa operação de escrita

### Gerenciamento de Roles
- **POST** `/api/contracts/{address}/grant-role` - Concede role
- **POST** `/api/contracts/{address}/has-role` - Verifica role
- **POST** `/api/contracts/{address}/revoke-role` - Revoga role

### Teste
- **GET** `/api/contracts/test/service` - Testar serviço de contratos

---

## 🪙 Gerenciamento de Tokens

### Consultas de Saldo
- **GET** `/api/tokens/balance` - Saldo de token ERC20
- **GET** `/api/tokens/balanceAZE` - Saldo da moeda nativa AZE

### Operações de Token
- **POST** `/api/tokens/mint` - Executa mint de token
- **POST** `/api/tokens/burn` - Executa burn de token
- **POST** `/api/tokens/transfer-gasless` - Transferência sem gás

### Registro e Informações
- **POST** `/api/tokens/register` - Registra/atualiza token
- **GET** `/api/tokens/{contractAddress}/info` - Informações do token
- **PUT** `/api/tokens/{contractAddress}/update-info` - Atualiza informações
- **GET** `/api/tokens` - Lista todos os tokens

### Ativação/Desativação
- **POST** `/api/tokens/{contractAddress}/deactivate` - Desativa token
- **POST** `/api/tokens/{contractAddress}/activate` - Ativa token

### Teste
- **GET** `/api/tokens/test/service` - Testar serviço de tokens

> **Comunicação Direta**: Todas as operações de tokens fazem comunicação direta com a blockchain, sem passar pela fila.

---

## 🧪 Testes de Blockchain

### Testes de Conexão
- **GET** `/api/test/connection` - Testa conexão com a blockchain
- **GET** `/api/test/network-info` - Informações da rede
- **GET** `/api/test/network` - Detalhes da rede atual

### Consultas de Blockchain
- **GET** `/api/test/balance/{address}` - Saldo de endereço
- **GET** `/api/test/block/{blockNumber}` - Informações do bloco
- **GET** `/api/test/transaction/{txHash}` - Detalhes da transação
- **GET** `/api/test/gas-price` - Preço do gás atual

### Consultas Avançadas
- **GET** `/api/test/blockchain/connection` - Teste de conexão blockchain
- **GET** `/api/test/blockchain/network-info` - Info da rede blockchain
- **GET** `/api/test/blockchain/latest-block` - Último bloco
- **GET** `/api/test/blockchain/blocks/{blockNumber}` - Bloco específico
- **GET** `/api/test/blockchain/transactions/{transactionHash}` - Transação específica
- **GET** `/api/test/blockchain/wallets/{walletAddress}/balance` - Saldo da carteira

### Consultas Alternativas
- **GET** `/api/test/blocks/{blockNumber}` - Bloco (formato alternativo)
- **GET** `/api/test/transactions/{transactionHash}` - Transação (formato alternativo)
- **GET** `/api/test/wallets/{walletAddress}/balance` - Saldo (formato alternativo)
- **GET** `/api/test/transactions/{transactionHash}/details` - Detalhes da transação
- **GET** `/api/test/blocks/{blockNumber}/details` - Detalhes do bloco
- **POST** `/api/test/wallets/balances` - Múltiplos saldos

> **Comunicação Direta**: Todas as rotas de teste fazem comunicação direta com a blockchain, sem passar pela fila.

---

## 🪙 Gerenciamento de Stakes

### Registro e Informações
- **POST** `/api/stakes/register` - Registra novo stake
- **GET** `/api/stakes/{address}/info` - Informações do stake
- **GET** `/api/stakes` - Lista todos os stakes

### Operações de Investimento
- **POST** `/api/stakes/{address}/invest` - Investir token (stake)
- **POST** `/api/stakes/{address}/withdraw` - Retirar investimento (unstake)
- **POST** `/api/stakes/{address}/claim-rewards` - Resgatar recompensas
- **POST** `/api/stakes/{address}/compound` - Reinvestir recompensas

> **Nota**: Todos os valores de `amount` estão em **ETH** e são automaticamente convertidos para wei.

### Operações Administrativas (Admin do Stake)
- **POST** `/api/stakes/{address}/deposit-rewards` - Depositar recompensas
- **POST** `/api/stakes/{address}/distribute-rewards` - Distribuir recompensas
- **POST** `/api/stakes/{address}/withdraw-reward-tokens` - Retirar recompensas
- **POST** `/api/stakes/{address}/set-cycle-duration` - Definir duração do ciclo
- **POST** `/api/stakes/{address}/set-allow-restake` - Permitir/Bloquear reinvestir
- **POST** `/api/stakes/{address}/remove-from-blacklist` - Remover da blacklist
- **POST** `/api/stakes/{address}/set-staking-blocked` - Bloquear novos investimentos
- **POST** `/api/stakes/{address}/set-timelock` - Definir tempo de carência
- **POST** `/api/stakes/{address}/set-allow-partial-withdrawal` - Permitir retiradas parciais
- **POST** `/api/stakes/{address}/update-min-value-stake` - Definir valor mínimo
- **POST** `/api/stakes/{address}/add-to-whitelist` - Adicionar na whitelist
- **POST** `/api/stakes/{address}/remove-from-whitelist` - Remover da whitelist
- **POST** `/api/stakes/{address}/set-whitelist-enabled` - Ativar/Desativar whitelist

> **Nota**: As operações administrativas exigem o parâmetro `adminPublicKey` no body da requisição para verificação de permissões.

### Consultas de Stake
- **GET** `/api/stakes/{address}/available-reward-balance` - Saldo do cofre (requer permissões de admin)
- **GET** `/api/stakes/{address}/total-staked-supply` - Total investido
- **GET** `/api/stakes/{address}/number-of-active-users` - Total de investidores
- **GET** `/api/stakes/{address}/total-reward-distributed` - Total de recompensas
- **GET** `/api/stakes/{address}/is-restake-allowed` - Permissão de reinvestir
- **POST** `/api/stakes/{address}/blacklist-status` - Status da blacklist
- **POST** `/api/stakes/{address}/total-stake-balance` - Total investido por usuário
- **GET** `/api/stakes/{address}/whitelisted-addresses` - Lista da whitelist
- **POST** `/api/stakes/{address}/pending-reward` - Recompensas pendentes

### Teste
- **GET** `/api/stakes/test/service` - Testar serviço de stakes

---

## 📊 Sistema de Logs

### Logs de Requisições
- **GET** `/api/logs/requests` - Lista logs de requisições
- **GET** `/api/logs/me/requests` - Logs do cliente autenticado
- **GET** `/api/logs/users/{userId}/requests` - Logs de usuário específico

### Logs de Transações
- **GET** `/api/logs/transactions` - Lista transações
- **GET** `/api/logs/transactions/pending` - Transações pendentes
- **GET** `/api/logs/transactions/{txHash}` - Transação por hash
- **PUT** `/api/logs/transactions/{transactionId}/status` - Atualiza status
- **GET** `/api/logs/me/transactions` - Transações do cliente autenticado
- **GET** `/api/logs/users/{userId}/transactions` - Transações de usuário

### Estatísticas e Relatórios
- **GET** `/api/logs/stats` - Estatísticas de logs
- **GET** `/api/logs/me/stats` - Estatísticas do cliente autenticado
- **GET** `/api/logs/users/{userId}/stats` - Estatísticas de usuário
- **GET** `/api/logs/errors` - Logs de erro
- **GET** `/api/logs/export` - Exporta logs

### Manutenção
- **POST** `/api/logs/cleanup` - Limpa logs antigos

### Teste
- **GET** `/api/logs/test/service` - Testar serviço de logs

---



## 🔄 Sistema de Transações

### Consultas de Transações
- **GET** `/api/transactions` - Transações do cliente
- **GET** `/api/transactions/{txHash}` - Transação por hash

### Estatísticas
- **GET** `/api/transactions/stats/overview` - Estatísticas gerais
- **GET** `/api/transactions/stats/status` - Estatísticas por status
- **GET** `/api/transactions/stats/type` - Estatísticas por tipo

### Sistema de Fila
- **POST** `/api/transactions/enqueue` - Enfileira transação
- **GET** `/api/transactions/queue/{jobId}` - Status de transação enfileirada
- **POST** `/api/transactions/queue/batch` - Status de múltiplas transações

### Teste
- **GET** `/api/transactions/test` - Testar serviço de transações

---

## 🔐 Autenticação e Autorização

### Tipos de Autenticação
- **API Key**: `X-API-Key` header para autenticação de clientes
- **Session Token**: `X-Session-Token` header para sessões de usuário

### Roles e Permissões
- **API_ADMIN**: Administrador global da plataforma
- **CLIENT_ADMIN**: Administrador de um client específico
- **USER**: Usuário comum

### Rate Limiting
- **Transações Blockchain**: 10 por minuto por cliente
- **API Calls Gerais**: 100 por 15 minutos por cliente
- **Login**: 5 tentativas por 15 minutos por IP
- **API Keys**: 3 por hora por cliente

---

## 📋 Resumo de Endpoints por Categoria

| Categoria | Quantidade | Principais Funcionalidades |
|-----------|------------|---------------------------|
| 🏥 Health Check | 1 | Verificação de saúde da API |
| 🔐 Autenticação e Sessões | 12 | Login, logout, recuperação de senha, API Keys |
| 🔄 Gerenciamento de Fila | 9 | Monitoramento e controle de filas RabbitMQ |
| 👥 Gerenciamento de Usuários | 15 | CRUD de usuários, busca, saldos, chaves |
| 🏢 Gerenciamento de Cliente | 10 | CRUD de clientes, estatísticas, configurações |
| 👑 Rotas Admin | 15 | Gerenciamento global, permissões, dashboard |
| 🧪 Teste de Blockchain | 6 | Conexão, consultas, informações da rede |
| 📄 Gerenciamento de Contratos | 8 | Validação, implantação, operações, roles |
| 🪙 Gerenciamento de Tokens | 12 | Saldos, mint/burn, transferências, registro |
| 🪙 Gerenciamento de Stakes | 28 | Investimentos, recompensas, administração, consultas |
| 📊 Sistema de Logs | 15 | Logs de requisições, transações, estatísticas |
| 🔄 Sistema de Transações | 8 | Consultas, estatísticas, fila de transações |

**Total: 139 endpoints**

---

## 📖 Informações Adicionais

### Base URL
- **Desenvolvimento**: `http://localhost:8800`
- **Produção**: Configurável via variável de ambiente

### Documentação Interativa
- **Swagger UI**: `/api-docs`
- **OpenAPI Spec**: Disponível via Swagger

### Códigos de Status
- **200**: Sucesso
- **201**: Criado
- **400**: Dados inválidos
- **401**: Não autorizado
- **403**: Acesso negado
- **404**: Não encontrado
- **429**: Rate limit excedido
- **500**: Erro interno

### Exemplos de Uso
Consulte o Swagger `/api-docs` para exemplos detalhados de requisições e respostas para cada endpoint.

---

> **💡 Dica:** Consulte o Swagger `/api-docs` para detalhes de cada campo, exemplos de resposta e autenticação.