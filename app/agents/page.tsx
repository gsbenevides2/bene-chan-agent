"use client";

import { useState, useEffect } from "react";
import { getApiClient } from "@/app/utils/client";
import type { Agent } from "@/server/modules/agents/model";
import { Plus, Pencil, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.id}/edit`}
      className="card bg-base-200 hover:bg-base-300 transition-colors border border-base-300"
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{agent.name}</h3>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}

function AgentListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card bg-base-200 border border-base-300 animate-pulse">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-base-300" />
              <div className="space-y-2">
                <div className="w-32 h-4 rounded bg-base-300" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const api = getApiClient();
    api.agents.get().then((response) => {
      setIsLoading(false);
      if (response.error) {
        setError("Erro ao carregar agentes");
        return;
      }
      setAgentsList(response.data ?? []);
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agentes</h1>
          <p className="text-base-content/70 text-sm mt-1">
            Gerencie os agentes disponíveis para suas conversas
          </p>
        </div>
        <button
          onClick={() => router.push("/agents/new")}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo Agente
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <AgentListSkeleton />
      ) : agentsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-base-content/70">
          <Bot className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum agente encontrado</p>
          <p className="text-sm mt-1">Crie seu primeiro agente para começar</p>
          <button
            onClick={() => router.push("/agents/new")}
            className="btn btn-primary mt-4"
          >
            <Plus className="w-4 h-4" />
            Criar Agente
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentsList.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}