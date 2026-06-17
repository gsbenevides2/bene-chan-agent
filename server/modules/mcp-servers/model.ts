import { z } from "zod";

const HeaderSchema = z.object({
  key: z.string().min(1).meta({
    title: "Header Key",
    description: "Name of the HTTP header",
    example: "Authorization",
  }),
  value: z.string().meta({
    title: "Header Value",
    description: "Value of the HTTP header",
    example: "Bearer token123",
  }),
});

export const MCPServerSchema = z.object({
  id: z.string().uuid().meta({
    title: "Server ID",
    description: "Unique identifier for the MCP server",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().meta({
    title: "Server Name",
    description: "Name of the MCP server",
    example: "GitHub MCP Server",
  }),
  url: z.string().meta({
    title: "Server URL",
    description: "HTTP URL of the MCP server",
    example: "https://mcp.example.com",
  }),
  headers: z.array(HeaderSchema).meta({
    title: "Headers",
    description: "Custom HTTP headers sent to the server",
    example: [{ key: "Authorization", value: "Bearer token123" }],
  }),
  createdAt: z.string().meta({
    title: "Created At",
    description: "Timestamp when the server was created",
    example: "2024-01-01T00:00:00.000Z",
  }),
  updatedAt: z.string().meta({
    title: "Updated At",
    description: "Timestamp when the server was last updated",
    example: "2024-01-01T00:00:00.000Z",
  }),
});

export const MCPServerToolSchema = z.object({
  id: z.string().uuid().meta({
    title: "Tool ID",
    description: "Unique identifier for the tool",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  serverId: z.string().uuid().meta({
    title: "Server ID",
    description: "UUID of the parent MCP server",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().meta({
    title: "Tool Name",
    description: "Name of the tool",
    example: "create-pr",
  }),
  description: z.string().nullable().meta({
    title: "Tool Description",
    description: "Description of what the tool does",
    example: "Creates a pull request on GitHub",
  }),
  inputSchema: z
    .unknown()
    .nullable()
    .meta({
      title: "Input Schema",
      description: "JSON Schema defining the tool's input parameters",
      example: {
        type: "object",
        properties: { title: { type: "string" } },
      },
    }),
  createdAt: z.string().meta({
    title: "Created At",
    description: "Timestamp when the tool was discovered",
    example: "2024-01-01T00:00:00.000Z",
  }),
});

export const MCPServerWithToolsSchema = MCPServerSchema.extend({
  tools: z.array(MCPServerToolSchema).meta({
    title: "Tools",
    description: "List of tools exposed by this MCP server",
    example: [],
  }),
});

export const CreateMCPServerBodySchema = z.object({
  name: z.string().min(1).max(200).meta({
    title: "Server Name",
    description: "Name of the MCP server (1-200 characters)",
    example: "GitHub MCP Server",
  }),
  url: z.string().url().meta({
    title: "Server URL",
    description: "HTTP URL of the MCP server",
    example: "https://mcp.example.com",
  }),
  headers: z
    .array(HeaderSchema)
    .default([])
    .meta({
      title: "Headers",
      description: "Custom HTTP headers sent to the server",
      example: [{ key: "Authorization", value: "Bearer token123" }],
    }),
});

export const UpdateMCPServerBodySchema = z.object({
  name: z.string().min(1).max(200).optional().meta({
    title: "Server Name",
    description: "Name of the MCP server (1-200 characters)",
    example: "GitHub MCP Server",
  }),
  url: z.string().url().optional().meta({
    title: "Server URL",
    description: "HTTP URL of the MCP server",
    example: "https://mcp.example.com",
  }),
  headers: z
    .array(HeaderSchema)
    .optional()
    .meta({
      title: "Headers",
      description: "Custom HTTP headers sent to the server",
      example: [{ key: "Authorization", value: "Bearer token123" }],
    }),
});

export const MCPServerParamSchema = z.object({
  serverId: z.string().uuid().meta({
    title: "Server ID",
    description: "UUID of the MCP server",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const ListMCPServersResponseSchema = z
  .array(MCPServerWithToolsSchema)
  .meta({
    title: "MCP Servers List",
    description: "List of all MCP servers with their tools",
    example: [],
  });

export const SyncMCPServerResponseSchema = z.object({
  syncedToolsCount: z.number().meta({
    title: "Synced Tools Count",
    description: "Number of tools synced from the MCP server",
    example: 5,
  }),
});

export const MCPModel = {
  MCPServerSchema,
  MCPServerToolSchema,
  MCPServerWithToolsSchema,
  CreateMCPServerBodySchema,
  UpdateMCPServerBodySchema,
  MCPServerParamSchema,
  ListMCPServersResponseSchema,
  SyncMCPServerResponseSchema,
};

export type MCPServer = z.infer<typeof MCPServerSchema>;
export type MCPServerTool = z.infer<typeof MCPServerToolSchema>;
export type MCPServerWithTools = z.infer<typeof MCPServerWithToolsSchema>;
export type CreateMCPServerBody = z.infer<typeof CreateMCPServerBodySchema>;
export type UpdateMCPServerBody = z.infer<typeof UpdateMCPServerBodySchema>;
