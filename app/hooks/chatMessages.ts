import { useCallback, useRef, useState } from "react";
import { getApiClient } from "@/app/utils/client";
import { ChatMessage } from "@/src/modules/chat/model";

interface Event {
  event: string;
  data: ChatMessage;
}
type StremedResponse<T> = AsyncIterable<T>;

export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const sessionIdRef = useRef<string>("82a4efef-81b4-4c4c-9142-089f02c18116");

  const sendMessage = useCallback((message: string) => {
    const apiClient = getApiClient();
    apiClient.chat.message
      .post({
        message,
        sessionId: sessionIdRef.current,
      })
      .then(async (response) => {
        if (response.error) return;
        const data = (await response.data) as StremedResponse<Event>;
        for await (const msg of data) {
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
  }, []);

  return {
    messages,
    sendMessage,
  };
}
