import z from "zod";

export const ToolSchema = z.object({
  name: z.string().meta({
    title: "Tool Name",
    description: "Unique name identifier for the tool",
    example: "get_current_weather",
  }),
  description: z.string().meta({
    title: "Tool Description",
    description: "Human-readable description of what the tool does",
    example: "Obtém as condições climáticas de uma localidade",
  }),
  parameters: z.unknown().meta({
    title: "Tool Parameters",
    description: "JSON Schema defining the parameters accepted by the tool",
    example: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "Localidade que se deseja obter",
        },
      },
      required: ["location"],
      additionalProperties: false,
    },
  }),
  source: z.enum(["system", "mcp"]).meta({
    title: "Source",
    description: "Whether this tool comes from the system or an MCP server",
    example: "system",
  }),
  serverId: z.string().optional().meta({
    title: "Server ID",
    description: "MCP server ID if the tool comes from an MCP server",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  serverName: z.string().optional().meta({
    title: "Server Name",
    description: "MCP server name if the tool comes from an MCP server",
    example: "GitHub MCP Server",
  }),
});

export const GETToolSchemaResponse = z.array(ToolSchema);

export const CallToolPostBodySchema = z.object({
  name: z.string().meta({
    title: "Tool Name",
    description: "Name of the tool to call",
    example: "get_current_weather",
  }),
  args: z.any().optional().meta({
    title: "Tool Arguments",
    description: "Arguments to pass to the tool",
    example: { location: "São Paulo" },
  }),
  serverId: z.string().optional().meta({
    title: "Server ID",
    description: "MCP server ID if calling an MCP tool",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const CallToolPostResponseSchema = z.object({
  success: z.boolean().meta({
    title: "Success",
    description: "Whether the tool call was successful",
    example: true,
  }),
  result: z.any().optional().meta({
    title: "Result",
    description: "Result returned by the tool on success",
    example: { location: "São Paulo", temperature: "22°C", condition: "Ensolarado" },
  }),
  error: z.string().optional().meta({
    title: "Error",
    description: "Error message if the tool call failed",
    example: "Unavailable tool",
  }),
});

export const ToolModel = {
  ToolSchema,
  GETToolSchemaResponse,
  CallToolPostBodySchema,
  CallToolPostResponseSchema,
};
