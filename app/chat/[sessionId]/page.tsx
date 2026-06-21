"use client";
import { useState, useEffect } from "react";
import ChatHeader from "@/app/components/ChatHeader";
import ChatMessageList from "@/app/components/ChatMessageList";
import ChatInputBar from "@/app/components/ChatInputBar";
import { useMessages } from "@/app/hooks/chatMessages";
import { use } from "react";
import { getApiClient } from "@/app/utils/client";

export default function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { messages, sendMessage } = useMessages(sessionId);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("Bene-chan Agent");

  useEffect(() => {
    const api = getApiClient();
    api
      .chat({ sessionId })
      .get()
      .then((res) => {
        if (!res.error && res.data) {
          const session = res.data as { model?: string | null };
          setCurrentModel(session.model ?? null);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  return (
    <main className="flex flex-col flex-1 h-full">
      <div className="flex flex-col bg-base-100 h-full">
        <ChatHeader name={agentName} model={currentModel} />
        <ChatMessageList messages={messages} />
        <ChatInputBar onSend={sendMessage} />
      </div>
    </main>
  );
}
