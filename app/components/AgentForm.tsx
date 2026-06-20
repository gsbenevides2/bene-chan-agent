"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiClient } from "@/app/utils/client";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";

interface ToolOption {
  name: string;
  description: string;
}

interface MCPToolRef {
  serverId: string;
  toolName: string;
}

interface MCPToolInfo {
  id: string;
  serverId: string;
  name: string;
  description: string | null;
}

interface MCPServerWithTools {
  id: string;
  name: string;
  url: string;
  tools: MCPToolInfo[];
}

interface AgentFormProps {
  initialData?: {
    id: string;
    name: string;
    systemPrompt: string;
    tools?: string[];
    mcpTools?: MCPToolRef[];
  };
}

export default function AgentForm({ initialData }: AgentFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [systemPrompt, setSystemPrompt] = useState(
    initialData?.systemPrompt ?? "",
  );
  const [tools, setTools] = useState<string[]>(initialData?.tools ?? []);
  const [mcpTools, setMcpTools] = useState<MCPToolRef[]>(
    initialData?.mcpTools ?? [],
  );
  const [availableTools, setAvailableTools] = useState<ToolOption[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServerWithTools[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEditing = !!initialData;

  const isAllSelected = tools.includes("all");

  useEffect(() => {
    const api = getApiClient();
    api.tools.get().then((response: { error?: unknown; data?: Record<string, unknown>[] }) => {
      if (!response.error && response.data) {
        setAvailableTools(response.data as unknown as ToolOption[]);
      }
    });
    api["mcp-servers"].get().then((response: { error?: unknown; data?: Record<string, unknown>[] }) => {
      if (!response.error && response.data) {
        setMcpServers(response.data as unknown as MCPServerWithTools[]);
      }
    });
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setTools(["all"]);
    } else {
      setTools([]);
    }
  };

  const handleToolToggle = (toolName: string, checked: boolean) => {
    if (checked) {
      setTools((prev) => [...prev, toolName]);
    } else {
      setTools((prev) => prev.filter((t) => t !== toolName));
    }
  };

  const isMCPToolSelected = (serverId: string, toolName: string) => {
    return mcpTools.some(
      (t) => t.serverId === serverId && t.toolName === toolName,
    );
  };

  const handleMCPToolToggle = (
    serverId: string,
    toolName: string,
    checked: boolean,
  ) => {
    if (checked) {
      setMcpTools((prev) => [...prev, { serverId, toolName }]);
    } else {
      setMcpTools((prev) =>
        prev.filter(
          (t) => !(t.serverId === serverId && t.toolName === toolName),
        ),
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    setIsSaving(true);
    setError(null);
    const api = getApiClient();
    try {
      if (isEditing) {
        const response = await api.agents({ agentId: initialData.id }).put({
          name: name.trim(),
          systemPrompt: systemPrompt.trim(),
          tools,
          mcpTools,
        });
        if (response.error) {
          setError("Erro ao atualizar agente");
          return;
        }
      } else {
        const response = await api.agents.post({
          name: name.trim(),
          systemPrompt: systemPrompt.trim(),
          tools,
          mcpTools,
        });
        if (response.error) {
          setError("Erro ao criar agente");
          return;
        }
      }
      router.push("/agents");
    } catch {
      setError("Erro ao salvar agente");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-color-mode="dark"
      className="flex flex-col flex-1 mx-auto p-6 w-full max-w-4xl"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-2xl">
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            {isEditing
              ? "Atualize as informações do agente"
              : "Configure um novo agente para suas conversas"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/agents")}
            className="btn btn-ghost"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!name.trim() || !systemPrompt.trim() || isSaving}
          >
            {isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : isEditing ? (
              "Salvar"
            ) : (
              "Criar"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        <fieldset className="fieldset">
          <legend className="pb-2 font-medium text-sm">Nome do Agente</legend>
          <input
            type="text"
            placeholder="Ex: Assistente Personalizado"
            className="w-full input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="pb-2 font-medium text-sm">System Prompt</legend>
          <p className="mb-3 text-xs text-base-content/60">
            Escreva em Markdown as instruções e personalidade do agente
          </p>
          <div className="border border-base-300 rounded-box overflow-hidden">
            <MDEditor
              value={systemPrompt}
              onChange={(val) => setSystemPrompt(val ?? "")}
              height={400}
              preview="live"
              visibleDragbar={false}
            />
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="pb-2 font-medium text-sm">
            Ferramentas do Sistema
          </legend>
          <p className="mb-3 text-xs text-base-content/60">
            Selecione as ferramentas nativas que este agente pode utilizar
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 bg-base-200 hover:bg-base-300 p-3 rounded-lg transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <div>
                <span className="font-medium">Selecionar Todas</span>
              </div>
            </label>
            <div className="my-1 divider" />
            {availableTools.map((tool) => (
              <label
                key={tool.name}
                className="flex items-center gap-3 bg-base-200 hover:bg-base-300 p-3 rounded-lg transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={isAllSelected || tools.includes(tool.name)}
                  disabled={isAllSelected}
                  onChange={(e) =>
                    handleToolToggle(tool.name, e.target.checked)
                  }
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{tool.name}</span>
                  <span className="text-xs text-base-content/60">
                    {tool.description}
                  </span>
                </div>
              </label>
            ))}
            {availableTools.length === 0 && (
              <p className="py-4 text-sm text-base-content/40 text-center">
                Nenhuma ferramenta disponível
              </p>
            )}
          </div>
        </fieldset>

        {mcpServers.length > 0 && (
          <fieldset className="fieldset">
            <legend className="pb-2 font-medium text-sm">
              Ferramentas MCP
            </legend>
            <p className="mb-3 text-xs text-base-content/60">
              Selecione as ferramentas de servidores MCP que este agente pode
              utilizar
            </p>
            <div className="space-y-4">
              {mcpServers.map((server) => (
                <div key={server.id} className="bg-base-200 p-3 rounded-lg">
                  <p className="mb-2 font-medium text-sm">{server.name}</p>
                  {server.tools.length === 0 ? (
                    <p className="ml-2 text-xs text-base-content/40">
                      Nenhuma ferramenta disponível
                    </p>
                  ) : (
                    <div className="space-y-1 ml-2">
                      {server.tools.map((tool) => (
                        <label
                          key={tool.id}
                          className="flex items-center gap-3 hover:bg-base-300 p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={isMCPToolSelected(server.id, tool.name)}
                            onChange={(e) =>
                              handleMCPToolToggle(
                                server.id,
                                tool.name,
                                e.target.checked,
                              )
                            }
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {tool.name}
                            </span>
                            {tool.description && (
                              <span className="text-xs text-base-content/60">
                                {tool.description}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}
