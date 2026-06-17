import { db } from "@/server/db";
import {
  mcpServers,
  mcpServerTools,
  SelectMcpServer,
  SelectMcpServerTools,
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { MCPClientService } from "@/server/services/mcp-client";
import { CreateMCPServerBody, UpdateMCPServerBody } from "./model";

function serializeServer(server: SelectMcpServer) {
  return {
    id: server.id,
    name: server.name,
    url: server.url,
    headers: (server.headers ?? []) as { key: string; value: string }[],
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

function serializeTool(tool: SelectMcpServerTools) {
  return {
    ...tool,
    createdAt: tool.createdAt.toISOString(),
  };
}

export class MCPServerService {
  static async create(data: CreateMCPServerBody) {
    const result = await db.insert(mcpServers).values(data).returning();
    const server = result.at(0);
    if (!server) throw new Error("Failed to create MCP server");

    const headers = (data.headers ?? []) as { key: string; value: string }[];
    await this.syncTools(server.id, server.url, headers);

    return this.getServerWithTools(server.id);
  }

  static async list() {
    const servers = await db.select().from(mcpServers);
    const serversWithTools = await Promise.all(
      servers.map(async (server) => {
        const tools = await this.getServerTools(server.id);
        return { ...serializeServer(server), tools: tools.map(serializeTool) };
      }),
    );
    return serversWithTools;
  }

  static async update(serverId: string, data: UpdateMCPServerBody) {
    const result = await db
      .update(mcpServers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mcpServers.id, serverId))
      .returning();
    const server = result.at(0);
    if (!server) throw new Error("MCP server not found");
    return serializeServer(server);
  }

  static async delete(serverId: string) {
    await db.delete(mcpServers).where(eq(mcpServers.id, serverId));
  }

  static async syncTools(
    serverId: string,
    url?: string,
    headers?: { key: string; value: string }[],
  ) {
    let serverUrl = url;
    let serverHeaders = headers;

    if (!serverUrl) {
      const server = await db
        .select()
        .from(mcpServers)
        .where(eq(mcpServers.id, serverId))
        .then((r) => r.at(0));
      if (!server) throw new Error("MCP server not found");
      serverUrl = server.url;
      serverHeaders = (server.headers ?? []) as {
        key: string;
        value: string;
      }[];
    }

    const tools = await MCPClientService.connectAndListTools(
      serverUrl,
      serverHeaders,
    );

    await db
      .delete(mcpServerTools)
      .where(eq(mcpServerTools.serverId, serverId));

    if (tools.length > 0) {
      await db.insert(mcpServerTools).values(
        tools.map((tool) => ({
          serverId,
          name: tool.name,
          description: tool.description ?? null,
          inputSchema: (tool.inputSchema as Record<string, unknown>) ?? null,
        })),
      );
    }

    return { syncedToolsCount: tools.length };
  }

  static async getServerTools(serverId: string) {
    return await db
      .select()
      .from(mcpServerTools)
      .where(eq(mcpServerTools.serverId, serverId));
  }

  static async getServerWithTools(serverId: string) {
    const server = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, serverId))
      .then((r) => r.at(0));
    if (!server) throw new Error("MCP server not found");
    const tools = await this.getServerTools(serverId);
    return { ...serializeServer(server), tools: tools.map(serializeTool) };
  }

  static async getToolsByNames(serverId: string, toolNames: string[]) {
    return await db
      .select()
      .from(mcpServerTools)
      .where(
        eq(mcpServerTools.serverId, serverId) &&
          inArray(mcpServerTools.name, toolNames),
      );
  }
}
