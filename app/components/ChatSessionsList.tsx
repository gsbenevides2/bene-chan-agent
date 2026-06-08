"use client";

import { useState } from "react";
import { MessageSquare, Trash2, Edit3 } from "lucide-react";
import { ChatSession } from "@/src/modules/chat/model";

interface ChatSessionsListProps {
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newName: string) => void;
  chatSessions: ChatSession[]; // Aqui você passaria as sessões reais como prop
}

export default function ChatSessionsList({
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  chatSessions = [], // Aqui você passaria as sessões reais como prop
}: ChatSessionsListProps) {
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleEditStart = (session: ChatSession) => {
    setEditingSession(session.id);
    setEditName(session.title);
  };

  const handleEditSave = (sessionId: string) => {
    if (editName.trim()) {
      onRenameChat(sessionId, editName.trim());
    }
    setEditingSession(null);
    setEditName("");
  };

  const handleEditCancel = () => {
    setEditingSession(null);
    setEditName("");
  };

  return (
    <div className="bg-base-100 h-full">
      {/* Header */}
      <div className="p-4 border-base-200 border-b">
        <h2 className="font-semibold text-base-content text-lg">
          Sessões de Chat
        </h2>
        <p className="text-sm text-base-content/70">
          {chatSessions.length} conversas anteriores
        </p>
      </div>

      {/* Sessions List */}
      <div className="h-full overflow-y-auto">
        <ul className="list">
          {chatSessions.map((session) => (
            <li key={session.id} className="p-0">
              <div
                className="group hover:bg-base-200/50 p-4 w-full min-w-full transition-all duration-200 cursor-pointer"
                onClick={(e) => {
                  const tagName =
                    e.target instanceof HTMLElement
                      ? e.target.tagName.toLowerCase()
                      : "";
                  const hasDropdown = (
                    e.target as HTMLElement
                  ).classList.contains("dropdown");
                  if (hasDropdown) return; // Evita conflito com o menu dropdown
                  if (
                    tagName === "button" ||
                    tagName === "svg" ||
                    tagName === "path"
                  )
                    return; // Evita conflito com botões dentro do item
                  onSelectChat(session.id);
                }}
              >
                <div className="flex justify-between items-start">
                  {/* Chat Info */}
                  <div className="flex flex-1 items-start space-x-3 min-w-0">
                    {/* Chat Icon */}
                    <div className="avatar avatar-placeholder">
                      <div className="bg-primary rounded-full w-10 h-10 text-primary-content">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Chat Details */}
                    <div className="flex-1 min-w-0">
                      {/* Chat Name */}
                      {editingSession === session.id ? (
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 input input-sm input-bordered focus:input-primary"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleEditSave(session.id);
                              } else if (e.key === "Escape") {
                                handleEditCancel();
                              }
                            }}
                            placeholder="Nome da sessão"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSave(session.id);
                              }}
                              className="btn btn-primary btn-xs btn-circle"
                              aria-label="Salvar alterações"
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCancel();
                              }}
                              className="btn btn-ghost btn-xs btn-circle hover:btn-error"
                              aria-label="Cancelar edição"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <h3 className="font-medium text-base-content truncate">
                          {session.title}
                        </h3>
                      )}

                      {/* Last Message */}
                      <p className="mb-2 text-sm text-base-content/70 truncate">
                        {session.createdAt.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Menu */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(session);
                      }}
                      className="tooltip-left hover:bg-base-300 hover:text-info transition-colors btn btn-ghost btn-sm btn-circle tooltip"
                      aria-label="Renomear sessão"
                      data-tip="Renomear"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(session.id);
                      }}
                      className="tooltip-left hover:bg-error/10 hover:text-error transition-colors btn btn-ghost btn-sm btn-circle tooltip"
                      aria-label="Excluir sessão"
                      data-tip="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Empty State */}
        {chatSessions.length === 0 && (
          <div className="flex flex-col justify-center items-center p-8 h-64 text-center">
            <MessageSquare className="mb-4 w-16 h-16 text-base-content/30" />
            <h3 className="mb-2 font-medium text-base-content text-lg">
              Nenhuma sessão encontrada
            </h3>
            <p className="text-sm text-base-content/70">
              Suas conversas anteriores aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
