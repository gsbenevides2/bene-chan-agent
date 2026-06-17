import z, { ZodObject, ZodUndefined } from "zod";
import { GetWeather } from "./getWeather";
import { Result, Tool } from "./types";
import { MCPClientService } from "../mcp-client";

interface MCPToolRef {
  serverId: string;
  toolName: string;
  serverUrl: string;
  headers?: { key: string; value: string }[];
  inputSchema?: Record<string, unknown>;
}

export class ToolService {
  static systemTools: Tool<ZodObject | ZodUndefined, unknown>[] = [
    new GetWeather(),
  ];

  static getToolsDefinition(filter: string[] = [], mcpTools?: MCPToolRef[]) {
    const systemDefs =
      filter.length === 0 || filter.includes("all")
        ? this.systemTools
        : this.systemTools.filter((tool) => filter.includes(tool.name));

    const definitions: {
      type: "function";
      function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
      };
    }[] = systemDefs.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: z.toJSONSchema(tool.parameters) as Record<string, unknown>,
      },
    }));

    if (mcpTools) {
      for (const mcpTool of mcpTools) {
        definitions.push({
          type: "function" as const,
          function: {
            name: mcpTool.toolName,
            description: "",
            parameters: (mcpTool.inputSchema ?? {}) as Record<string, unknown>,
          },
        });
      }
    }

    return definitions;
  }

  static async callTool(
    toolName: string,
    toolArgs: Record<string, unknown> | undefined,
    mcpTools?: MCPToolRef[],
  ): Promise<Result<unknown>> {
    const systemTool = this.systemTools.find((tool) => tool.name === toolName);
    if (systemTool) {
      return systemTool.run(toolArgs);
    }

    if (mcpTools) {
      const mcpTool = mcpTools.find((t) => t.toolName === toolName);
      if (mcpTool) {
        try {
          const result = await MCPClientService.callTool(
            mcpTool.serverUrl,
            toolName,
            toolArgs,
            mcpTool.headers,
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
    }

    return {
      success: false,
      error: "Unavailable tool",
    };
  }
}
