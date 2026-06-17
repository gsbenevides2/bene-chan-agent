"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiClient } from "@/app/utils/client";
import { Plus, Trash2 } from "lucide-react";

interface HeaderField {
  key: string;
  value: string;
}

export default function NewMCPServerPage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<HeaderField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: "key" | "value", val: string) => {
    setHeaders((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: val } : h)),
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    setIsSaving(true);
    setError(null);
    const api = getApiClient();
    try {
      const response = await api["mcp-servers"].post({
        name: name.trim(),
        url: url.trim(),
        headers: headers.filter((h) => h.key.trim()),
      });
      if (response.error) {
        setError("Erro ao criar servidor MCP");
        return;
      }
      router.push("/mcp-servers");
    } catch {
      setError("Erro ao criar servidor MCP");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 mx-auto p-6 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-2xl">Novo Servidor MCP</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Conecte um servidor MCP para disponibilizar suas ferramentas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/mcp-servers")}
            className="btn btn-ghost"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!name.trim() || !url.trim() || isSaving}
          >
            {isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Adicionar"
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
          <legend className="pb-2 font-medium text-sm">Nome do Servidor</legend>
          <input
            type="text"
            placeholder="Ex: GitHub MCP Server"
            className="w-full input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="pb-2 font-medium text-sm">URL do Servidor</legend>
          <p className="mb-3 text-xs text-base-content/60">
            URL HTTP do servidor MCP (ex: https://mcp.example.com)
          </p>
          <input
            type="url"
            placeholder="https://mcp.example.com"
            className="w-full font-mono input input-bordered"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="pb-2 font-medium text-sm">
            Headers Personalizados
          </legend>
          <p className="mb-3 text-xs text-base-content/60">
            Adicione headers HTTP para autenticação ou configuração do servidor
          </p>
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Header"
                  className="w-48 font-mono text-sm input input-bordered"
                  value={header.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Valor"
                  className="flex-1 font-mono text-sm input input-bordered"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                />
                <button
                  onClick={() => removeHeader(index)}
                  className="text-error btn btn-ghost btn-square btn-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addHeader} className="btn btn-ghost btn-sm">
              <Plus className="w-4 h-4" />
              Adicionar Header
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
