"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "@/app/types/chat";
import ChatMessageBubble from "./ChatMessageBubble";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
