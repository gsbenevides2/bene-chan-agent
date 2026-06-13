"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Command, Folder, Settings, ArrowRight, X } from "lucide-react";
import { useEventManager } from "@/app/utils/eventManager";
import { OPEN_NEW_CHAT_MODAL_EVENT } from "@/app/components/NewChatModal";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  name: string;
  description: string;
  category?: string;
  action: () => void;
}

export default function QuickBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const eventManager = useEventManager();
  const router = useRouter();

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Lista de comandos disponíveis
  const commands: Command[] = [
    {
      id: "new-chat",
      name: "Novo Chat",
      description: "Iniciar uma nova conversa",
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
      category: "Chat",
      action: () => {
        router.push("/chats");
        onClose();
      },
    },
  ];

  // Filtrar comandos baseado no termo de busca
  const filteredCommands = commands.filter(
    (command) =>
      command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      command.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
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
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Abrir quando / for pressionado
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
      if (isValidKey && !isNotAllowedTag && !isOpen) {
        e.preventDefault();
        handleModalOpen();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleModalOpen]);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "Chat":
        return <Command className="w-4 h-4" />;
      case "Sistema":
        return <Settings className="w-4 h-4" />;
      case "Ajuda":
        return <Folder className="w-4 h-4" />;
      default:
        return <Command className="w-4 h-4" />;
    }
  };

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="w-11/12 max-w-2xl modal-box">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Command className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Barra de Comandos</h3>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-base-content/70 -translate-y-1/2 transform" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Digite para buscar comandos..."
            className="hover:border-base-400 focus:border-base-400 focus:outline-none focus:ring-0 w-full input input-bordered"
            value={searchTerm}
            onChange={handleInputChange}
          />
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-base-content/70 text-center">
              <Command className="opacity-50 mx-auto mb-2 w-12 h-12" />
              <p>Nenhum comando encontrado</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={command.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${selectedIndex === index ? "bg-base-300" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={"text-base-content/70"}>
                        {getCategoryIcon(command.category)}
                      </div>
                      <div>
                        <div className={`font-medium text-base-content`}>
                          {command.name}
                        </div>
                        <div className="text-sm text-base-content/70">
                          {command.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-opacity opacity-0 ${selectedIndex === index ? "opacity-100" : ""}`}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredCommands.length > 0 && (
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

      {/* Modal Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
