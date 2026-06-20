"use client";

import { useState, useEffect, useMemo } from "react";
import { getApiClient } from "@/app/utils/client";
import { Beaker, Code2, Search, Server, Cpu } from "lucide-react";
import { ToolDrawer } from "../components/ToolDrawer";
import { ToolParam } from "../components/ToolDrawer/types";

export default function ToolsTestPage() {
  const [tools, setTools] = useState<ToolParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<ToolParam | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | "system" | "mcp">(
    "all",
  );

  useEffect(() => {
    const api = getApiClient();
    api.tools.get().then((res) => {
      setLoading(false);
      if (res.error) {
        setError("Erro ao carregar ferramentas");
        return;
      }
      setTools(res.data ?? []);
    });
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource =
        sourceFilter === "all" || tool.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [tools, searchTerm, sourceFilter]);

  return (
    <div className="flex flex-col flex-1 mx-auto p-6 w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Tool Tester</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Teste todas as ferramentas disponíveis no sistema
        </p>
      </div>

      <div className="flex sm:flex-row flex-col gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-base-content/70 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar ferramentas por nome ou descrição..."
            className="pl-10 w-full input input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="join">
          <button
            className={`join-item btn btn-sm ${sourceFilter === "all" ? "btn-active" : ""}`}
            onClick={() => setSourceFilter("all")}
          >
            Todas
          </button>
          <button
            className={`join-item btn btn-sm ${sourceFilter === "system" ? "btn-active" : ""}`}
            onClick={() => setSourceFilter("system")}
          >
            <Cpu className="w-3 h-3" />
            Sistema
          </button>
          <button
            className={`join-item btn btn-sm ${sourceFilter === "mcp" ? "btn-active" : ""}`}
            onClick={() => setSourceFilter("mcp")}
          >
            <Server className="w-3 h-3" />
            MCP
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-base-200 border border-base-300 animate-pulse card"
            >
              <div className="card-body">
                <div className="bg-base-300 mb-3 rounded w-40 h-4" />
                <div className="bg-base-300 rounded w-3/4 h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 text-base-content/70">
          <Beaker className="opacity-50 mb-4 w-16 h-16" />
          <p className="font-medium text-lg">
            {searchTerm || sourceFilter !== "all"
              ? "Nenhuma ferramenta encontrada para esta busca"
              : "Nenhuma ferramenta disponível"}
          </p>
          <p className="mt-1 text-sm">
            {searchTerm || sourceFilter !== "all"
              ? "Tente alterar os filtros ou termos de busca"
              : "As ferramentas registradas aparecerão aqui"}
          </p>
        </div>
      ) : (
        <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <button
              key={`${tool.source}-${tool.name}`}
              onClick={() => setSelectedTool(tool)}
              className="bg-base-200 hover:bg-base-300 border border-base-300 text-left transition-colors card"
            >
              <div className="p-4 card-body">
                <div className="flex items-center gap-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-primary/20 rounded-lg w-9 h-9">
                    <Code2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-semibold text-sm truncate">
                        {tool.name}
                      </h3>
                      <span
                        className={`badge badge-xs flex-shrink-0 ${tool.source === "system" ? "badge-primary" : "badge-soft badge-info"}`}
                      >
                        {tool.source === "system" ? "Sis" : "MCP"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-base-content/60 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <ToolDrawer
        tool={selectedTool ?? undefined}
        open={selectedTool !== null}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
}
