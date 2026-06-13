import { ChatMessage, ToolResultMessage } from "@/server/modules/chat/model";
import { OpenRouter } from "@openrouter/sdk";
import { ChatService } from "../modules/chat/service";
import {
  ChatFinishReasonEnum,
  ChatMessages,
  ChatToolCall,
} from "@openrouter/sdk/models";
import { receivedMessagesProcessor } from "../utils/openRouterMessageProcessor";

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
    newMessages: ChatMessage[],
    chatId: string,
  ): AsyncGenerator<ChatMessage, void, unknown> {
    const parsedHistory = this.transformHistory(newMessages);
    const stream = await this.openRouter.chat.send({
      chatRequest: {
        model: "openai/gpt-4o",
        messages: parsedHistory,
        stream: true,
        sessionId: chatId,
        tools: this.getFakeTool(),
      },
    });

    const processor = receivedMessagesProcessor();
    let finalMessages: ChatMessage[] = [];
    let finishReason: ChatFinishReasonEnum | null = null;

    for await (const chunk of stream) {
      const firstChoice = chunk.choices[0];
      if (!firstChoice) continue;
      if (firstChoice.finishReason) {
        finalMessages = processor.alreadyProcessedMessages;
        finishReason = firstChoice.finishReason;
        break;
      }
      const message = processor.receiveStreamingMessage(firstChoice);
      if (message) {
        yield message;
      }
    }
    await ChatService.saveMultipleMessages(chatId, finalMessages);

    if (finishReason === "tool_calls") {
      const allToolCalls = finalMessages.flatMap((msg) =>
        "toolCalls" in msg && msg.toolCalls ? msg.toolCalls : [],
      );
      const toolCallsResults: ToolResultMessage[] = [];

      for (const toolCall of allToolCalls) {
        const toolResult = await this.callTool(
          toolCall.toolName,
          toolCall.toolArgs,
        );
        const toolResultMessage: ToolResultMessage = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          role: "tool",
          content: JSON.stringify(toolResult),
          toolCallId: toolCall.toolId,
          toolName: toolCall.toolName,
        };
        toolCallsResults.push(toolResultMessage);
        yield toolResultMessage;
      }
      await ChatService.saveMultipleMessages(chatId, toolCallsResults);
      if (toolCallsResults.length > 0) {
        finalMessages = [...newMessages, ...finalMessages, ...toolCallsResults];
        const message = this.streamChat(finalMessages, chatId);
        for await (const msg of message) {
          yield msg;
        }
      }
    }
  }

  static async callTool(
    toolName: string,
    toolArgs: unknown,
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
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

  static transformHistory(history: ChatMessage[]): ChatMessages[] {
    const messages = history.map<ChatMessages | null>((msg) => {
      if (msg.role === "user") {
        return {
          role: "user" as const,
          content: msg.content || "",
        };
      } else if (msg.role === "assistant") {
        const toolCalls: ChatToolCall[] | undefined = msg.toolCalls
          ? msg.toolCalls.map((toolCall) => ({
              type: "function" as const,
              id: toolCall.toolId,
              function: {
                name: toolCall.toolName,
                arguments: toolCall.toolArgs || "",
              },
            }))
          : undefined;
        return {
          role: "assistant" as const,
          content: msg.content || "",
          toolCalls: toolCalls?.length ? toolCalls : undefined,
        };
      } else if (msg.role === "tool") {
        return {
          role: "tool" as const,
          content: msg.content || "",
          toolCallId: msg.toolCallId || "",
        };
      }
      return null;
    });
    return messages.filter((msg) => !!msg) as ChatMessages[];
  }
}
