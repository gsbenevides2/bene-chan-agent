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

interface AgentFormProps {
  initialData?: {
    id: string;
    name: string;
    systemPrompt: string;
    tools?: string[];
  };
}

export default function AgentForm({ initialData }: AgentFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [systemPrompt, setSystemPrompt] = useState(
    initialData?.systemPrompt ?? "",
  );
  const [tools, setTools] = useState<string[]>(initialData?.tools ?? []);
  const [availableTools, setAvailableTools] = useState<ToolOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEditing = !!initialData;

  const isAllSelected = tools.includes("all");

  useEffect(() => {
    const api = getApiClient();
    api.tools.get().then((response) => {
      if (!response.error && response.data) {
        setAvailableTools(response.data as ToolOption[]);
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
    <div data-color-mode="dark" className="flex flex-col flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            {isEditing
              ? "Atualize as informações do agente"
              : "Configure um novo agente para suas conversas"}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/agents")} className="btn btn-ghost">
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
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        <fieldset className="fieldset">
          <legend className="text-sm pb-2 font-medium">Nome do Agente</legend>
          <input
            type="text"
            placeholder="Ex: Assistente Personalizado"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="text-sm pb-2 font-medium">
            System Prompt
          </legend>
          <p className="text-xs text-base-content/60 mb-3">
            Escreva em Markdown as instruções e personalidade do agente
          </p>
          <div className="rounded-box overflow-hidden border border-base-300">
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
          <legend className="text-sm pb-2 font-medium">Ferramentas</legend>
          <p className="text-xs text-base-content/60 mb-3">
            Selecione as ferramentas que este agente pode utilizar
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-base-200 cursor-pointer hover:bg-base-300 transition-colors">
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
            <div className="divider my-1" />
            {availableTools.map((tool) => (
              <label
                key={tool.name}
                className="flex items-center gap-3 p-3 rounded-lg bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={isAllSelected || tools.includes(tool.name)}
                  disabled={isAllSelected}
                  onChange={(e) => handleToolToggle(tool.name, e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{tool.name}</span>
                  <span className="text-xs text-base-content/60">{tool.description}</span>
                </div>
              </label>
            ))}
            {availableTools.length === 0 && (
              <p className="text-sm text-base-content/40 text-center py-4">
                Nenhuma ferramenta disponível
              </p>
            )}
          </div>
        </fieldset>
      </div>
    </div>
  );
}