"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { useEventManager } from "@/app/utils/eventManager";
import { getApiClient } from "../utils/client";
import { useRouter } from "next/navigation";

export const OPEN_NEW_CHAT_MODAL_EVENT = "open-new-chat-modal";

export default function NewChatModal() {
  const [chatName, setChatName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const eventManager = useEventManager();
  const router = useRouter();
  // Focar no input quando o modal abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Limpar input quando fechar o modal
  const handleClose = useCallback(() => {
    setChatName("");
    setIsOpen(false);
  }, []);

  // Criar chat
  const handleCreateChat = useCallback(async () => {
    const api = getApiClient();
    if (chatName.trim()) {
      const response = await api.chat.post({ title: chatName.trim() });
      if (response.data?.sessionId) {
        handleClose();
        router.push(`/chat/${response.data.sessionId}`);
      }
    }
  }, [chatName, handleClose, router]);

  // Navegação com teclado
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
      setIsOpen(true);
    });
    return () => {
      if (listener) listener();
    };
  }, [eventManager]);

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="w-11/12 max-w-md modal-box">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">Novo Chat</h3>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <fieldset className="fielset">
            <legend className="pb-2 text-sm">Nome do Chat</legend>
            <input
              ref={inputRef}
              type="text"
              placeholder="Digite o nome do novo chat..."
              className="hover:border-base-400 focus:border-base-400 focus:outline-none focus:ring-0 w-full input input-bordered"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              maxLength={50}
            />
          </fieldset>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button onClick={handleClose} className="btn btn-ghost">
            Sair
          </button>
          <button
            onClick={handleCreateChat}
            className="btn btn-primary"
            disabled={!chatName.trim()}
          >
            Criar
          </button>
        </div>
      </div>

      {/* Modal Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
