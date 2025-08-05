# 📡 Eventos de Usuários - Documentação

## 🎯 Visão Geral

Este documento descreve todos os eventos de usuários implementados no sistema Azore API. Cada evento é disparado automaticamente quando uma ação específica é realizada e pode ser capturado por webhooks configurados.

## 📋 Lista de Eventos

### 1. **user.created**
**Disparado quando:** Um novo usuário é criado

**Payload:**
```json
{
  "event": "user.created",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER"],
    "isActive": true,
    "clientId": "uuid-do-cliente",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. **user.updated**
**Disparado quando:** Dados de um usuário são atualizados

**Payload:**
```json
{
  "event": "user.updated",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome Atualizado",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER", "CLIENT_ADMIN"],
    "isActive": true,
    "clientId": "uuid-do-cliente",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "changes": {
    "old": {
      "name": "Nome Antigo",
      "email": "email@exemplo.com",
      "cpf": "12345678901",
      "phone": "11999999999",
      "isActive": true,
      "roles": ["USER"]
    },
    "new": {
      "name": "Nome Atualizado",
      "email": "email@exemplo.com",
      "cpf": "12345678901",
      "phone": "11999999999",
      "isActive": true,
      "roles": ["USER", "CLIENT_ADMIN"]
    }
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. **user.deactivated**
**Disparado quando:** Um usuário é desativado

**Payload:**
```json
{
  "event": "user.deactivated",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER"],
    "isActive": false,
    "clientId": "uuid-do-cliente",
    "deactivatedAt": "2024-01-01T00:00:00.000Z"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. **user.activated**
**Disparado quando:** Um usuário é reativado

**Payload:**
```json
{
  "event": "user.activated",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER"],
    "isActive": true,
    "clientId": "uuid-do-cliente",
    "activatedAt": "2024-01-01T00:00:00.000Z"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. **user.api_admin_added**
**Disparado quando:** Um usuário recebe permissão de API Admin

**Payload:**
```json
{
  "event": "user.api_admin_added",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER", "API_ADMIN"],
    "isApiAdmin": true,
    "clientId": "uuid-do-cliente"
  },
  "adminUser": {
    "id": "uuid-do-admin",
    "name": "Nome do Admin",
    "email": "admin@exemplo.com"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6. **user.api_admin_removed**
**Disparado quando:** Um usuário perde permissão de API Admin

**Payload:**
```json
{
  "event": "user.api_admin_removed",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER"],
    "isApiAdmin": false,
    "clientId": "uuid-do-cliente"
  },
  "adminUser": {
    "id": "uuid-do-admin",
    "name": "Nome do Admin",
    "email": "admin@exemplo.com"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 7. **user.client_admin_added**
**Disparado quando:** Um usuário recebe permissão de Client Admin

**Payload:**
```json
{
  "event": "user.client_admin_added",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER", "CLIENT_ADMIN"],
    "isClientAdmin": true,
    "clientId": "uuid-do-cliente"
  },
  "adminUser": {
    "id": "uuid-do-admin",
    "name": "Nome do Admin",
    "email": "admin@exemplo.com"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 8. **user.client_admin_removed**
**Disparado quando:** Um usuário perde permissão de Client Admin

**Payload:**
```json
{
  "event": "user.client_admin_removed",
  "userId": "uuid-do-usuario",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",
    "publicKey": "0x...",
    "roles": ["USER"],
    "isClientAdmin": false,
    "clientId": "uuid-do-cliente"
  },
  "adminUser": {
    "id": "uuid-do-admin",
    "name": "Nome do Admin",
    "email": "admin@exemplo.com"
  },
  "clientId": "uuid-do-cliente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuração de Webhooks

### Exemplo de Configuração
```json
{
  "name": "Webhook Usuários",
  "url": "https://seu-servico.com/webhook",
  "events": [
    "user.created",
    "user.updated",
    "user.deactivated",
    "user.activated",
    "user.api_admin_added",
    "user.api_admin_removed",
    "user.client_admin_added",
    "user.client_admin_removed"
  ],
  "isActive": true,
  "clientId": "uuid-do-cliente"
}
```

### Headers Enviados
```
Content-Type: application/json
X-Webhook-Signature: sha256=...
X-Webhook-Event: user.created
X-Webhook-Timestamp: 1640995200
```

## 🚀 Implementação

### Localização dos Eventos
- **Arquivo:** `src/services/user.service.js`
- **Métodos com eventos:**
  - `createUser()` → `user.created`
  - `updateUser()` → `user.updated`
  - `deactivateUser()` → `user.deactivated`
  - `activateUser()` → `user.activated`
  - `addApiAdmin()` → `user.api_admin_added`
  - `removeApiAdmin()` → `user.api_admin_removed`
  - `addClientAdmin()` → `user.client_admin_added`
  - `removeClientAdmin()` → `user.client_admin_removed`

### Características dos Eventos
- ✅ **Assíncronos:** Não bloqueiam a resposta da API
- ✅ **Com logs:** Registram sucesso/falha no console
- ✅ **Com retry:** Sistema de retry automático
- ✅ **Com assinatura:** Headers de segurança incluídos
- ✅ **Filtrados por cliente:** Apenas webhooks do cliente específico

## 📊 Monitoramento

### Logs de Eventos
```
📡 Webhook user.created disparado: { success: true, triggered: 2, successful: 2, failed: 0 }
❌ Erro ao disparar webhook user.updated: Error: Connection timeout
```

### Métricas Disponíveis
- Total de eventos disparados
- Taxa de sucesso/falha
- Tempo de resposta dos webhooks
- Eventos por tipo
- Webhooks por cliente

## 🔒 Segurança

### Validação de Assinatura
```javascript
// Exemplo de validação no webhook receiver
const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Dados Sensíveis
- **Incluídos:** ID, nome, email, CPF, publicKey, roles, flags
- **Excluídos:** privateKey, senha, dados de autenticação
- **Opcionais:** Dados de contato (telefone, endereço)

## 🎯 Casos de Uso

### 1. **Sincronização de Dados**
- Atualizar sistemas externos quando usuários são criados/atualizados
- Manter listas de usuários sincronizadas

### 2. **Auditoria e Compliance**
- Registrar todas as mudanças de permissões
- Manter histórico de ativações/desativações

### 3. **Notificações**
- Enviar emails de boas-vindas para novos usuários
- Alertar sobre mudanças de permissões

### 4. **Integração com Sistemas Externos**
- Sincronizar com CRMs
- Atualizar dashboards de analytics
- Integrar com sistemas de SSO

## 📝 Notas Importantes

1. **Performance:** Eventos são disparados em background para não impactar a performance da API
2. **Idempotência:** Webhooks devem ser idempotentes para evitar duplicação
3. **Retry:** Sistema implementa retry automático com backoff exponencial
4. **Rate Limiting:** Webhooks respeitam rate limits configurados
5. **Timeout:** Timeout padrão de 30 segundos por webhook

## 🔄 Próximos Passos

- [ ] Implementar eventos para outras entidades (Client, Token, etc.)
- [ ] Adicionar dashboard de monitoramento de webhooks
- [ ] Implementar sistema de alertas para falhas
- [ ] Adicionar métricas detalhadas de performance 