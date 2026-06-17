import {
  ChatMessage,
  ToolResultMessage,
} from "@/server/modules/chat/messages/model";
import { OpenRouter } from "@openrouter/sdk";
import { MessageService } from "../modules/chat/messages/service";
import {
  ChatFinishReasonEnum,
  ChatMessages,
  ChatToolCall,
} from "@openrouter/sdk/models";
import { receivedMessagesProcessor } from "../utils/openRouterMessageProcessor";
import { ToolService } from "./tools";
import { ChatService } from "../modules/chat/service";

type McpTools = Awaited<ReturnType<typeof ChatService.resolveMCPToolRefs>>;

export class OpenRouterService {
  static openRouter = new OpenRouter({
    apiKey: Bun.env.OPENROUTER_API_KEY,
  });

  static async *streamChat(
    newMessages: ChatMessage[],
    chatId: string,
    toolsFilter?: string[],
    mcpTools?: McpTools,
  ): AsyncGenerator<ChatMessage, void, unknown> {
    const parsedHistory = this.transformHistory(newMessages);
    const stream = await this.openRouter.chat.send({
      chatRequest: {
        model: "openai/gpt-4o",
        messages: parsedHistory,
        stream: true,
        sessionId: chatId,
        tools: ToolService.getToolsDefinition(toolsFilter, mcpTools),
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
    await MessageService.saveMultipleMessages(chatId, finalMessages);

    if (finishReason === "tool_calls") {
      const allToolCalls = finalMessages.flatMap((msg) =>
        "toolCalls" in msg && msg.toolCalls ? msg.toolCalls : [],
      );
      const toolCallsResults: ToolResultMessage[] = [];

      for (const toolCall of allToolCalls) {
        const toolResult = await this.callTool(
          toolCall.toolName,
          toolCall.toolArgs,
          mcpTools,
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
      await MessageService.saveMultipleMessages(chatId, toolCallsResults);
      if (toolCallsResults.length > 0) {
        finalMessages = [...newMessages, ...finalMessages, ...toolCallsResults];
        const message = this.streamChat(
          finalMessages,
          chatId,
          toolsFilter,
          mcpTools,
        );
        for await (const msg of message) {
          yield msg;
        }
      }
    }
  }

  static async callTool(
    toolName: string,
    toolArgs: string | undefined,
    mcpTools?: McpTools,
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    return ToolService.callTool(
      toolName,
      toolArgs ? (JSON.parse(toolArgs) as Record<string, unknown>) : undefined,
      mcpTools,
    );
  }

  static transformHistory(history: ChatMessage[]): ChatMessages[] {
    const messages = history.map<ChatMessages | null>((msg) => {
      if (msg.role === "user") {
        return {
          role: "user" as const,
          content: msg.content || "",
        };
      }
      if (msg.role === "assistant") {
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
      }
      if (msg.role === "tool") {
        return {
          role: "tool" as const,
          content: msg.content || "",
          toolCallId: msg.toolCallId || "",
        };
      }
      if (msg.role === "system") {
        return {
          role: "system" as const,
          content: msg.content ?? "",
        };
      }
      return null;
    });
    return messages.filter((msg) => !!msg) as ChatMessages[];
  }
}
