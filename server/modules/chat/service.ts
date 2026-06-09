import { db } from "@/server/db";
import { chatSessions } from "@/server/db/schema";
import { count, eq } from "drizzle-orm";

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
}
