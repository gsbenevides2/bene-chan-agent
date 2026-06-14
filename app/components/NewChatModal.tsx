"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { useEventManager } from "@/app/utils/eventManager";
import { getApiClient } from "../utils/client";
import { useRouter } from "next/navigation";

export const OPEN_NEW_CHAT_MODAL_EVENT = "open-new-chat-modal";

interface AgentOption {
  id: string;
  name: string;
}

export default function NewChatModal() {
  const [chatName, setChatName] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const eventManager = useEventManager();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const api = getApiClient();
      api.agents.get().then((response) => {
        if (!response.error && response.data) {
          setAgents(response.data);
          if (response.data.length > 0 && !selectedAgentId) {
            setSelectedAgentId(response.data[0].id);
          }
        }
      });
    }
  }, [isOpen, selectedAgentId]);

  const handleClose = useCallback(() => {
    setChatName("");
    setSelectedAgentId("");
    setIsOpen(false);
  }, []);

  const handleCreateChat = useCallback(async () => {
    const api = getApiClient();
    if (chatName.trim() && selectedAgentId) {
      const response = await api.chat.post({
        title: chatName.trim(),
        agentId: selectedAgentId,
      });
      if (response.data?.sessionId) {
        handleClose();
        router.push(`/chat/${response.data.sessionId}`);
      }
    }
  }, [chatName, selectedAgentId, handleClose, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          handleCreateChat();
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCreateChat, handleClose]);

  useEffect(() => {
    const listener = eventManager.listen(OPEN_NEW_CHAT_MODAL_EVENT, () => {
      setChatName("");
      setSelectedAgentId("");
      setIsOpen(true);
    });
    return () => {
      if (listener) listener();
    };
  }, [eventManager]);

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="w-11/12 max-w-md modal-box">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">Novo Chat</h3>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <fieldset className="fieldset">
            <legend className="pb-2 text-sm">Nome do Chat</legend>
            <input
              ref={inputRef}
              type="text"
              placeholder="Digite o nome do novo chat..."
              className="input input-bordered w-full"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              maxLength={50}
            />
          </fieldset>
        </div>

        <div className="mb-6">
          <fieldset className="fieldset">
            <legend className="pb-2 text-sm">Agente</legend>
            <select
              className="select select-bordered w-full"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              {agents.length === 0 && (
                <option value="">Nenhum agente disponível</option>
              )}
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </fieldset>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={handleClose} className="btn btn-ghost">
            Sair
          </button>
          <button
            onClick={handleCreateChat}
            className="btn btn-primary"
            disabled={!chatName.trim() || !selectedAgentId}
          >
            Criar
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
