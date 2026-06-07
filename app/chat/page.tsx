"use client";
import { useState } from "react";
import { ChatMessage, ChatMessageSide } from "@/app/types/chat";
import ChatHeader from "@/app/components/ChatHeader";
import ChatMessageList from "@/app/components/ChatMessageList";
import ChatInputBar from "@/app/components/ChatInputBar";

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const brLocale = "pt-BR";
  return date.toLocaleTimeString([brLocale], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    text: "Ola! Sou seu agente pessoal. Como posso ajudar voce hoje?",
    side: ChatMessageSide.RECEIVED,
    senderName: "Bene-Chan",
    timestamp: formatTimestamp(1780854309 - 1000 * 60 * 5),
  },
  {
    id: "2",
    text: "Oi! Gostaria de saber como posso criar uma nova tarefa no sistema.",
    side: ChatMessageSide.SENT,
    senderName: "Voce",
    timestamp: formatTimestamp(1780854309 - 1000 * 60 * 4),
  },
  {
    id: "3",
    text: "Claro! Voce pode criar uma nova tarefa usando o comando /nova ou acessando o menu de tarefas. Posso te ajudar com isso agora mesmo!",
    side: ChatMessageSide.RECEIVED,
    senderName: "Bene-Chan",
    timestamp: formatTimestamp(1780854309 - 1000 * 60 * 3),
  },
  {
    id: "4",
    text: "Perfeito, obrigado pela ajuda!",
    side: ChatMessageSide.SENT,
    senderName: "Voce",
    timestamp: formatTimestamp(1780854309 - 1000 * 60 * 2),
  },
  {
    id: "5",
    text: "Sempre a disposicao! Se precisar de mais alguma coisa, e so chamar.",
    side: ChatMessageSide.RECEIVED,
    senderName: "Bene-Chan",
    timestamp: formatTimestamp(1780854309 - 1000 * 60),
  },
];

const BOT_NAME = "Bene-Chan";

function createSentMessage(text: string): ChatMessage {
  return {
    id: Date.now().toString(),
    text,
    side: ChatMessageSide.SENT,
    senderName: "Voce",
    timestamp: formatTimestamp(Date.now()),
  };
}

function createReceivedMessage(text: string): ChatMessage {
  return {
    id: (Date.now() + 1).toString(),
    text,
    side: ChatMessageSide.RECEIVED,
    senderName: BOT_NAME,
    timestamp: formatTimestamp(Date.now()),
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const handleSend = (text: string) => {
    const newMessage = createSentMessage(text);
    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      const reply = createReceivedMessage(
        `Recebi sua mensagem: "${newMessage.text}"`,
      );
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  return (
    <main className="flex flex-col flex-1 h-full">
      <div className="flex flex-col bg-base-100 h-full">
        <ChatHeader name={BOT_NAME} />
        <ChatMessageList messages={messages} />
        <ChatInputBar onSend={handleSend} />
      </div>
    </main>
  );
}
