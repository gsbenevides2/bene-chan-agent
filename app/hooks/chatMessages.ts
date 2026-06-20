import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiClient } from "@/app/utils/client";
import { ChatMessage } from "@/server/modules/chat/messages/model";
import { useAlert } from "./useAlert";

export function useMessages(sessionId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { error } = useAlert();

  const sendMessage = useCallback(
    (message: string) => {
      const apiClient = getApiClient();
      apiClient
        .chat({ sessionId })
        .message.post({
          message,
        })
        .then(async (response: { error?: unknown; data?: unknown }) => {
          if (response.error) return;
          const data = response.data as AsyncIterable<Record<string, unknown>>;
          for await (const msg of data) {
            const msgData = msg.data as Record<string, unknown>;
            if (msg.event === "error") {
              error(msgData.message as string);
              continue;
            }
            setMessages((prev) => {
              const messageIndex = prev.findIndex((m) => m.id === msgData.id);
              if (messageIndex !== -1) {
                const updatedMessages = [...prev];
                updatedMessages[messageIndex] = msgData as ChatMessage;
                return updatedMessages;
              } else {
                return [...prev, msgData as ChatMessage];
              }
            });
          }
        })
        .catch((err: unknown) => {
          console.error("Error sending message:", err);
        });
    },
    [sessionId, error],
  );

  useEffect(() => {
    const apiClient = getApiClient();
    apiClient
      .chat({ sessionId })
      .messages.get()
      .then((response: { error?: unknown; data?: ChatMessage[] }) => {
        if (response.error) {
          error("Erro ao carregar mensagens");
          return;
        }
        setMessages(response.data ?? []);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Error fetching messages:", err);
        setIsLoading(false);
      });
  }, [error, sessionId]);

  const values = useMemo(
    () => ({
      messages,
      sendMessage,
    }),
    [messages, sendMessage],
  );

  return values;
}
