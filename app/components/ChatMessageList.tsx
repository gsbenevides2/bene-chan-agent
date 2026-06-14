"use client";

import { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import ChatMessageBubble from "./ChatMessageBubble";
import { ChatMessage } from "@/server/modules/chat/model";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleMessages = messages.filter((m) => m.role !== "system");

  if (visibleMessages.length === 0) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center p-4 text-base-content/50">
        <MessageSquare className="mb-4 w-16 h-16 opacity-30" />
        <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
        <p className="text-sm">Inicie uma conversa digitando abaixo</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 overflow-y-auto">
      {visibleMessages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
