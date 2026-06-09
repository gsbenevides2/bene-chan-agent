import { ChatMessage } from "@/server/modules/chat/model";
import { OpenRouter } from "@openrouter/sdk";
import Crypto from "crypto";

export class OpenRouterService {
  static async *streamChat(
    message: string,
    receiveAllFinalMessages: (messages: ChatMessage[]) => void,
  ): AsyncGenerator<ChatMessage, void, unknown> {
    const apiKey = Bun.env.OPENROUTER_API_KEY;
    let currentChatId = Crypto.randomUUID();
    let currentRole: "user" | "assistant" = "assistant";
    let messageString = "";

    const openRouter = new OpenRouter({
      apiKey,
    });
    const stream = await openRouter.chat.send({
      chatRequest: {
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: message }],
        stream: true,
      },
    });
    const finalMessages: ChatMessage[] = [];
    for await (const chunk of stream) {
      const firstChoice = chunk.choices[0];
      if (!firstChoice) continue;
      if (firstChoice.delta.role !== currentRole) {
        currentRole = firstChoice.delta.role || currentRole;
        messageString = "";
        currentChatId = Crypto.randomUUID();
      }
      const content = firstChoice.delta.content;
      if (content) {
        messageString += content;
        const message: ChatMessage = {
          id: currentChatId,
          role: currentRole,
          type: "text",
          text: messageString,
          timestamp: new Date(),
        };
        const hasInFinalMessages = finalMessages.some(
          (msg) => msg.id === message.id,
        );
        if (!hasInFinalMessages) {
          finalMessages.push(message);
        } else {
          const index = finalMessages.findIndex((msg) => msg.id === message.id);
          finalMessages[index] = message;
        }

        yield message;
      }
    }
    receiveAllFinalMessages(finalMessages);
  }
}
