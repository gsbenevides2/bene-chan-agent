import z, { ZodObject, ZodUndefined } from "zod";
import { GetWeather } from "./getWeather";
import { Result, Tool } from "./types";

export class ToolService {
  static systemTools: Tool<ZodObject | ZodUndefined, unknown>[] = [
    new GetWeather(),
  ];

  static getToolsDefinition(filter: string[] = []) {
    const tools = filter.length === 0 || filter.includes("all")
      ? this.systemTools
      : this.systemTools.filter((tool) => filter.includes(tool.name));

    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: z.toJSONSchema(tool.parameters),
      },
    }));
  }

  static async callTool(
    toolName: string,
    toolArgs: Record<string, unknown> | undefined,
  ): Promise<Result<unknown>> {
    const findedTool = this.systemTools.find((tool) => tool.name === toolName);
    if (!findedTool) {
      return {
        success: false as const,
        error: "Unavailable tool",
      };
    }
    return findedTool.run(toolArgs);
  }
}