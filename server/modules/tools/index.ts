import Elysia from "elysia";
import { ToolModel } from "./model";
import { ToolService } from "@/server/services/tools";
import { MCPServerService } from "@/server/modules/mcp-servers/service";
import { MCPClientService } from "@/server/services/mcp-client";
import z from "zod";

export const tools = new Elysia({
  prefix: "/tools",
})
  .get(
    "/",
    async () => {
      const systemTools = ToolService.systemTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: z.toJSONSchema(tool.parameters),
        source: "system" as const,
      }));

      const mcpServers = await MCPServerService.list();
      const mcpTools = mcpServers.flatMap((server) =>
        server.tools.map((tool) => ({
          name: tool.name,
          description: tool.description ?? "",
          parameters: (tool.inputSchema as Record<string, unknown>) ?? {},
          source: "mcp" as const,
          serverId: server.id,
          serverName: server.name,
        })),
      );

      return [...systemTools, ...mcpTools];
    },
    {
      response: ToolModel.GETToolSchemaResponse,
      detail: {
        summary: "List all tools available",
        description: "Returns all tools available in the plataform",
        tags: ["Tools"],
      },
    },
  )
  .post(
    "/call",
    async ({ body }) => {
      if (body.serverId) {
        const server = await MCPServerService.getServerWithTools(body.serverId);
        const headers = (server.headers ?? []) as {
          key: string;
          value: string;
        }[];
        try {
          const result = await MCPClientService.callTool(
            server.url,
            body.name,
            body.args as Record<string, unknown> | undefined,
            headers,
          );
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "MCP tool call failed",
          };
        }
      }

      const result = await ToolService.callTool(
        body.name,
        body.args as Record<string, unknown> | undefined,
      );
      return result;
    },
    {
      body: ToolModel.CallToolPostBodySchema,
      response: ToolModel.CallToolPostResponseSchema,
      detail: {
        summary: "Call a tool directly",
        description: "Execute a system tool with the given arguments",
        tags: ["Tools"],
      },
    },
  );
