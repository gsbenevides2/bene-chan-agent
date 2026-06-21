"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import ChatSessionsList from "@/app/components/ChatSessionsList";
import { OPEN_NEW_CHAT_MODAL_EVENT } from "@/app/components/NewChatModal";
import { useEventManager } from "@/app/utils/eventManager";
import { ChatSession } from "@/server/modules/chat/model";
import ChatSessionsSkeleton from "@/app/components/ChatSessionsSkeleton";
import { getApiClient } from "@/app/utils/client";
import { useAlert } from "@/app/hooks/useAlert";

export default function ChatsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const eventManager = useEventManager();
  const [isLoading, setIsLoading] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const { warning, success, error } = useAlert();

  const handleSelectChat = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
  };

  const handleDeleteChat = (sessionId: string) => {
    const api = getApiClient();
    warning("Tem certeza que deseja excluir esta conversa?", {
      title: "Confirmação de Exclusão",
      confirmText: "Sim, excluir",
      closeOnConfirm: false,
      onConfirm: () => {
        api
          .chat({ sessionId })
          .delete()
          .then(() => {
            success(`Chat ${sessionId} foi excluído!`);
            setChatSessions((prev) =>
              prev.filter((session) => session.id !== sessionId),
            );
          })
          .catch(() => {
            error(`Falha ao excluir o chat ${sessionId}. Tente novamente.`);
          });
      },
    });
  };

  const handleRenameChat = (sessionId: string, newName: string) => {
    const api = getApiClient();
    api
      .chat({ sessionId })
      .put({ title: newName })
      .then(() => {
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId ? { ...session, title: newName } : session,
          ),
        );
        success("Chat renomeado com sucesso!");
      })
      .catch(() => {
        error("Falha ao renomear o chat. Tente novamente.");
      });
  };

  const handleCreateChat = () => {
    eventManager.dispatchEvent(OPEN_NEW_CHAT_MODAL_EVENT);
  };

  useEffect(() => {
    const api = getApiClient();
    api.chat.get().then((response) => {
      if (Array.isArray(response.data)) {
        setChatSessions(response.data);
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <div className="bg-base-100 min-h-screen">
      {/* Header */}
      <div className="bg-base-200 shadow-sm border-base-200 border-b">
        <div className="mx-auto px-4 py-4 container">
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
            {/* Page Title */}
            <div>
              <h1 className="font-bold text-base-content text-2xl">
                Suas Conversas
              </h1>
              <p className="text-sm text-base-content/70">
                Gerencie e acesse seus chats anteriores
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="top-1/2 left-3 absolute w-4 h-4 text-base-content/50 -translate-y-1/2 transform" />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  className="pl-5 hover:border-base-400 focus:border-base-400 focus:outline-none focus:ring-0 w-64 input input-bordered"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Button */}
              <button className="btn-outline btn btn-square">
                <Filter className="w-4 h-4" />
              </button>

              {/* New Chat Button */}
              <button onClick={handleCreateChat} className="btn btn-primary">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full min-w-full max-h-[calc(100dvh-85px)] overflow-y-auto container">
        <div className="mx-auto px-4 py-6 min-h-[calc(100dvh-85px)]">
          <div className="mx-auto max-w-4xl">
            <div className="bg-base-100 shadow-sm border border-base-200 card">
              {/* Chat Sessions List */}
              {isLoading ? (
                <ChatSessionsSkeleton itemCount={10} />
              ) : (
                <ChatSessionsList
                  chatSessions={chatSessions}
                  onSelectChat={handleSelectChat}
                  onDeleteChat={handleDeleteChat}
                  onRenameChat={handleRenameChat}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
