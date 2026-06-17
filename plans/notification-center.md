# Plano de Implementação do Notification Center

## Arquitetura Geral

```
[Aplicacão Externa] ──POST──▶ [/api/notifications/receive]
                                   │
                          ┌────────┴────────┐
                          │ Authentik       │
                          │ Introspect      │
                          │ Token + role    │
                          └────────┬────────┘
                                   │ Válido?
                           ┌───────┴───────┐
                           │               │
                    ┌──────▼────┐   ┌──────▼──────┐
                    │ Salvar no │   │ Disparar    │
                    │ DB        │   │ WebPush     │
                    └──────┬────┘   └──────┬──────┘
                           │               │
                           │        ┌──────▼──────┐
                           │        │ Push Service │
                           │        │ (Google/Fire-│
                           │        │  fox/Apple)  │
                           │        └──────┬──────┘
                           │               │
                           │        ┌──────▼──────┐
                           │        │ Service     │
                           │        │ Worker (sw) │
                           │        └──────┬──────┘
                           │               │
                           │        ┌──────▼──────┐
                           │        │ Notificação  │
                           │        │ do Sistema   │
                           │        └─────────────┘
                           ▼
              ┌──────────────────────┐
              │ Centro de           │
              │ Notificações        │
              │ (Modal Desktop      │
              │  Full Mobile)       │
              └──────────────────────┘
```

## Fluxo de Funcionamento

### Recebimento de Notificação (Endpoint Externo)
1. Aplicação externa faz `POST /api/notifications/receive` com:
   - Header `Authorization: Bearer <access_token>` ou `?authToken=<access_token>`
   - Body: `{ title, description, image?, link? }`
2. Servidor valida token via authentik (introspect) — verifica cargo `bene-chan-notification-sender`
3. Se inválido → 401
4. Se válido → salva notificação no DB + dispara WebPush para todos inscritos
5. Retorna 201

### WebPush (Notificação no Navegador)
1. Service worker `sw.js` registrado na página
2. Ao entrar na app, verifica se já tem subscription salva
3. Se não tem, pede permissão e cria subscription, envia ao servidor
4. Ao receber notificação via endpoint, servidor envia push para todas subscriptions salvas
5. Service worker recebe o push e mostra notificação do sistema

### Centro de Notificações (UI)
1. Acessível via QuickBar (atalho ou comando)
2. Desktop: modal, Mobile: página cheia
3. Lista notificações com título, descrição, imagem, link, status de leitura
4. Ações: marcar como lida, excluir, marcar todas como lidas
5. Gerenciamento de WebPush: status da permissão, botão para habilitar/desabilitar

---

## Tasks de Implementação

### 1. Instalar dependências

Adicionar ao `package.json`:
- `web-push` — envio de push notifications (Node.js)

Gerar VAPID keys (via script ou comando manual) e adicionar ao `.env`:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contato@gui.dev.br
```

Dica: VAPID keys podem ser geradas com `npx web-push generate-vapid-keys`

### 2. Schema do Banco de Dados

**Arquivo:** `server/db/schema.ts`

#### Nova tabela `notifications`:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid PK defaultRandom()` | ID único |
| `title` | `text notNull` | Título da notificação |
| `description` | `text notNull` | Descrição |
| `image` | `text` | URL da imagem (opcional) |
| `link` | `text` | URL ao clicar (opcional) |
| `read` | `boolean notNull default false` | Se foi lida |
| `createdAt` | `timestamptz notNull defaultNow()` | Data de criação |

#### Nova tabela `push_subscriptions`:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid PK defaultRandom()` | ID único |
| `endpoint` | `text notNull unique` | Endpoint URL do push service |
| `p256dhKey` | `text notNull` | Chave pública de criptografia |
| `authKey` | `text notNull` | Chave de autenticação |
| `userAgent` | `text` | User-Agent do navegador |
| `enabled` | `boolean notNull default true` | Se está ativa |
| `createdAt` | `timestamptz notNull defaultNow()` | Data de criação |

### 3. Módulo Notifications (Backend)

Seguindo o padrão `server/modules/notifications/` com 3 arquivos.

#### 3.1 Model (`server/modules/notifications/model.ts`)

