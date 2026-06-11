import { ChatMessage } from "@/server/modules/chat/model";
import { OpenRouter } from "@openrouter/sdk";
import { ChatMessages } from "@openrouter/sdk/models";
import Crypto from "crypto";

export class OpenRouterService {
  static getFakeTool() {
    return [
      {
        type: "function" as const,
        function: {
          name: "get_current_weather",
          description: "Get the current weather in a given location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
              },
            },
          },
        },
      },
    ];
  }

  static async *streamChat(
    message: string,
    receiveAllFinalMessages: (messages: ChatMessage[]) => void,
  ): AsyncGenerator<ChatMessage, void, unknown> {
    const apiKey = Bun.env.OPENROUTER_API_KEY;
    let currentChatId = Crypto.randomUUID();
    let currentRole: "user" | "assistant" = "assistant";
    let messageString = "";
    let currentToolCallId = "";
    let currentToolCallName = "";
    let currentToolCallArgs = "";
    let lastMessageIsToolCall = false;

    const openRouter = new OpenRouter({
      apiKey,
    });
    const stream = await openRouter.chat.send({
      chatRequest: {
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: message }],
        stream: true,
        tools: this.getFakeTool(),
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
      const isToolCall = firstChoice.delta.toolCalls?.at(0);

      if (isToolCall) {
        lastMessageIsToolCall = true;

        const toolName = isToolCall.function?.name;
        const toolArgs = isToolCall.function?.arguments;
        const toolId = isToolCall.id;

        if (toolName && toolName !== currentToolCallName) {
          currentToolCallName = "";
          currentToolCallArgs = "";
          currentToolCallId = "";
        }

        if (toolName) {
          currentToolCallName = toolName;
        }
        if (toolId) {
          currentToolCallId = toolId;
        }
        if (toolArgs) {
          currentToolCallArgs += toolArgs;
        }
      }

      if (lastMessageIsToolCall && !isToolCall) {
        lastMessageIsToolCall = false;
        const toolResultMessage: ChatMessage = {
          id: Crypto.randomUUID(),
          role: "assistant",
          type: "toolCall",
          text: "",
          toolId: currentToolCallId,
          toolName: currentToolCallName,
          toolArgs: currentToolCallArgs,
          timestamp: new Date(),
        };
        console.log("Tool call finished. Result message:", toolResultMessage);
        finalMessages.push(toolResultMessage);
        yield toolResultMessage;
      }
    }
    receiveAllFinalMessages(finalMessages);
  }
  /*
  static transformHistory(history: ChatMessage[]): ChatMessages[] {
    return history.map((msg) => ({
      role: msg.role,
      content: msg.text,
    }));
  }
    */
}
