# Plano de Implementação do CRUD de MCP Servers

## O que é um MCP Server?
Um MCP Server é um servidor externo que disponibiliza ferramentas (tools) via protocolo Model Context Protocol. A aplicação se conecta a ele como cliente, descobre as ferramentas disponíveis e as disponibiliza para os agentes de IA durante conversas.

## Arquitetura Geral

```
┌─────────────────────────────────────────────────┐
│ bene-chan-agent                                  │
│                                                  │
│  ┌──────────┐   ┌──────────────┐   ┌─────────┐  │
│  │ Frontend │──▶│  API (Elysia) │──▶│ DB      │  │
│  │ (Next.js)│   │              │   │(Drizzle)│  │
│  └──────────┘   │              │   └─────────┘  │
│                 │  ┌─────────┐ │                │
│                 │  │ToolSvc  │ │                │
│                 │  │(unified)│ │                │
│                 │  └────┬────┘ │                │
│                 └───────┼──────┘                │
│                         │                       │
│              ┌──────────┴──────────┐            │
│              │                     │            │
│     ┌────────▼────┐      ┌────────▼────┐       │
│     │ System      │      │ MCP Servers │       │
│     │ Tools (local)│     │ (HTTP)      │       │
│     └─────────────┘      └─────────────┘       │
└─────────────────────────────────────────────────┘
```

## Fluxo de Integração de Tools MCP

1. Usuário cadastra MCP Server (nome + URL)
2. Ao cadastrar (ou clicar "Sync"), sistema conecta no servidor MCP via `@modelcontextprotocol/client`, chama `listTools()`, salva tools no DB
3. No Agent, há um campo separado `mcpTools` (jsonb) que armazena refs `{ serverId, toolName }[]` para selecionar quais MCP tools ele pode usar
4. Durante o chat, `ToolService.getToolsDefinition()` busca system tools + MCP tools do agent e unifica
5. Ao executar tool call, `ToolService.callTool()` detecta se é system tool (executa local) ou MCP tool (conecta no servidor e chama `callTool()`)

---

## Tasks de Implementação

### 1. Instalar dependências

Instalar `@modelcontextprotocol/client` para comunicação com servidores MCP via Streamable HTTP.

**Arquivos afetados:** `package.json`

### 2. Schema do Banco de Dados

**Arquivo:** `server/db/schema.ts`

**Tabela `mcp_servers`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid PK defaultRandom()` | ID único |
| `name` | `text notNull` | Nome do servidor |
| `url` | `text notNull` | URL HTTP do servidor MCP |
| `createdAt` | `timestamptz notNull defaultNow()` | Data de criação |
| `updatedAt` | `timestamptz notNull defaultNow()` | Data de atualização |

**Tabela `mcp_server_tools`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid PK defaultRandom()` | ID único |
| `serverId` | `uuid FK -> mcp_servers.id cascade` | Servidor dono |
| `name` | `text notNull` | Nome da tool (ex: "create-pr") |
| `description` | `text` | Descrição da tool |
| `inputSchema` | `jsonb` | JSON Schema dos parâmetros |
| `createdAt` | `timestamptz notNull defaultNow()` | Data de criação |

**Índices:** `idx_mcp_server_tools_server_id` em `mcp_server_tools.serverId`

**Tabela `agents` - nova coluna `mcp_tools`:**
- `mcpTools` — `jsonb notNull default '[]'`
- Formato: `[{ serverId: "uuid", toolName: "string" }]`
- Representa quais MCP tools este agent pode usar (além das system tools em `tools`)

### 3. MCP Server Module (CRUD)

Seguindo o padrão existente em `server/modules/agents/`.

#### 3.1 Model (`server/modules/mcp-servers/model.ts`)

Schemas Zod:
- `MCPServerSchema` — schema completo do servidor
- `MCPServerToolSchema` — schema das ferramentas
- `CreateMCPServerBodySchema` — `{ name: string, url: string }`
- `UpdateMCPServerBodySchema` — `{ name?: string, url?: string }`
- `UpdateMCPServerParamSchema` — `{ serverId: uuid }`
- `DeleteMCPServerParamSchema` — `{ serverId: uuid }`
- `ListMCPServersResponseSchema` — `z.array(MCPServerSchema)`
- `SyncMCPServerParamSchema` — `{ serverId: uuid }`
- `SyncMCPServerResponseSchema` — `{ syncedToolsCount: number }`

#### 3.2 Service (`server/modules/mcp-servers/service.ts`)

Classe `MCPServerService` com métodos:
- `create(data)` — insere servidor + conecta MCP e faz sync inicial das tools
- `list()` — lista todos servidores com suas tools
- `update(serverId, data)` — atualiza dados do servidor
- `delete(serverId)` — deleta servidor (cascade para tools)
- `syncTools(serverId)` — conecta no servidor MCP, chama `listTools()`, faz upsert das tools no DB (remove as antigas, insere as novas)
- `getServerTools(serverId)` — retorna tools de um servidor específico

#### 3.3 Routes (`server/modules/mcp-servers/index.ts`)

| Método | Path | Descrição |
|--------|------|-----------|
| `POST` | `/mcp-servers` | Criar servidor (já faz sync inicial) |
| `GET` | `/mcp-servers` | Listar servidores (com tools) |
| `PUT` | `/mcp-servers/:serverId` | Atualizar servidor |
| `DELETE` | `/mcp-servers/:serverId` | Deletar servidor |
| `POST` | `/mcp-servers/:serverId/sync` | Sincronizar tools do servidor |