Schemas Zod:
- `NotificationSchema` — schema completo
- `CreateNotificationBodySchema` — `{ title, description, image?, link? }` (vindo de app externa)
- `ReceiveNotificationResponseSchema` — `{ id, createdAt }`
- `ListNotificationsResponseSchema` — `z.array(NotificationSchema)` (ordenado por createdAt desc)
- `UpdateNotificationParamSchema` — `{ notificationId: uuid }`
- `UpdateNotificationBodySchema` — `{ read?: boolean }`
- `SubscribePushBodySchema` — `{ endpoint, keys: { p256dh, auth } }` (formato PushSubscription JSON do browser)
- `UnsubscribePushParamSchema` — `{ subscriptionId: uuid }`
- `WebPushStatusResponseSchema` — `{ permission: string, enabled: boolean, subscriptions: number }`
- `MarkAllReadResponseSchema` — `{ updatedCount: number }`

#### 3.2 Service (`server/modules/notifications/service.ts`)

Classe `NotificationService` com métodos:
- `receiveNotification(data)` — salva notificação + dispara WebPush, retorna notificação criada
- `listNotifications()` — lista todas notificações ordenadas por data decrescente
- `markAsRead(notificationId)` — marca uma como lida
- `markAllAsRead()` — marca todas como lidas
- `deleteNotification(notificationId)` — exclui uma notificação
- `subscribePush(data)` — salva subscription push
- `unsubscribePush(subscriptionId)` — desabilita subscription
- `getWebPushStatus()` — retorna status das permissões push
- `sendWebPushToAll()` — envia push para todas subscriptions ativas
- `validateToken(token)` — valida token no authentik via introspect

#### 3.3 Routes (`server/modules/notifications/index.ts`)

| Método | Path | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/notifications/receive` | Receber notificação externa | Bearer token (authentik) |
| `GET` | `/notifications` | Listar notificações | - |
| `PUT` | `/notifications/:notificationId` | Marcar como lida | - |
| `DELETE` | `/notifications/:notificationId` | Excluir notificação | - |
| `PUT` | `/notifications/read-all` | Marcar todas como lidas | - |
| `POST` | `/notifications/push/subscribe` | Inscrever para push | - |
| `DELETE` | `/notifications/push/:subscriptionId` | Desinscrever push | - |
| `GET` | `/notifications/push/status` | Status do WebPush | - |

**Detalhe do endpoint `/notifications/receive`:**
- Lê `Authorization: Bearer <token>` do header ou queryParam `?authToken=<access_token>`
- Chama `NotificationService.validateToken(token)`
- Se inválido → 401
- Se válido → processa

### 4. Validação Authentik

**Arquivo:** `server/services/authentik.ts`

Serviço simples que faz validação do token:
```typescript
class AuthentikService {
  static async validateNotificationToken(token: string): Promise<boolean>
}
```

Funcionamento:
- Faz requisição HTTP para o endpoint de introspect do authentik
- Verifica se o token é válido E se tem o cargo `bene-chan-notification-sender`
- Retorna `true`/`false`
- Configuração via variáveis de ambiente:
  ```
  AUTHENTIK_URL=https://authentik.exemplo.com
  AUTHENTIK_CLIENT_ID=...
  AUTHENTIK_CLIENT_SECRET=...
  ```

### 5. Serviço WebPush

**Arquivo:** `server/services/webpush.ts`

```typescript
class WebPushService {
  static async sendNotification(data: { title, description, image?, link? }): Promise<void>
}
```

Funcionamento:
- Busca todas `push_subscriptions` ativas no DB
- Para cada subscription, usa `web-push` para enviar
- Se subscription estiver expirada (erro 410/404), remove do DB

**Detalhe de `.env`:**
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contato@gui.dev.br
```

### 6. Service Worker

**Arquivo:** `public/sw.js`

Service worker simples:
```javascript
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "Nova notificação" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.description,
      icon: "/icon.png",
      image: data.image,
      data: { url: data.link },
      // action ao clicar
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    clients.openWindow(event.notification.data.url);
  }
});
```

**Registro no frontend:** Na página inicial ou layout, registrar o service worker + verificar permissão de notificação.

### 7. Frontend — Centro de Notificações

