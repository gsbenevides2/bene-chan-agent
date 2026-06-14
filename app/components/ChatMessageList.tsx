"use client";

import { useRef, useEffect } from "react";
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

  return (
    <div className="flex-1 space-y-4 p-4 overflow-y-auto">
      {visibleMessages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
