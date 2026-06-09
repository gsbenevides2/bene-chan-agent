import { useCallback, useState } from "react";
import { getApiClient } from "@/app/utils/client";
import { ChatMessage } from "@/server/modules/chat/model";
import { useAlert } from "./useAlert";

export function useMessages(sessionId: string) {
  console.log("Initializing useMessages with sessionId:", sessionId);
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
            console.log("Received message:", msg);
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

  return {
    messages,
    sendMessage,
  };
}