#### 7.1 Componente NotificationCenter

**Arquivo:** `app/components/NotificationCenter.tsx`

Características:
- **Desktop**: `<dialog className="modal modal-bottom sm:modal-middle">` (DaisyUI modal)
- **Mobile**: Página cheia via `app/notifications/page.tsx` (detecta mobile via CSS/tailwind `lg:` )
- Abre via QuickBar (atalho ou comando)
- Botão "Marcar todas como lidas" no topo

Estrutura:
```
┌─────────────────────────────────────┐
│  Notificações    [✓ Marcar todas]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ● Título                  [🗑] │ │
│ │   Descrição...                 │ │
│ │   📎 link.com.br          [✓] │ │
│ │   5 min atrás                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ Título                   [🗑] │ │
│ │   ...                          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  WebPush: [🔔 Ativado] [Gerenciar] │
└─────────────────────────────────────┘
```

Cada notificação mostra:
- Bolinha colorida (lida/não lida)
- Título
- Descrição (truncada)
- Imagem (se tiver)
- Link (se tiver)
- Timestamp relativo ("5 min atrás")
- Botões: marcar como lida (se não lida), excluir

#### 7.2 Componente de Gerenciamento WebPush

Dentro do NotificationCenter, seção de gerenciamento:
- Status da permissão do navegador (concedida/negada/prompt)
- Botão "Habilitar notificações" (só se permissão for "default")
- Botão "Desabilitar notificações" (remove subscription do servidor)
- Contagem de dispositivos inscritos

#### 7.3 Página Mobile

**Arquivo:** `app/notifications/page.tsx`

- Exibe o mesmo conteúdo do modal, mas em página cheia
- Link "Voltar" no topo
- Detecta mobile via classe CSS `lg:hidden` no trigger

#### 7.4 Sincronização

Usar EventManager ou polling para notificações. Como já temos SSE no projeto, podemos:
- Opção 1: Abrir uma conexão SSE dedicada para notificações
- Opção 2: Polling simples (ex: a cada 30s verificar GET /notifications)
- **Recomendado:** Polling simples por ser mais simples e notificações não são críticas em tempo real (já tem WebPush para urgência)

Ao abrir o modal/página, buscar notificações atuais. Marcar como lida atualiza localmente.

### 8. QuickBar — Integração

**Arquivo:** `app/components/QuickBar.tsx`

Adicionar novo comando na lista de `commands`:
```typescript
{
  id: "notifications",
  label: "Ver notificações",
  icon: Bell,
  shortcut: "N",
  action: () => openNotificationCenter(),
}
```

Acionar abertura do modal via EventManager (similar ao `OPEN_NEW_CHAT_MODAL_EVENT`).

### 9. Notificações não lidas — Badge

No `app/layout.tsx` ou no QuickBar, exibir badge com contagem de notificações não lidas:
- Buscar `GET /notifications` e contar as `read === false`
- Exibir bolinha vermelha com número no ícone de notificações

### 10. Registro do Módulo

**Arquivo:** `app/api/[[...slugs]]/route.ts`

Adicionar `.use(notifications)` no Elysia app.

---

## Tasks Resumidas

| # | Task | Arquivos |
|---|------|----------|
| 1 | Instalar `web-push`, configurar VAPID keys, `.env` | `package.json`, `.env` |
| 2 | Schema DB: `notifications`, `push_subscriptions` | `server/db/schema.ts` |
| 3 | Serviço Authentik: validação de token | `server/services/authentik.ts` |
| 4 | Serviço WebPush: envio de push | `server/services/webpush.ts` |
| 5 | Módulo Notifications (model, service, index) | `server/modules/notifications/` |
| 6 | Service Worker (`sw.js`) | `public/sw.js` |
| 7 | Componente NotificationCenter | `app/components/NotificationCenter.tsx` |
| 8 | Página mobile de notificações | `app/notifications/page.tsx` |
| 9 | Integração QuickBar | `app/components/QuickBar.tsx` |
| 10 | Badge de notificações não lidas | `app/layout.tsx` |
| 11 | Registro do módulo na API | `app/api/[[...slugs]]/route.ts` |

## Testes

Após implementação: `bun run build` + `bun run lint`.