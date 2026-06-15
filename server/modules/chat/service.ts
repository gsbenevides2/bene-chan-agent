import { db } from "@/server/db";
import {
  agents,
  chatSessions,
} from "@/server/db/schema";
import { count, eq, ilike } from "drizzle-orm";
import { AgentService } from "../agents/service";
import { MessageService } from "./messages/service";

export class ChatService {
  static async createChat(title: string, agentId: string) {
    const agent = await AgentService.getAgent(agentId);
    if (!agent) throw new Error("Agent is unavailable");
    const result = await db
      .insert(chatSessions)
      .values({ title, agentId })
      .returning();
    const chatId = result.at(0)?.id;
    if (!chatId) throw new Error("Failed to create chat session");

    await MessageService.saveMessage(chatId, {
      role: "system",
      content: agent.systemPrompt,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    });

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

  static async getAgentTools(sessionId: string): Promise<string[]> {
    const result = await db
      .select({ tools: agents.tools })
      .from(chatSessions)
      .innerJoin(agents, eq(chatSessions.agentId, agents.id))
      .where(eq(chatSessions.id, sessionId));

    return result.at(0)?.tools ?? [];
  }

  static async updateChat(sessionId: string, newTitle: string) {
    await db
      .update(chatSessions)
      .set({ title: newTitle })
      .where(eq(chatSessions.id, sessionId));
  }

  static async searchChats(query: string) {
    return await db
      .select()
      .from(chatSessions)
      .where(ilike(chatSessions.title, `%${query}%`))
      .limit(10);
  }
}