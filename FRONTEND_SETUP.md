# 🎨 Setup do Frontend Next.js

## 🚀 Criação do Projeto

### 1. Criar Projeto Next.js
```bash
# Na pasta raiz do projeto
mkdir frontend
cd frontend

# Criar projeto Next.js com TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Instalar dependências adicionais
npm install react-bootstrap bootstrap @tanstack/react-query axios zustand react-hook-form @hookform/resolvers zod react-hot-toast
npm install -D @types/node @types/react @types/react-dom
```

### 2. Configurar Bootstrap
```bash
# Instalar Bootstrap
npm install bootstrap @popperjs/core
```

### 3. Configurar arquivo `src/app/globals.css`
```css
@import 'bootstrap/dist/css/bootstrap.min.css';

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

### 4. Configurar Bootstrap JS
```bash
# Criar arquivo src/lib/bootstrap.js
```

```javascript
// src/lib/bootstrap.js
'use client';

import { useEffect } from 'react';

export default function BootstrapJS() {
  useEffect(() => {
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
  
  return null;
}
```

### 5. Adicionar Bootstrap ao layout
```typescript
// src/app/layout.tsx
import BootstrapJS from '@/lib/bootstrap';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <BootstrapJS />
      </body>
    </html>
  );
}
```

## 🏗️ Estrutura de Pastas

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── tokens/
│   │   │   ├── transactions/
│   │   │   ├── webhooks/
│   │   │   └── documents/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── UserForm.tsx
│   │   │   └── WebhookForm.tsx
│   │   └── dashboard/
│   │       ├── StatsCard.tsx
│   │       ├── RecentTransactions.tsx
│   │       └── WebhookList.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useWebhooks.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── webhookStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── webhookService.ts
│   │   └── documentService.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── webhook.ts
│   │   └── document.ts
│   └── lib/
│       ├── bootstrap.js
│       ├── utils.ts
│       └── constants.ts
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Configurações

### 1. TypeScript (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. Next.js (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-minio-domain.com'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8800',
  },
}

module.exports = nextConfig
```

### 3. Tailwind (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

## 🎯 Componentes Principais

### 1. Store de Autenticação (`src/stores/authStore.ts`)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 2. Cliente API (`src/services/api.ts`)
```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800',
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Hook de API (`src/hooks/useApi.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const useApi = () => {
  const queryClient = useQueryClient();

  const get = (key: string[], url: string, options = {}) => {
    return useQuery({
      queryKey: key,
      queryFn: async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erro na requisição');
        }
        return response.json();
      },
      ...options,
    });
  };

  const post = (url: string, options = {}) => {
    return useMutation({
      mutationFn: async (data: any) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error('Erro na requisição');
        }
        return response.json();
      },
      onSuccess: () => {
        toast.success('Operação realizada com sucesso!');
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error('Erro na operação');
        console.error(error);
      },
      ...options,
    });
  };

  return { get, post };
};
```

## 🎨 Componentes UI

### 1. Card de Estatísticas (`src/components/dashboard/StatsCard.tsx`)
```typescript
import { Card } from 'react-bootstrap';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
}

export default function StatsCard({ title, value, icon, color, change }: StatsCardProps) {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-muted mb-2">{title}</h6>
            <h3 className="mb-0">{value}</h3>
            {change && (
              <small className={`text-${change.startsWith('+') ? 'success' : 'danger'}`}>
                {change}
              </small>
            )}
          </div>
          <div className={`text-${color} fs-1`}>
            <i className={`bi bi-${icon}`}></i>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
```

### 2. Formulário de Login (`src/components/forms/LoginForm.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }

      const result = await response.json();
      login(result.user, result.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          {...register('email')}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Senha</Form.Label>
        <Form.Control
          type="password"
          {...register('password')}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.password?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100"
        disabled={isLoading}
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </Form>
  );
}
```

## 🚀 Scripts de Desenvolvimento

### 1. Adicionar ao `package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "docker:build": "docker build -t azore-frontend .",
    "docker:run": "docker run -p 3000:3000 azore-frontend"
  }
}
```

### 2. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. Docker Compose
```yaml
# docker-compose.yml (frontend)
version: '3.8'

services:
  frontend:
    build: .
    container_name: azore_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8800
    networks:
      - azore_network
    restart: unless-stopped
    depends_on:
      - api

networks:
  azore_network:
    external: true
```

## 🎯 Próximos Passos

1. **Implementar Autenticação**
   - Páginas de login/registro
   - Middleware de proteção de rotas
   - Integração com API

2. **Dashboard Principal**
   - Cards de estatísticas
   - Gráficos de transações
   - Lista de atividades recentes

3. **Gestão de Webhooks**
   - Lista de webhooks
   - Formulário de criação/edição
   - Teste de webhooks
   - Logs de disparos

4. **Gestão de Documentos**
   - Upload de arquivos
   - Visualização de documentos
   - Categorização e tags

5. **Melhorias de UX**
   - Loading states
   - Notificações toast
   - Responsividade
   - Tema escuro/claro

## 📝 Notas

- O projeto usa **App Router** do Next.js 13+
- **TypeScript** para type safety
- **React Bootstrap** para componentes UI
- **Zustand** para state management
- **TanStack Query** para cache de dados
- **React Hook Form + Zod** para validação
- **React Hot Toast** para notificações 