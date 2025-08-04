# 🚀 Postman Collections - Azore Blockchain API

## 📋 Visão Geral

Esta pasta contém **12 collections** do Postman organizadas por categoria, mais o arquivo de environment, para testar todos os **139 endpoints** da API Azore Blockchain.

## 📁 Arquivos Incluídos

### 🏥 Collections por Categoria:

1. **`01_Health_Check.postman_collection.json`** - Verificação de saúde da API (1 endpoint)
2. **`02_Authentication_Sessions.postman_collection.json`** - Autenticação e sessões (9 endpoints)
3. **`03_Password_Reset.postman_collection.json`** - Recuperação de senha (5 endpoints)
4. **`04_Queue_Management.postman_collection.json`** - Gerenciamento de fila (9 endpoints)
5. **`05_User_Management.postman_collection.json`** - Gerenciamento de usuários (15 endpoints)
6. **`06_Client_Management.postman_collection.json`** - Gerenciamento de cliente (12 endpoints)
7. **`07_Admin_Routes.postman_collection.json`** - Rotas administrativas (15 endpoints)
8. **`08_Blockchain_Test.postman_collection.json`** - Testes de blockchain (6 endpoints)
9. **`09_Contract_Management.postman_collection.json`** - Gerenciamento de contratos (8 endpoints)
10. **`10_Token_Management.postman_collection.json`** - Gerenciamento de tokens (12 endpoints) ⚡ **Comunicação Direta**
11. **`11_Stake_Management.postman_collection.json`** - Gerenciamento de stakes (28 endpoints) ⚡ **Comunicação Direta**
12. **`12_Log_System.postman_collection.json`** - Sistema de logs (15 endpoints)
13. **`13_Transaction_Management.postman_collection.json`** - Gerenciamento de transações (15 endpoints)

### 🔧 Environment:
- **`Azore.postman_environment.json`** - Environment com todas as variáveis configuradas

## 🔧 Configuração Inicial

### 1. Importar Collections e Environment

1. Abra o Postman
2. Clique em **"Import"** no canto superior esquerdo
3. Arraste todos os arquivos `.json` para a área de importação
4. Clique em **"Import"**

### 2. Configurar Environment

1. No seletor de environment (canto superior direito), selecione **"Azore API Environment"**
2. Clique em **"Edit"** (ícone de olho) para configurar as variáveis

### 3. Configurar Variáveis Principais

Configure estas variáveis essenciais:

```json
{
  "base_url": "http://localhost:8800",
  "api_key": "sua_api_key_aqui",
  "email": "seu_email@exemplo.com",
  "password": "sua_senha_aqui"
}
```

## 🎯 Como Usar

### ⚡ Comunicação Direta vs Fila

**Comunicação Direta** (sem fila):
- 🧪 **Blockchain Test** - Testes de conexão e consultas
- 🪙 **Token Management** - Operações de tokens
- 🪙 **Stake Management** - Operações de stakes
- 📄 **Contract Management** - Operações de contratos

**Com Fila** (enfileiramento):
- 🔄 **Queue Management** - Monitoramento de filas
- 📊 **Log System** - Consultas de logs

### Ordem Recomendada de Testes:

1. **🏥 Health Check** - Verificar se a API está funcionando
2. **🔐 Authentication** - Fazer login e obter session token
3. **🔑 Password Reset** - Testar recuperação de senha (se necessário)
4. **👥 User Management** - Gerenciar usuários
5. **🏢 Client Management** - Gerenciar clientes
6. **🔄 Queue Management** - Monitorar filas
7. **🪙 Token Management** - Gerenciar tokens ⚡ **Comunicação Direta**
8. **🪙 Stake Management** - Gerenciar stakes ⚡ **Comunicação Direta**
9. **📄 Contract Management** - Gerenciar contratos ⚡ **Comunicação Direta**
10. **🧪 Blockchain Test** - Testar conexão blockchain ⚡ **Comunicação Direta**
11. **👑 Admin Routes** - Rotas administrativas
12. **📊 Log System** - Consultar logs
13. **💳 Transaction Management** - Gerenciar transações

### 🔐 Autenticação

#### Para usar Session Token:
- Use o endpoint **"Login"** da collection de Authentication
- O token será automaticamente salvo no environment
- Outros endpoints usarão automaticamente o token

#### Para usar API Key:
- Configure a variável `api_key` no environment
- Endpoints administrativos requerem API Key

## 📊 Variáveis do Environment

### 🔧 Configuração Básica:
- `base_url` - URL base da API
- `api_key` - Chave da API para autenticação
- `session_token` - Token de sessão (preenchido automaticamente)

### 👤 Usuários e Clientes:
- `user_id` - ID do usuário para testes
- `client_id` - ID do cliente para testes
- `email` - Email para login e testes
- `password` - Senha para login

### 🪙 Blockchain e Tokens:
- `contract_address` - Endereço do contrato
- `token_address` - Endereço do token
- `wallet_address` - Endereço da carteira
- `amount` - Quantidade para transações (em ETH para stakes)
- `stake_contract_address` - Endereço do contrato de stake
- `user_address` - Endereço do usuário
- `admin_public_key` - Chave pública do admin

### 📅 Datas e Paginação:
- `start_date` - Data inicial para consultas
- `end_date` - Data final para consultas
- `page` - Página para paginação
- `limit` - Limite de itens por página

## 🧪 Testes Automáticos

Cada collection inclui:
- **Headers corretos** para cada endpoint
- **Body templates** com exemplos
- **Variáveis dinâmicas** que se atualizam automaticamente
- **Scripts de teste** para validação básica

## 🔍 Dicas de Uso

### Para Desenvolvedores:
1. Comece sempre pelo **Health Check**
2. Faça login antes de testar endpoints protegidos
3. Use as variáveis do environment para facilitar os testes
4. Verifique os logs após cada operação

### Para Administradores:
1. Use a collection **Admin Routes** para operações administrativas
2. Monitore as filas com **Queue Management**
3. Consulte logs com **Log System**
4. Gerencie stakes com **Stake Management**

### ⚠️ Notas Importantes:

#### 🪙 Stakes:
- **Valores em ETH**: Todos os valores de `amount` estão em ETH (não wei)
- **adminPublicKey**: Operações administrativas exigem `adminPublicKey` no body
- **Permissões**: `getAvailableRewardBalance` requer permissões de admin

#### 🧪 Testes:
- **Comunicação Direta**: Rotas de teste não passam pela fila
- **Resposta Imediata**: Consultas blockchain são processadas diretamente

## 🚨 Troubleshooting

### Problemas Comuns:

1. **Erro 401 (Unauthorized)**:
   - Verifique se o `api_key` está configurado
   - Faça login novamente para obter novo session token

2. **Erro 404 (Not Found)**:
   - Verifique se o `base_url` está correto
   - Confirme se a API está rodando

3. **Erro 429 (Too Many Requests)**:
   - Aguarde alguns segundos entre as requisições
   - Verifique os rate limits do cliente

4. **Variáveis não funcionando**:
   - Verifique se o environment está selecionado
   - Confirme se as variáveis estão configuradas corretamente

## 📚 Documentação Completa

Para detalhes completos de cada endpoint, consulte:
- **`API_Azore_Endpoints.md`** - Documentação completa da API
- **Swagger UI** - `/api-docs` na sua API

## 🎉 Pronto para Usar!

Agora você tem todas as **139 rotas** organizadas em **12 categorias** para testar completamente a API Azore Blockchain! 🚀 