"use client";
import ChatHeader from "@/app/components/ChatHeader";
import ChatMessageList from "@/app/components/ChatMessageList";
import ChatInputBar from "@/app/components/ChatInputBar";
import { useMessages } from "@/app/hooks/chatMessages";
import { use } from "react";

export default function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { messages, sendMessage } = useMessages(sessionId);

  return (
    <main className="flex flex-col flex-1 h-full">
      <div className="flex flex-col bg-base-100 h-full">
        <ChatHeader name={"Bene-chan Agent"} />
        <ChatMessageList messages={messages} />
        <ChatInputBar onSend={sendMessage} />
      </div>
    </main>
  );
}
