"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  Command,
  Folder,
  Settings,
  ArrowRight,
  X,
  Bot,
  MessageSquare,
  Beaker,
} from "lucide-react";
import { useEventManager } from "@/app/utils/eventManager";
import { OPEN_NEW_CHAT_MODAL_EVENT } from "@/app/components/NewChatModal";
import { OPEN_NOTIFICATION_CENTER_EVENT } from "@/app/utils/notificationTypes";
import { useRouter, usePathname } from "next/navigation";
import { getApiClient } from "@/app/utils/client";
import ModelPickerModal from "@/app/components/ModelPickerModal";

interface Command {
  id: string;
  name: string;
  description: string;
  type: "command";
  category?: string;
  action: () => void;
  disabled?: boolean;
}

interface AgentResult {
  id: string;
  name: string;
  type: "agent";
}

interface ChatResult {
  id: string;
  title: string;
  type: "chat";
}

type QuickItem = Command | AgentResult | ChatResult;

export default function QuickBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [chatResults, setChatResults] = useState<ChatResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const eventManager = useEventManager();
  const router = useRouter();
  const pathname = usePathname();
  const isOnChatPage = pathname.startsWith("/chat/");
  const currentSessionId = isOnChatPage ? pathname.split("/chat/")[1] : null;

  const onClose = useCallback(() => {
    setIsOpen(false);
    setAgentResults([]);
    setChatResults([]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const api = getApiClient();
      api.notifications["unread-count"]
        .get()
        .then((res: { data?: unknown }) => {
          const data = res.data as { count: number } | undefined;
          if (data) setUnreadCount(data.count);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const commands: Command[] = [
    {
      id: "new-chat",
      name: "Novo Chat",
      description: "Iniciar uma nova conversa",
      type: "command",
      category: "Chat",
      action: () => {
        eventManager.dispatchEvent(OPEN_NEW_CHAT_MODAL_EVENT);
        onClose();
      },
    },
    {
      id: "history",
      name: "Ver Histórico",
      description: "Ver todo o histórico de conversas",
      type: "command",
      category: "Chat",
      action: () => {
        router.push("/chats");
        onClose();
      },
    },
    {
      id: "delete-chat",
      name: "Excluir Chat",
      description: "Excluir a conversa atual",
      type: "command",
      category: "Sistema",
      disabled: !isOnChatPage,
      action: () => {
        if (!currentSessionId) return;
        const api = getApiClient();
        api
          .chat({ sessionId: currentSessionId })
          .delete()
          .then(() => {
            router.push("/chats");
            onClose();
          })
          .catch(() => {
            onClose();
          });
      },
    },
    {
      id: "mcp-servers",
      name: "Servidores MCP",
      description: "Gerenciar servidores MCP",
      type: "command",
      category: "Agentes",
      action: () => {
        router.push("/mcp-servers");
        onClose();
      },
    },
    {
      id: "agents",
      name: "Gerenciar Agentes",
      description: "Ver e gerenciar todos os agentes",
      type: "command",
      category: "Agentes",
      action: () => {
        router.push("/agents");
        onClose();
      },
    },
    {
      id: "notifications",
      name: `Ver Notificações${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
      description: "Visualizar e gerenciar notificações",
      type: "command",
      category: "Sistema",
      action: () => {
        eventManager.dispatchEvent(OPEN_NOTIFICATION_CENTER_EVENT);
        onClose();
      },
    },
    {
      id: "new-agent",
      name: "Novo Agente",
      description: "Criar um novo agente personalizado",
      type: "command",
      category: "Agentes",
      action: () => {
        router.push("/agents/new");
        onClose();
      },
    },
    {
      id: "trocar-modelo",
      name: "Trocar Modelo",
      description: "Alterar o modelo de IA da conversa atual",
      type: "command",
      category: "Chat",
      disabled: !isOnChatPage,
      action: () => {
        onClose();
        setModelModalOpen(true);
      },
    },
    {
      id: "tools-test",
      name: "Tool Tester",
      description: "Testar ferramentas do sistema",
      type: "command",
      category: "Ferramentas",
      action: () => {
        router.push("/tools-test");
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (command) =>
      !command.disabled &&
      (command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const allItems = useMemo(() => {
    return [...filteredCommands, ...agentResults, ...chatResults];
  }, [agentResults, chatResults, filteredCommands]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchTerm.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAgentResults([]);
      setChatResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const api = getApiClient();
      try {
        const [agentsRes, chatsRes] = await Promise.all([
          api.agents.search.get({ query: { q: searchTerm } }),
          api.chat.search.get({ query: { q: searchTerm } }),
        ]);

        const agentsData = agentsRes.data ?? [];
        const chatsData = chatsRes.data ?? [];

        setAgentResults(
          agentsData.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            name: a.name as string,
            type: "agent" as const,
          })),
        );
        setChatResults(
          chatsData.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            title: c.title as string,
            type: "chat" as const,
          })),
        );
      } catch {
        setAgentResults([]);
        setChatResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const handleModalOpen = useCallback(() => {
    setSearchTerm("");
    setSelectedIndex(0);
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    setIsOpen(true);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setSelectedIndex(0);
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : allItems.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (allItems[selectedIndex]) {
            const item = allItems[selectedIndex];
            if (item.type === "command") {
              item.action();
            } else if (item.type === "agent") {
              router.push(`/agents/${item.id}/edit`);
              onClose();
            } else if (item.type === "chat") {
              router.push(`/chat/${item.id}`);
              onClose();
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, allItems, onClose, router]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const tagName =
        e.currentTarget instanceof HTMLElement
          ? e.currentTarget.tagName.toLowerCase()
          : e.target instanceof HTMLElement
            ? e.target.tagName.toLowerCase()
            : "";
      const notAllowedTags = ["input", "textarea", "select"];
      const validKeys = ["/"];
      const isNotAllowedTag = notAllowedTags.includes(tagName);
      const isValidKey = validKeys.includes(e.key);

      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        handleModalOpen();
        return;
      }

      if (isValidKey && !isNotAllowedTag && !isOpen) {
        e.preventDefault();
        handleModalOpen();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleModalOpen]);

  const getItemIcon = (item: QuickItem) => {
    if (item.type === "command") {
      switch (item.category) {
        case "Chat":
          return <Command className="w-4 h-4" />;
        case "Sistema":
          return <Settings className="w-4 h-4" />;
        case "Agentes":
          return <Bot className="w-4 h-4" />;
        case "Ajuda":
          return <Folder className="w-4 h-4" />;
        case "Ferramentas":
          return <Beaker className="w-4 h-4" />;
        default:
          return <Command className="w-4 h-4" />;
      }
    }
    if (item.type === "agent") return <Bot className="w-4 h-4" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  const getItemName = (item: QuickItem) => {
    if (item.type === "command") return item.name;
    if (item.type === "agent") return item.name;
    return item.title;
  };

  const getItemDescription = (item: QuickItem) => {
    if (item.type === "command") return item.description;
    if (item.type === "agent") return "Agente";
    return "Chat";
  };

  const getItemCategory = (item: QuickItem) => {
    if (item.type === "command") return item.category;
    if (item.type === "agent") return "Agentes";
    return "Chat";
  };

  return (
    <>
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="w-11/12 max-w-2xl modal-box">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Command className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Barra de Comandos</h3>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-base-content/70 -translate-y-1/2 transform" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Digite para buscar comandos, agentes ou chats..."
            className="hover:border-base-400 focus:border-base-400 focus:outline-none focus:ring-0 w-full input input-bordered"
            value={searchTerm}
            onChange={handleInputChange}
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="py-8 text-base-content/70 text-center">
              <Command className="opacity-50 mx-auto mb-2 w-12 h-12" />
              <p>
                {isSearching
                  ? "Buscando..."
                  : "Nenhum resultado encontrado"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allItems.map((item, index) => (
                <button
                  key={`${item.type}-${index}`}
                  onClick={() => {
                    if (item.type === "command") {
                      item.action();
                    } else if (item.type === "agent") {
                      router.push(`/agents/${item.id}/edit`);
                      onClose();
                    } else if (item.type === "chat") {
                      router.push(`/chat/${item.id}`);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${selectedIndex === index ? "bg-base-300" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={"text-base-content/70"}>
                        {getItemIcon(item)}
                      </div>
                      <div>
                        <div className={`font-medium text-base-content`}>
                          {getItemName(item)}
                        </div>
                        <div className="text-sm text-base-content/70">
                          {getItemDescription(item)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.type !== "command" && (
                        <span className="bg-base-200 px-2 py-0.5 rounded-full text-xs text-base-content/60">
                          {getItemCategory(item)}
                        </span>
                      )}
                      <ArrowRight
                        className={`w-4 h-4 transition-opacity opacity-0 ${selectedIndex === index ? "opacity-100" : ""}`}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {allItems.length > 0 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-base-200 border-t text-xs text-base-content/70">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="kbd kbd-sm">↑↓</kbd>
                <span className="h-5">navegar</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="kbd kbd-sm">Enter</kbd>
                <span className="h-5">executar</span>
              </span>
            </div>
            <span className="flex items-center space-x-1">
              <kbd className="kbd kbd-sm">Esc</kbd>
              <span className="h-5">fechar</span>
            </span>
          </div>
        )}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
      <ModelPickerModal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        currentSessionId={currentSessionId}
      />
    </>
  );
}
