"use client";

import { useState, useEffect, useCallback } from "react";
import { getApiClient } from "@/app/utils/client";
import { Plus, RefreshCw, Trash2, Server } from "lucide-react";
import { useRouter } from "next/navigation";

interface MCPServerTool {
  id: string;
  serverId: string;
  name: string;
  description: string | null;
  inputSchema: unknown;
  createdAt: string;
}

interface MCPServer {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  tools: MCPServerTool[];
}

function MCPServerCard({
  server,
  onSync,
  onDelete,
  isSyncing,
}: {
  server: MCPServer;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
  isSyncing: boolean;
}) {
  return (
    <div className="bg-base-200 border border-base-300 card">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center bg-primary/20 rounded-full w-10 h-10">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{server.name}</h3>
              <p className="font-mono text-xs text-base-content/60">
                {server.url}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSync(server.id)}
              className={`btn btn-ghost btn-sm btn-square ${isSyncing ? "animate-spin" : ""}`}
              disabled={isSyncing}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(server.id)}
              className="text-error btn btn-ghost btn-sm btn-square"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3">
          <p className="mb-2 font-medium text-sm">
            Ferramentas ({server.tools.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {server.tools.slice(0, 8).map((tool) => (
              <span key={tool.id} className="badge-outline badge badge-sm">
                {tool.name}
              </span>
            ))}
            {server.tools.length > 8 && (
              <span className="badge badge-ghost badge-sm">
                +{server.tools.length - 8}
              </span>
            )}
            {server.tools.length === 0 && (
              <span className="text-xs text-base-content/40">
                Nenhuma ferramenta
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MCPServersPage() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadServers = useCallback(async () => {
    const api = getApiClient();
    const response = await api["mcp-servers"].get();
    if (response.error) {
      setError("Erro ao carregar servidores MCP");
      return;
    }
    setServers(response.data ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServers().finally(() => setIsLoading(false));
  }, [loadServers]);

  const handleSync = async (serverId: string) => {
    setIsSyncing(serverId);
    const api = getApiClient();
    await api["mcp-servers"]({ serverId }).sync.post();
    await loadServers();
    setIsSyncing(null);
  };

  const handleDelete = async (serverId: string) => {
    const api = getApiClient();
    await api["mcp-servers"]({ serverId }).delete();
    await loadServers();
  };

  return (
    <div className="flex flex-col flex-1 mx-auto p-6 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-2xl">Servidores MCP</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Gerencie servidores MCP para estender as capacidades dos agentes
          </p>
        </div>
        <button
          onClick={() => router.push("/mcp-servers/new")}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo Servidor
        </button>
      </div>

      {error && (
        <div className="mb-4 alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="gap-4 grid md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-base-200 border border-base-300 animate-pulse card"
            >
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="bg-base-300 rounded-full w-10 h-10" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-base-300 rounded w-32 h-4" />
                    <div className="bg-base-300 rounded w-48 h-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 text-base-content/70">
          <Server className="opacity-50 mb-4 w-16 h-16" />
          <p className="font-medium text-lg">Nenhum servidor MCP</p>
          <p className="mt-1 text-sm">Adicione um servidor MCP para começar</p>
          <button
            onClick={() => router.push("/mcp-servers/new")}
            className="mt-4 btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Adicionar Servidor
          </button>
        </div>
      ) : (
        <div className="gap-4 grid md:grid-cols-2">
          {servers.map((server) => (
            <MCPServerCard
              key={server.id}
              server={server}
              onSync={handleSync}
              onDelete={handleDelete}
              isSyncing={isSyncing === server.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
