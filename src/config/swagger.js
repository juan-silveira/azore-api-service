const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Azore Blockchain API',
      version: '2.1.0',
      description: 'API para interação com a blockchain Azore - Gerenciamento de usuários, contratos inteligentes, stakes, tokens e transações com sistema RBAC (Role-Based Access Control) e sistema de fila RabbitMQ para processamento assíncrono de transações blockchain.\n\n## 🔐 Sistema de Roles\n\n- **API_ADMIN**: Administrador global da plataforma\n- **CLIENT_ADMIN**: Administrador de um client específico\n- **USER**: Usuário comum\n\n## 🆕 Funcionalidades Principais\n\n- Sistema de RBAC (API_ADMIN e CLIENT_ADMIN)\n- Sistema de Fila RabbitMQ para transações blockchain\n- Rate Limiting inteligente por tipo de operação\n- Gerenciamento de API Keys (gerar, revogar, editar)\n- Concessão de roles em contratos (MINTER, BURNER, TRANSFER)\n- Controle granular de acesso por role\n- Monitoramento de filas em tempo real\n- **Sistema de Staking**: Gerenciamento completo de contratos de staking (28 endpoints)\n- **Sistema de Tokens**: Mint, burn, transferências e consultas\n- **Sistema de Logs**: Monitoramento completo de requisições e transações\n\n## ⚠️ Rate Limiting\n\n- **Transações Blockchain**: 10 por minuto por cliente\n- **API Calls Gerais**: 100 por 15 minutos por cliente\n- **Login**: 5 tentativas por 15 minutos por IP\n- **API Keys**: 3 por hora por cliente\n\n## 📊 Total de Endpoints: 139',
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
        RateLimitError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro de rate limit'
            },
            data: {
              type: 'object',
              properties: {
                limit: {
                  type: 'integer',
                  description: 'Limite de requisições'
                },
                remaining: {
                  type: 'integer',
                  description: 'Requisições restantes'
                },
                resetTime: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data/hora de reset do rate limit'
                },
                timeUntilReset: {
                  type: 'integer',
                  description: 'Segundos até o reset'
                },
                retryAfter: {
                  type: 'integer',
                  description: 'Segundos para aguardar antes de tentar novamente'
                }
              }
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
        QueueJob: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do job'
            },
            status: {
              type: 'string',
              enum: ['queued', 'processing', 'completed', 'failed'],
              description: 'Status do job'
            },
            type: {
              type: 'string',
              description: 'Tipo da transação'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de criação'
            },
            estimatedProcessingTime: {
              type: 'string',
              description: 'Tempo estimado de processamento'
            },
            rateLimit: {
              type: 'object',
              properties: {
                limit: {
                  type: 'integer',
                  description: 'Limite de requisições'
                },
                remaining: {
                  type: 'integer',
                  description: 'Requisições restantes'
                },
                resetTime: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Data/hora de reset'
                }
              }
            }
          }
        },
        QueueStats: {
          type: 'object',
          properties: {
            totalJobs: {
              type: 'integer',
              description: 'Total de jobs'
            },
            completedJobs: {
              type: 'integer',
              description: 'Jobs completados'
            },
            failedJobs: {
              type: 'integer',
              description: 'Jobs que falharam'
            },
            processingJobs: {
              type: 'integer',
              description: 'Jobs em processamento'
            },
            queuedJobs: {
              type: 'integer',
              description: 'Jobs enfileirados'
            },
            averageProcessingTime: {
              type: 'number',
              description: 'Tempo médio de processamento em segundos'
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
        },
        Stake: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do stake'
            },
            name: {
              type: 'string',
              description: 'Nome do stake'
            },
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Endereço do contrato de stake'
            },
            abi: {
              type: 'array',
              description: 'ABI do contrato'
            },
            network: {
              type: 'string',
              enum: ['mainnet', 'testnet'],
              description: 'Rede do contrato'
            },
            contractType: {
              type: 'string',
              description: 'Tipo do contrato (STAKE)'
            },
            adminPublicKey: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'PublicKey do usuário admin do stake'
            },
            metadata: {
              type: 'object',
              description: 'Metadados adicionais (stakeToken, rewardToken, minStake, etc.)'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo do stake'
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
        StakeInfo: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Endereço do contrato de stake'
            },
            stakeToken: {
              type: 'string',
              description: 'Endereço do token de stake'
            },
            rewardToken: {
              type: 'string',
              description: 'Endereço do token de recompensa'
            },
            minStake: {
              type: 'string',
              description: 'Valor mínimo para stake em ether'
            },
            network: {
              type: 'string',
              description: 'Rede do contrato'
            },
            contractType: {
              type: 'string',
              description: 'Tipo do contrato'
            },
            metadata: {
              type: 'object',
              description: 'Metadados adicionais'
            },
            adminPublicKey: {
              type: 'string',
              description: 'PublicKey do admin do stake'
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
        name: 'Stake Management',
        description: 'Gerenciamento de contratos de staking'
      },
      {
        name: 'Stake Operations',
        description: 'Operações de investimento e retirada em stakes'
      },
      {
        name: 'Stake Admin',
        description: 'Operações administrativas de stakes (apenas para admin do stake)'
      },
      {
        name: 'Stake Queries',
        description: 'Consultas de informações de stakes'
      },
      {
        name: 'Transactions',
        description: 'Sistema de fila para transações blockchain'
      },
      {
        name: 'Queue',
        description: 'Monitoramento e gerenciamento de filas RabbitMQ (apenas para API_ADMIN)'
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