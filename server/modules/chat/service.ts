import { db } from "@/server/db";
import {
  agents,
  chatSessions,
  mcpServers,
  mcpServerTools,
} from "@/server/db/schema";
import { count, eq, ilike, inArray } from "drizzle-orm";
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

  static async getChat(sessionId: string) {
    const result = await db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        createdAt: chatSessions.createdAt,
        agentId: chatSessions.agentId,
        model: chatSessions.model,
        effectiveModel: agents.model,
      })
      .from(chatSessions)
      .innerJoin(agents, eq(chatSessions.agentId, agents.id))
      .where(eq(chatSessions.id, sessionId));
    const session = result.at(0);
    if (!session) throw new Error("Chat session not found");
    return {
      ...session,
      model: session.model ?? session.effectiveModel,
    };
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

  static async getAgentTools(sessionId: string) {
    const result = await db
      .select({ tools: agents.tools, mcpTools: agents.mcpTools })
      .from(chatSessions)
      .innerJoin(agents, eq(chatSessions.agentId, agents.id))
      .where(eq(chatSessions.id, sessionId));

    const row = result.at(0);
    return {
      systemTools: (row?.tools ?? []) as string[],
      mcpTools: (row?.mcpTools ?? []) as {
        serverId: string;
        toolName: string;
      }[],
    };
  }

  static async getAgentModel(sessionId: string) {
    const result = await db
      .select({
        sessionModel: chatSessions.model,
        agentModel: agents.model,
      })
      .from(chatSessions)
      .innerJoin(agents, eq(chatSessions.agentId, agents.id))
      .where(eq(chatSessions.id, sessionId));

    const row = result.at(0);
    if (!row) throw new Error("Chat session not found");

    return (row.sessionModel ?? row.agentModel) as string;
  }

  static async updateSessionModel(
    sessionId: string,
    model: string,
  ) {
    await db
      .update(chatSessions)
      .set({ model })
      .where(eq(chatSessions.id, sessionId));
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

  static async resolveMCPToolRefs(
    mcpTools: { serverId: string; toolName: string }[],
  ) {
    const serverIds = [...new Set(mcpTools.map((t) => t.serverId))];
    const servers = await db
      .select()
      .from(mcpServers)
      .where(inArray(mcpServers.id, serverIds));

    const serverMap = new Map(servers.map((s) => [s.id, s]));

    const allTools = await db
      .select()
      .from(mcpServerTools)
      .where(inArray(mcpServerTools.serverId, serverIds));

    const toolMap = new Map(
      allTools.map((t) => [`${t.serverId}:${t.name}`, t]),
    );

    return mcpTools
      .map((ref) => {
        const server = serverMap.get(ref.serverId);
        const tool = toolMap.get(`${ref.serverId}:${ref.toolName}`);
        if (!server || !tool) return null;
        return {
          serverId: ref.serverId,
          toolName: ref.toolName,
          serverUrl: server.url,
          headers: (server.headers ?? []) as { key: string; value: string }[],
          inputSchema: tool.inputSchema as Record<string, unknown> | undefined,
        };
      })
      .filter((ref): ref is NonNullable<typeof ref> => ref !== null);
  }
}
