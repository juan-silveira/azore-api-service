const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Azore Blockchain API',
      version: '2.0.0',
      description: 'API para interação com a blockchain Azore - Gerenciamento de carteiras, contratos inteligentes e transações com sistema RBAC (Role-Based Access Control)\n\n## 🔐 Sistema de Roles\n\n- **API_ADMIN**: Administrador global da plataforma\n- **CLIENT_ADMIN**: Administrador de um client específico\n- **USER**: Usuário comum\n\n## 🆕 Novas Funcionalidades\n\n- Sistema de RBAC (API_ADMIN e CLIENT_ADMIN)\n- Gerenciamento de API Keys (gerar, revogar, editar)\n- Concessão de roles em contratos (MINTER, BURNER, TRANSFER)\n- Controle granular de acesso por role',
      contact: {
        name: 'Azore Blockchain Service',
        email: 'support@azore.technology'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8800',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key para autenticação de clientes'
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Session-Token',
          description: 'Token de sessão para autenticação'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            status: {
              type: 'integer',
              description: 'Código de status HTTP'
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do cliente'
            },
            name: {
              type: 'string',
              description: 'Nome do cliente'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente'
            },
            apiKey: {
              type: 'string',
              description: 'API Key do cliente'
            },
            applicationName: {
              type: 'string',
              description: 'Nome da aplicação associada à API Key'
            },
            isApiAdmin: {
              type: 'boolean',
              description: 'Indica se o cliente tem permissões de API_ADMIN'
            },
            isClientAdmin: {
              type: 'boolean',
              description: 'Indica se o cliente tem permissões de CLIENT_ADMIN'
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['API_ADMIN', 'CLIENT_ADMIN']
              },
              description: 'Lista de roles do cliente'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo do cliente'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da carteira'
            },
            publicAddress: {
              type: 'string',
              description: 'Endereço público da carteira'
            },
            externalSystemId: {
              type: 'string',
              description: 'ID do sistema externo'
            },
            clientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente proprietário'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo da carteira'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          }
        },
        SmartContract: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do contrato'
            },
            name: {
              type: 'string',
              description: 'Nome do contrato'
            },
            code: {
              type: 'string',
              description: 'Código do contrato (ex: AZE, cBRL)'
            },
            address: {
              type: 'string',
              description: 'Endereço do contrato na blockchain'
            },
            abi: {
              type: 'object',
              description: 'ABI do contrato'
            },
            contractType: {
              type: 'string',
              enum: ['token', 'other'],
              description: 'Tipo do contrato'
            },
            network: {
              type: 'string',
              enum: ['mainnet', 'testnet'],
              description: 'Rede do contrato'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo do contrato'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          }
        },
        RequestLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do log'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp da requisição'
            },
            method: {
              type: 'string',
              description: 'Método HTTP'
            },
            path: {
              type: 'string',
              description: 'Caminho da requisição'
            },
            statusCode: {
              type: 'integer',
              description: 'Código de status da resposta'
            },
            responseTime: {
              type: 'integer',
              description: 'Tempo de resposta em ms'
            },
            clientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente que fez a requisição'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da transação'
            },
            txHash: {
              type: 'string',
              description: 'Hash da transação'
            },
            fromAddress: {
              type: 'string',
              description: 'Endereço de origem'
            },
            toAddress: {
              type: 'string',
              description: 'Endereço de destino'
            },
            contractAddress: {
              type: 'string',
              description: 'Endereço do contrato (se aplicável)'
            },
            functionName: {
              type: 'string',
              description: 'Nome da função chamada'
            },
            args: {
              type: 'object',
              description: 'Argumentos da função'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'failed'],
              description: 'Status da transação'
            },
            gasUsed: {
              type: 'string',
              description: 'Gas utilizado'
            },
            gasPrice: {
              type: 'string',
              description: 'Preço do gas'
            },
            blockNumber: {
              type: 'integer',
              description: 'Número do bloco'
            },
            clientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          }
        },
        ApiKeyRequest: {
          type: 'object',
          properties: {
            applicationName: {
              type: 'string',
              description: 'Nome da aplicação para a API Key',
              example: 'Minha Aplicação'
            }
          },
          required: ['applicationName']
        },
        ApiKeyResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica se a operação foi bem-sucedida'
            },
            data: {
              type: 'object',
              properties: {
                apiKey: {
                  type: 'string',
                  description: 'Nova API Key gerada'
                },
                applicationName: {
                  type: 'string',
                  description: 'Nome da aplicação'
                },
                message: {
                  type: 'string',
                  description: 'Mensagem de sucesso'
                }
              }
            }
          }
        },
        RoleGrantRequest: {
          type: 'object',
          properties: {
            targetAddress: {
              type: 'string',
              description: 'Endereço que receberá a role',
              example: '0x1234567890123456789012345678901234567890'
            }
          },
          required: ['targetAddress']
        },
        RoleGrantResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica se a operação foi bem-sucedida'
            },
            data: {
              type: 'object',
              properties: {
                contractAddress: {
                  type: 'string',
                  description: 'Endereço do contrato'
                },
                targetAddress: {
                  type: 'string',
                  description: 'Endereço que recebeu a role'
                },
                role: {
                  type: 'string',
                  description: 'Role concedida (MINTER_ROLE, BURNER_ROLE, TRANSFER_ROLE)'
                },
                txHash: {
                  type: 'string',
                  description: 'Hash da transação'
                },
                message: {
                  type: 'string',
                  description: 'Mensagem de sucesso'
                }
              }
            }
          }
        },
        SessionInfo: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica se a operação foi bem-sucedida'
            },
            data: {
              type: 'object',
              properties: {
                client: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      description: 'ID do cliente'
                    },
                    name: {
                      type: 'string',
                      description: 'Nome do cliente'
                    },
                    email: {
                      type: 'string',
                      description: 'Email do cliente'
                    },
                    roles: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Roles do cliente'
                    },
                    isApiAdmin: {
                      type: 'boolean',
                      description: 'Indica se é API_ADMIN'
                    },
                    isClientAdmin: {
                      type: 'boolean',
                      description: 'Indica se é CLIENT_ADMIN'
                    }
                  }
                },
                sessionExpiresAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data de expiração da sessão'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de verificação de saúde da API'
      },
      {
        name: 'Authentication',
        description: 'Endpoints de autenticação e gerenciamento de sessões'
      },
      {
        name: 'API Keys',
        description: 'Gerenciamento de API Keys (apenas para API_ADMIN e CLIENT_ADMIN)'
      },
      {
        name: 'Admin',
        description: 'Rotas administrativas (apenas para API_ADMIN)'
      },
      {
        name: 'Clients',
        description: 'Gerenciamento de clientes'
      },
      {
        name: 'Users',
        description: 'Gerenciamento de usuários'
      },
      {
        name: 'Wallets',
        description: 'Gerenciamento de carteiras'
      },
      {
        name: 'Contracts',
        description: 'Gerenciamento de contratos inteligentes'
      },
      {
        name: 'Contract Roles',
        description: 'Concessão de roles em contratos (apenas para admin do contrato)'
      },
      {
        name: 'Tokens',
        description: 'Gerenciamento de tokens'
      },
      {
        name: 'Logs',
        description: 'Sistema de logs e auditoria'
      }
    ],
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 