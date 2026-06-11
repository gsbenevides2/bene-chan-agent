import { ChatMessage } from "@/server/modules/chat/model";
import { OpenRouter } from "@openrouter/sdk";
import Crypto from "crypto";
import { ChatService } from "../modules/chat/service";

export class OpenRouterService {
  static openRouter = new OpenRouter({
    apiKey: Bun.env.OPENROUTER_API_KEY,
  });

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
      {
        type: "function" as const,
        function: {
          name: "get_news_headlines",
          description: "Get the latest news headlines",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description:
                  "The category of news to get headlines for, e.g. technology, sports, business",
              },
            },
          },
        },
      },
    ];
  }

  static async *streamChat(
    message: string,
    chatId: string,
  ): AsyncGenerator<ChatMessage, void, unknown> {
    let currentChatId = Crypto.randomUUID();
    let currentRole: "user" | "assistant" = "assistant";
    let messageString = "";
    let currentToolCallId = "";
    let currentToolCallName = "";
    let currentToolCallArgs = "";
    let lastMessageIsToolCall = false;

    const stream = await this.openRouter.chat.send({
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
    await ChatService.saveMultipleMessages(chatId, finalMessages);
    const hasToolCalls = finalMessages.some((msg) => msg.type === "toolCall");
    if (hasToolCalls) {
      const messages = await this.harness(chatId, finalMessages);
      for await (const message of messages) {
        yield message;
      }
    }
  }
  static async *harness(
    chatId: string,
    history: ChatMessage[],
  ): AsyncGenerator<ChatMessage, void, unknown> {
    const allToolCalls = history
      .filter((msg) => msg.type === "toolCall")
      .map((msg) => msg.toolId);
    const allToolsResults = history
      .filter((msg) => msg.type === "toolResult")
      .map((msg) => msg.toolId);
    const missingToolResults = allToolCalls.filter(
      (toolCallId) => !allToolsResults.includes(toolCallId || ""),
    );
    if (!missingToolResults.length) {
      return;
    }
    const results: ChatMessage[] = [];
    for (const toolCallId of missingToolResults) {
      const toolCallMessage = history.find(
        (msg) => msg.type === "toolCall" && msg.toolId === toolCallId,
      );
      if (!toolCallMessage) continue;
      const toolResult = await this.callTool(
        toolCallMessage.toolName || "",
        toolCallMessage.toolArgs,
      );
      const toolResultMessage: ChatMessage = {
        id: Crypto.randomUUID(),
        role: "assistant",
        type: "toolResult",
        text: "",
        toolId: toolCallMessage.toolId,
        toolName: toolCallMessage.toolName,
        toolResult: toolResult,
        toolArgs: toolCallMessage.toolArgs,
        timestamp: new Date(),
      };
      yield toolResultMessage;
      results.push(toolResultMessage);
    }

    await ChatService.saveMultipleMessages(chatId, results);
  }

  static async callTool(
    toolName: string,
    toolArgs: unknown,
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    // Simula a execução da ferramenta
    console.log(`Executando ferramenta: ${toolName} com argumentos:`, toolArgs);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (toolName === "get_current_weather") {
      const toolArgsA = toolArgs as { location: string };
      return {
        success: true,
        result: {
          location: toolArgsA.location,
          temperature: "22°C",
          condition: "Ensolarado",
        },
      };
    } else if (toolName === "get_news_headlines") {
      const toolArgsB = toolArgs as { category: string };
      return {
        success: true,
        result: [
          { title: "Notícia 1", category: toolArgsB.category },
          { title: "Notícia 2", category: toolArgsB.category },
          { title: "Notícia 3", category: toolArgsB.category },
        ],
      };
    } else {
      return {
        success: false,
        error: `Ferramenta desconhecida: ${toolName}`,
      };
    }
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
