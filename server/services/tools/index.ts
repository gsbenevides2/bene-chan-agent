import z, { ZodObject, ZodUndefined } from "zod";
import { GetWeather } from "./getWeather";
import { Result, Tool } from "./types";
import { MCPClientService } from "../mcp-client";
import { WriteFile } from "./writeFile";
import { EditFile } from "./editFile";
import { Mkdir } from "./mkdir";
import { DeleteFile } from "./deleteFile";
import { EditFiles } from "./editFiles";
import { ReadFiles } from "./readFiles";
import { ReadDir } from "./readDir";
import { WriteFiles } from "./writeFiles";
import { GitCreateBranch } from "./gitCreateBranch";
import { GitCommit } from "./gitCommit";
import { GitPush } from "./gitPush";
import { GitInit } from "./gitInit";
import { GitDiff } from "./gitDiff";
import { GhRepoCreate } from "./ghRepoCreate";
import { GhPrCreate } from "./ghPrCreate";
import { GhPrView } from "./ghPrView";
import { OpencodeCli } from "./opencodeCli";
import { Cwd } from "./cwd";
import { Terminal } from "./terminal";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { BeneChanSemConv } from "@/server/telemetry/semconv";

interface MCPToolRef {
  serverId: string;
  toolName: string;
  serverUrl: string;
  headers?: { key: string; value: string }[];
  inputSchema?: Record<string, unknown>;
}

const tracer = trace.getTracer("bene-chan");

export class ToolService {
  static systemTools: Tool<ZodObject | ZodUndefined, unknown>[] = [
    new GetWeather(),
    new WriteFile(),
    new EditFile(),
    new Mkdir(),
    new DeleteFile(),
    new EditFiles(),
    new ReadFiles(),
    new ReadDir(),
    new WriteFiles(),
    new GitCreateBranch(),
    new GitCommit(),
    new GitPush(),
    new GhRepoCreate(),
    new GhPrCreate(),
    new GhPrView(),
    new GitInit(),
    new GitDiff(),
    new OpencodeCli(),
    new Cwd(),
    new Terminal(),
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
    return tracer.startActiveSpan(`tool.callTool.${toolName}`, async (span) => {
      span.setAttribute(BeneChanSemConv.TOOL_NAME, toolName);
      span.setAttribute(
        BeneChanSemConv.TOOL_ARGS,
        JSON.stringify(toolArgs).slice(0, 2000),
      );

      try {
        const systemTool = this.systemTools.find(
          (tool) => tool.name === toolName,
        );
        if (systemTool) {
          const result = await systemTool.run(toolArgs);
          span.setAttribute(BeneChanSemConv.TOOL_TYPE, "system");
          span.setAttribute(
            BeneChanSemConv.TOOL_RESULT,
            JSON.stringify(result).slice(0, 2000),
          );
          return result;
        }

        if (mcpTools) {
          const mcpTool = mcpTools.find((t) => t.toolName === toolName);
          if (mcpTool) {
            span.setAttribute(BeneChanSemConv.TOOL_TYPE, "mcp");
            try {
              const mcpResult = await MCPClientService.callTool(
                mcpTool.serverUrl,
                toolName,
                toolArgs,
                mcpTool.headers,
              );
              const result: Result<unknown> = { success: true, result: mcpResult };
              span.setAttribute(
                BeneChanSemConv.TOOL_RESULT,
                JSON.stringify(result).slice(0, 2000),
              );
              return result;
            } catch (error) {
              const result: Result<unknown> = {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "MCP tool call failed",
              };
              return result;
            }
          }
        }

        const result: Result<unknown> = {
          success: false,
          error: "Unavailable tool",
        };
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
