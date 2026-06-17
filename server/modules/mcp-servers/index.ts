import Elysia from "elysia";
import { MCPModel } from "./model";
import { MCPServerService } from "./service";

export const mcpServers = new Elysia({
  prefix: "/mcp-servers",
  tags: ["MCP Servers"],
})
  .post(
    "/",
    async ({ body }) => {
      return await MCPServerService.create(body);
    },
    {
      body: MCPModel.CreateMCPServerBodySchema,
      response: MCPModel.MCPServerWithToolsSchema,
      detail: {
        summary: "Create an MCP server",
        description: "Creates a new MCP server and syncs its tools.",
      },
    },
  )
  .get(
    "/",
    async () => {
      return await MCPServerService.list();
    },
    {
      response: MCPModel.ListMCPServersResponseSchema,
      detail: {
        summary: "List all MCP servers",
        description: "Returns all MCP servers with their tools.",
      },
    },
  )
  .put(
    "/:serverId",
    async ({ params, body }) => {
      return await MCPServerService.update(params.serverId, body);
    },
    {
      params: MCPModel.MCPServerParamSchema,
      body: MCPModel.UpdateMCPServerBodySchema,
      response: MCPModel.MCPServerSchema,
      detail: {
        summary: "Update an MCP server",
        description: "Updates the name and/or URL of an MCP server.",
      },
    },
  )
  .delete(
    "/:serverId",
    async ({ params }) => {
      await MCPServerService.delete(params.serverId);
    },
    {
      params: MCPModel.MCPServerParamSchema,
      detail: {
        summary: "Delete an MCP server",
        description: "Deletes an MCP server and its tools (cascade).",
      },
    },
  )
  .post(
    "/:serverId/sync",
    async ({ params }) => {
      return await MCPServerService.syncTools(params.serverId);
    },
    {
      params: MCPModel.MCPServerParamSchema,
      response: MCPModel.SyncMCPServerResponseSchema,
      detail: {
        summary: "Sync MCP server tools",
        description: "Connects to the MCP server and refreshes its tools list.",
      },
    },
  );
