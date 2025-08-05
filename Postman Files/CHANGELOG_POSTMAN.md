# 📝 Changelog - Arquivos Postman

## 🔄 **Mudanças na Versão 2.0.0**

### 📁 **02_Authentication_Sessions.postman_collection.json**

#### ✅ **Mudanças Implementadas**

1. **Nome da Collection**
   - **Antes**: "🔐 Autenticação e Sessões"
   - **Depois**: "🔐 Autenticação JWT"

2. **Versão**
   - **Antes**: 1.0.0
   - **Depois**: 2.0.0

3. **Variáveis de Ambiente**
   - **Removido**: `session_token`
   - **Adicionado**: `access_token`, `refresh_token`

4. **Headers de Autenticação**
   - **Antes**: `X-Session-Token: {{session_token}}`
   - **Depois**: `Authorization: Bearer {{access_token}}`

5. **Endpoints Atualizados**

   | Endpoint | Mudança |
   |----------|---------|
   | `POST /api/auth/login` | **PÚBLICO** - Não requer API Key (primeiro acesso) |
   | `POST /api/auth/logout` | `X-Session-Token` → `Authorization: Bearer` |
   | `GET /api/auth/session-info` | → `GET /api/auth/me` |
   | `POST /api/auth/refresh` | **NOVO** - Renovar access token |
   | `POST /api/auth/change-password` | `X-Session-Token` → `Authorization: Bearer` |
   | `POST /api/auth/generate-api-key` | `X-Session-Token` → `Authorization: Bearer` |
   | `GET /api/auth/api-keys` | `X-Session-Token` → `Authorization: Bearer` |
   | `POST /api/auth/api-keys/{id}/revoke` | `X-Session-Token` → `Authorization: Bearer` |
   | `PUT /api/auth/api-keys/{id}/edit` | `X-Session-Token` → `Authorization: Bearer` |

6. **Endpoints Removidos**
   - `POST /api/auth/session-timeout` (não existe mais no JWT)

7. **Scripts de Teste Atualizados**
   - **Login**: Salva `access_token` e `refresh_token`
   - **Refresh**: Salva novo `access_token`

### 📁 **03_Password_Reset.postman_collection.json**

#### ✅ **Mudanças Implementadas**

1. **Nome da Collection**
   - **Antes**: "🔑 Recuperação de Senha"
   - **Depois**: "🔑 Recuperação de Senha JWT"

2. **Versão**
   - **Antes**: 1.0.0
   - **Depois**: 2.0.0

3. **Variáveis de Ambiente**
   - **Adicionado**: `access_token`

4. **Headers de Autenticação**
   - **Admin endpoints**: `X-API-Key` → `Authorization: Bearer`

5. **Endpoints Atualizados**

   | Endpoint | Mudança |
   |----------|---------|
   | `POST /api/password-reset/request` | Adicionado header `X-API-Key` |
   | `POST /api/password-reset/cleanup` | `X-API-Key` → `Authorization: Bearer` |
   | `GET /api/password-reset/stats` | `X-API-Key` → `Authorization: Bearer` |

## 🔧 **Como Usar as Novas Collections**

### 1. **Configurar Variáveis de Ambiente**

No Postman Environment, configure:

```json
{
  "base_url": "http://localhost:8800",
  "email": "seu-email@exemplo.com",
  "password": "sua-senha",
  "api_key": "c6d51ad9d30280b77b67cce5e7bf5e4c59ba6d79447d9fcda74e303f6f09cbde",
  "access_token": "",
  "refresh_token": "",
  "api_key_name": "Minha API Key"
}
```

### 2. **Fluxo de Autenticação**

#### **Primeiro Acesso (Sem API Key)**
1. **Login público** → `POST /api/auth/login` (sem API Key)
2. **Receber tokens** → `access_token` e `refresh_token`
3. **Usar endpoints** → Com `Authorization: Bearer {{access_token}}`

#### **Acessos Subsequentes (Com API Key)**
1. **Login com API Key** → `POST /api/auth/login` (com `X-API-Key`)
2. **Ou renovar token** → `POST /api/auth/refresh`
3. **Usar endpoints** → Com `Authorization: Bearer {{access_token}}`
4. **Logout** → Invalida o token atual

### 3. **Exemplo de Uso**

#### **Primeiro Acesso (Sem API Key)**
```bash
# 1. Login público (sem API Key)
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ivan.alberton@navi.inf.br", "password": "N@vi@2025"}'

# 2. Usar access token
curl -X GET http://localhost:8800/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Acessos Subsequentes (Com API Key)**
```bash
# 1. Login com API Key
curl -X POST http://localhost:8800/api/auth/login \
  -H "X-API-Key: c6d51ad9d30280b77b67cce5e7bf5e4c59ba6d79447d9fcda74e303f6f09cbde" \
  -H "Content-Type: application/json" \
  -d '{"email": "ivan.alberton@navi.inf.br", "password": "N@vi@2025"}'

# 2. Renovar token
curl -X POST http://localhost:8800/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

## 📋 **Diferenças Principais**

### **Antes (Session Tokens)**
- Headers: `X-Session-Token`
- Sessões no banco de dados
- Timeout configurável
- Logout invalida sessão

### **Depois (JWT)**
- Headers: `Authorization: Bearer`
- Tokens stateless
- Access Token (15min) + Refresh Token (7d)
- Logout adiciona à blacklist

## 🎯 **Benefícios da Migração**

1. **Performance**: Tokens stateless (sem consulta ao banco)
2. **Escalabilidade**: Funciona em múltiplos servidores
3. **Segurança**: Tokens com expiração fixa
4. **Padrão**: JWT é o padrão da indústria
5. **Flexibilidade**: Refresh tokens para UX melhor

## ⚠️ **Notas Importantes**

1. **API Keys**: Mantidas para serviços externos
2. **JWT**: Para autenticação de usuários
3. **Refresh**: Automático no frontend
4. **Blacklist**: Implementar Redis em produção
5. **Secrets**: Trocar em produção

## 🔄 **Migração Gradual**

- ✅ Collections Postman atualizadas
- ✅ Backend JWT implementado
- 🔄 Frontend (próximo passo)
- 🔄 Documentação completa
- 🔄 Testes automatizados

## 📚 **Recursos Adicionais**

- [JWT Implementation Guide](./JWT_IMPLEMENTATION.md)
- [API Documentation](./API_Azore_Endpoints.md)
- [Swagger UI](http://localhost:8800/api-docs) 