### 4. MCP Client Service

**Arquivo:** `server/services/mcp-client.ts` (ou dentro do MCPServerService)

Serviço que gerencia conexão com servidores MCP usando `@modelcontextprotocol/client`:
- `connectToServer(url, auth?)` — cria `Client`, `StreamableHTTPClientTransport`, conecta
- `fetchTools(client)` — chama `client.listTools()`, retorna ferramentas no formato padronizado
- `executeTool(url, toolName, args)` — conecta, chama `client.callTool()`, retorna resultado
- `disconnect(client)` — fecha conexão

### 5. Unificar ToolService com MCP Tools

**Arquivo:** `server/services/tools/index.ts`

Modificar `ToolService` para incluir MCP tools:

```typescript
class ToolService {
  static systemTools = [new GetWeather()];

  // Aceita MCP tools opcionais junto com o filter
  static getToolsDefinition(filter?: string[], mcpTools?: MCPServerTool[]): ToolDefinition[]
  
  // Se tool não for encontrada em systemTools, busca nas mcpTools passadas
  static async callTool(toolName: string, args, mcpTools?: MCPServerTool[]): Promise<Result>
}
```

Para buscar MCP tools do agent durante o chat, `ChatService.getAgentTools()` (em `server/modules/chat/service.ts`) deve também retornar as MCP tools configuradas no agent.

### 6. Atualizar ChatService.getAgentTools

**Arquivo:** `server/modules/chat/service.ts`

`getAgentTools` atualmente retorna `string[]` (nomes das system tools). Deve ser expandido para retornar tanto as system tools quanto as MCP tools associadas ao agent:

```typescript
static async getAgentTools(sessionId: string) {
  const result = await db
    .select({ tools: agents.tools, mcpTools: agents.mcpTools })
    .from(chatSessions)
    .innerJoin(agents, eq(chatSessions.agentId, agents.id))
    .where(eq(chatSessions.id, sessionId));

  return {
    systemTools: result.at(0)?.tools ?? [],
    mcpTools: result.at(0)?.mcpTools ?? [],
  };
}
```

Nos arquivos que usam `getAgentTools` (messages/index.ts), adaptar para passar as MCP tools ao `ToolService`.

### 7. Atualizar OpenRouterService

**Arquivo:** `server/services/openrouter.ts`

Atualizar `streamChat` e `callTool` para receber e repassar MCP tools ao `ToolService`:

- `streamChat(newMessages, chatId, toolsFilter, mcpTools?)` — passa `mcpTools` para `ToolService.getToolsDefinition`
- `callTool(toolName, toolArgs, mcpTools?)` — passa `mcpTools` para `ToolService.callTool`

### 8. Atualizar Agent Module para incluir `mcpTools`

- **Model** (`server/modules/agents/model.ts`): Adicionar campo `mcpTools` (jsonb) nos schemas `AgentSchema`, `CreateAgentBodySchema`, `UpdateAgentBodySchema`
- **Service** (`server/modules/agents/service.ts`): Incluir `mcpTools` nas operações de CRUD

### 9. Atualizar GET /api/tools

**Arquivo:** `server/modules/tools/index.ts`

O endpoint atual só retorna system tools. Ele deve aceitar um parâmetro opcional `serverId` para retornar tools de um servidor MCP específico, ou retornar todas (system + MCP). 

**Simplificação:** Manter GET /api/tools retornando só system tools. Adicionar `GET /api/mcp-servers/:serverId/tools` para listar tools de um servidor específico (já atendido pelo `MCPServerService.getServerTools`).

### 10. Frontend

Criar páginas/componentes para gerenciar MCP servers.

**Páginas sugeridas:**
- `app/mcp-servers/page.tsx` — Lista de servidores com botão "Sync" em cada um
- `app/mcp-servers/new/page.tsx` — Formulário de cadastro
- `app/mcp-servers/[id]/edit/page.tsx` — Formulário de edição

**Na página de edição de Agent** (`app/agents/[id]/edit/page.tsx` e `app/agents/new/page.tsx`):
- Adicionar seção para selecionar MCP tools (checkbox tree: servidor > ferramentas)

---

## Testes

Após a implementação, executar:
- `bun run build` — verificar se compila
- `bun run lint` — verificar lint

---

## Resumo das alterações

| Componente | Tipo de Alteração |
|------------|------------------|
| `package.json` | Adicionar `@modelcontextprotocol/client` |
| `server/db/schema.ts` | Novas tabelas: `mcp_servers`, `mcp_server_tools`; coluna `mcpTools` em `agents` |
| `server/modules/mcp-servers/` | Novo módulo (model, service, index) |
| `server/services/mcp-client.ts` | Novo serviço cliente MCP |
| `server/services/tools/index.ts` | Unificar system + MCP tools |
| `server/services/openrouter.ts` | Aceitar MCP tools nos parâmetros |
| `server/modules/chat/service.ts` | Retornar MCP tools do agent |
| `server/modules/chat/messages/index.ts` | Passar MCP tools ao OpenRouter |
| `server/modules/agents/model.ts` | Adicionar campo `mcpTools` |
| `server/modules/agents/service.ts` | Incluir `mcpTools` nas queries |
| `server/modules/tools/index.ts` | (opcional) suporte a MCP tools |
| `app/mcp-servers/` | Novas páginas frontend |
| `app/agents/new/page.tsx` | Seleção de MCP tools |
| `app/agents/[id]/edit/page.tsx` | Seleção de MCP tools |