import { db } from "@/src/db";
import { chatSessions } from "@/src/db/schema";
import { eq } from "drizzle-orm";

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
}
