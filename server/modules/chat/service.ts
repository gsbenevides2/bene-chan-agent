import { db } from "@/server/db";
import { chatSessions, messages } from "@/server/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { ChatMessage } from "./model";

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
    await db
      .insert(messages)
      .values({
        id: message.id,
        chatSessionId: sessionId,
        role: message.role,
        type: message.type,
        text: message.text,
        toolName: message.toolName,
        toolArgs: message.toolArgs,
        toolResult: message.toolResult,
        timestamp: message.timestamp,
      })
      .onConflictDoUpdate({
        target: messages.id,
        set: {
          role: message.role,
          type: message.type,
          text: message.text,
          toolName: message.toolName,
          toolArgs: message.toolArgs,
          toolResult: message.toolResult,
          timestamp: message.timestamp,
        },
      });
  }

  static async saveMultipleMessages(
    sessionId: string,
    messagesToSave: ChatMessage[],
  ) {
    const insertValues = messagesToSave.map((message) => ({
      id: message.id,
      chatSessionId: sessionId,
      role: message.role,
      type: message.type,
      text: message.text,
      toolName: message.toolName,
      toolArgs: message.toolArgs,
      toolResult: message.toolResult,
      timestamp: message.timestamp,
    }));
    await db
      .insert(messages)
      .values(insertValues)
      .onConflictDoUpdate({
        target: messages.id,
        set: {
          role: sql`excluded.role`,
          type: sql`excluded.type`,
          text: sql`excluded.text`,
          toolName: sql`excluded.tool_name`,
          toolArgs: sql`excluded.tool_args`,
          toolResult: sql`excluded.tool_result`,
          timestamp: sql`excluded.timestamp`,
        },
      });
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatSessionId, sessionId))
      .orderBy(messages.timestamp);

    return result.map((row) => ({
      id: row.id,
      role: row.role,
      type: row.type,
      text: row.text ?? undefined,
      toolName: row.toolName ?? undefined,
      toolArgs: row.toolArgs ?? undefined,
      toolResult: row.toolResult ?? undefined,
      timestamp: row.timestamp,
    }));
  }
}
