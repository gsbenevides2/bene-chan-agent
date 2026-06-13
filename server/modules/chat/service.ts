import { db } from "@/server/db";
import {
  chatSessions,
  messages,
  SelectMessage,
  SelectToolCall,
  toolCalls,
} from "@/server/db/schema";
import { count, eq, inArray, sql } from "drizzle-orm";
import { ChatMessage, ToolCall } from "./model";
import { generateUpdateSet } from "@/server/db/utils";

export class ChatService {
  static async createChat(title: string) {
    const result = await db.insert(chatSessions).values({ title }).returning();
    const chatId = result.at(0)?.id;
    if (!chatId) throw new Error("Failed to create chat session");
    return chatId;
  }

  static async listChats() {
    const result = await db.select().from(chatSessions);
    return result;
  }

  static async deleteChat(sessionId: string) {
    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
  }

  static async chatExists(sessionId: string) {
    const result = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return Number(result.at(0)?.count) > 0;
  }

  static async updateChat(sessionId: string, newTitle: string) {
    await db
      .update(chatSessions)
      .set({ title: newTitle })
      .where(eq(chatSessions.id, sessionId));
  }

  static async saveMessage(sessionId: string, message: ChatMessage) {
    const dbRows = this.chatMessageToDbRows(sessionId, message);
    if (dbRows?.message) {
      console.log(dbRows.message);
      const { id, ...restWithNoId } = dbRows.message;
      await db.insert(messages).values(dbRows.message).onConflictDoUpdate({
        target: messages.id,
        set: restWithNoId,
      });
    }
    if (dbRows?.toolCalls.length) {
      await db
        .insert(toolCalls)
        .values(dbRows.toolCalls)
        .onConflictDoUpdate({
          target: toolCalls.id,
          set: generateUpdateSet(toolCalls, toolCalls.id),
        });
    }
  }

  static async saveMultipleMessages(
    sessionId: string,
    messagesToSave: ChatMessage[],
  ) {
    const groupedDbRows = messagesToSave.map((message) =>
      this.chatMessageToDbRows(sessionId, message),
    );
    const messagesList = groupedDbRows
      .flatMap((group) => group?.message)
      .filter((message) => message) as SelectMessage[];

    const toolCallsList = groupedDbRows
      .flatMap((group) => group?.toolCalls)
      .filter((toolCall) => toolCall) as SelectToolCall[];
    if (messagesList.length) {
      await db
        .insert(messages)
        .values(messagesList)
        .onConflictDoUpdate({
          target: messages.id,
          set: generateUpdateSet(messages, messages.id),
        });
    }

    if (toolCallsList.length) {
      await db
        .insert(toolCalls)
        .values(toolCallsList)
        .onConflictDoUpdate({
          target: toolCalls.id,
          set: generateUpdateSet(toolCalls, toolCalls.id),
        });
    }
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const dbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatSessionId, sessionId))
      .orderBy(messages.timestamp);
    const messagesIds = dbMessages.map((msg) => msg.id);
    const dbToolCalls = await db
      .select()
      .from(toolCalls)
      .where(inArray(toolCalls.messageId, messagesIds))
      .orderBy(toolCalls.timestamp);

    return dbMessages
      .map((messageRow) => {
        const relatedToolCalls = dbToolCalls.filter(
          (toolCallRow) => toolCallRow.messageId === messageRow.id,
        );
        return this.dbChatRowsToChatMessage(messageRow, relatedToolCalls);
      })
      .filter((msg): msg is ChatMessage => msg !== undefined);
  }

  private static chatMessageToDbRows(
    sessionId: string,
    receivedChatMessage: ChatMessage,
  ):
    | {
        message: SelectMessage;
        toolCalls: SelectToolCall[];
      }
    | undefined {
    if (receivedChatMessage.role === "assistant") {
      const toolCalls: SelectToolCall[] =
        receivedChatMessage.toolCalls?.map((toolCall) =>
          this.toolCallToDbRow(receivedChatMessage.id, toolCall),
        ) ?? [];
      const message: SelectMessage = {
        role: "assistant",
        id: receivedChatMessage.id,
        content: receivedChatMessage.content ?? null,
        chatSessionId: sessionId,
        timestamp: receivedChatMessage.timestamp,
      };
      return {
        message,
        toolCalls,
      };
    } else if (receivedChatMessage.role === "user") {
      const message: SelectMessage = {
        role: "user",
        id: receivedChatMessage.id,
        content: receivedChatMessage.content ?? null,
        chatSessionId: sessionId,
        timestamp: receivedChatMessage.timestamp,
      };
      return {
        message,
        toolCalls: [],
      };
    } else if (receivedChatMessage.role === "tool") {
      const message: SelectMessage = {
        role: "tool",
        id: receivedChatMessage.id,
        content: receivedChatMessage.content ?? null,
        chatSessionId: sessionId,
        timestamp: receivedChatMessage.timestamp,
      };
      return {
        message,
        toolCalls: [],
      };
    }
    return undefined;
  }

  private static toolCallToDbRow(
    messageId: string,
    toolCall: ToolCall,
  ): SelectToolCall {
    return {
      id: toolCall.id,
      messageId,
      toolId: toolCall.toolId,
      toolName: toolCall.toolName,
      toolArgs: JSON.stringify(toolCall.toolArgs),
      timestamp: toolCall.timestamp,
    };
  }

  private static dbChatRowsToChatMessage(
    messageRow: SelectMessage,
    toolCallRows: SelectToolCall[],
  ): ChatMessage | undefined {
    if (messageRow.role === "assistant") {
      const toolCalls: ToolCall[] = toolCallRows.map((toolCallRow) =>
        this.dbToolRowToToolCall(toolCallRow),
      );
      return {
        id: messageRow.id,
        role: "assistant",
        content: messageRow.content ?? undefined,
        toolCalls,
        timestamp: messageRow.timestamp,
      };
    } else if (messageRow.role === "user") {
      return {
        id: messageRow.id,
        role: "user",
        content: messageRow.content ?? undefined,
        timestamp: messageRow.timestamp,
      };
    } else if (messageRow.role === "tool") {
      return {
        id: messageRow.id,
        role: "tool",
        content: messageRow.content ?? undefined,
        timestamp: messageRow.timestamp,
      };
    }
  }

  private static dbToolRowToToolCall(toolCallRow: SelectToolCall): ToolCall {
    return {
      id: toolCallRow.id,
      toolId: toolCallRow.toolId,
      toolName: toolCallRow.toolName,
      toolArgs: toolCallRow.toolArgs ?? undefined,
      timestamp: toolCallRow.timestamp,
    };
  }
}
