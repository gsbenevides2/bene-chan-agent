import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiClient } from "@/app/utils/client";
import { ChatMessage } from "@/server/modules/chat/model";
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
        .then(async (response) => {
          if (response.error) return;
          const data = await response.data;
          for await (const msg of data) {
            if (msg.event === "error") {
              error(msg.data.message);
              continue;
            }
            setMessages((prev) => {
              const messageIndex = prev.findIndex((m) => m.id === msg.data.id);
              if (messageIndex !== -1) {
                const updatedMessages = [...prev];
                updatedMessages[messageIndex] = msg.data;
                return updatedMessages;
              } else {
                return [...prev, msg.data];
              }
            });
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    },
    [sessionId, error],
  );

  useEffect(() => {
    const apiClient = getApiClient();
    apiClient
      .chat({ sessionId })
      .messages.get()
      .then((response) => {
        if (response.error) {
          error("Erro ao carregar mensagens");
          return;
        }
        setMessages(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
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
