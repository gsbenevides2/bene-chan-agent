import { db } from "@/server/db";
import { agents, SelectAgents } from "@/server/db/schema";
import { eq, ilike } from "drizzle-orm";
import { CreateAgentBody, UpdateAgentBody } from "./model";

function serializeAgent(agent: SelectAgents) {
  return {
    ...agent,
    mcpTools: (agent.mcpTools ?? []) as {
      serverId: string;
      toolName: string;
    }[],
  };
}

export class AgentService {
  static async createAgent(data: CreateAgentBody) {
    const result = await db.insert(agents).values(data).returning();
    const agent = result.at(0);
    if (!agent) throw new Error("Failed to create agent");
    return serializeAgent(agent);
  }

  static async listAgents() {
    const result = await db.select().from(agents);
    return result.map(serializeAgent);
  }

  static async updateAgent(agentId: string, data: UpdateAgentBody) {
    const result = await db
      .update(agents)
      .set(data)
      .where(eq(agents.id, agentId))
      .returning();
    const agent = result.at(0);
    if (!agent) throw new Error("Agent not found");
    return serializeAgent(agent);
  }

  static async getAgent(agentId: string) {
    const result = await db.select().from(agents).where(eq(agents.id, agentId));
    const agent = result.at(0);
    if (!agent) return undefined;
    return serializeAgent(agent);
  }

  static async searchAgents(query: string) {
    const result = await db
      .select()
      .from(agents)
      .where(ilike(agents.name, `%${query}%`))
      .limit(10);
    return result.map(serializeAgent);
  }
}
