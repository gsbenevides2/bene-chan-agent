import { db } from "@/server/db";
import { agents } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { CreateAgentBody, UpdateAgentBody } from "./model";

export class AgentService {
  static async createAgent(data: CreateAgentBody) {
    const result = await db.insert(agents).values(data).returning();
    const agent = result.at(0);
    if (!agent) throw new Error("Failed to create agent");
    return agent;
  }

  static async listAgents() {
    return await db.select().from(agents);
  }

  static async updateAgent(agentId: string, data: UpdateAgentBody) {
    const result = await db
      .update(agents)
      .set(data)
      .where(eq(agents.id, agentId))
      .returning();
    const agent = result.at(0);
    if (!agent) throw new Error("Agent not found");
    return agent;
  }
}