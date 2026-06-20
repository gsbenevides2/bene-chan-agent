"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApiClient } from "@/app/utils/client";
import type { Agent } from "@/server/modules/agents/model";
import AgentForm from "@/app/components/AgentForm";

export default function EditAgentPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = getApiClient();
    api.agents.get().then((response: { error?: unknown; data?: Agent[] }) => {
      setIsLoading(false);
      if (response.error) {
        setError("Erro ao carregar agente");
        return;
      }
      const found = (response.data ?? []).find((a: Agent) => a.id === agentId);
      if (!found) {
        setError("Agente não encontrado");
        return;
      }
      setAgent(found);
    });
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-base-content/70">
        <p className="text-lg">{error ?? "Agente não encontrado"}</p>
      </div>
    );
  }

  return <AgentForm initialData={agent} />;
}