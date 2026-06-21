import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { BeneChanSemConv } from "@/server/telemetry/semconv";

export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface Header {
  key: string;
  value: string;
}

const tracer = trace.getTracer("bene-chan");

export class MCPClientService {
  static async connectAndListTools(
    url: string,
    headers?: Header[],
  ): Promise<MCPToolDefinition[]> {
    return tracer.startActiveSpan("mcp.connectAndListTools", async (span) => {
      span.setAttribute(BeneChanSemConv.MCP_SERVER_URL, url);
      try {
        const baseUrl = new URL(url);
        const client = new Client(
          { name: "bene-chan-agent", version: "1.0.0" },
          { capabilities: {} },
        );
        const transport = new StreamableHTTPClientTransport(baseUrl, {
          requestInit: headers ? this.buildRequestInit(headers) : undefined,
        });
        await client.connect(transport);

        try {
          const result = await client.listTools();
          const tools = result.tools.map((tool) => ({
            name: tool.name,
            description: tool.description ?? undefined,
            inputSchema: tool.inputSchema
              ? (tool.inputSchema as Record<string, unknown>)
              : undefined,
          }));
          span.setAttribute(BeneChanSemConv.MCP_TOOL_COUNT, tools.length);
          return tools;
        } finally {
          await client.close();
        }
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  static async callTool(
    url: string,
    toolName: string,
    args: Record<string, unknown> | undefined,
    headers?: Header[],
  ): Promise<unknown> {
    return tracer.startActiveSpan(`mcp.callTool.${toolName}`, async (span) => {
      span.setAttribute(BeneChanSemConv.MCP_SERVER_URL, url);
      span.setAttribute(BeneChanSemConv.MCP_TOOL_NAME, toolName);
      span.setAttribute(
        BeneChanSemConv.MCP_TOOL_ARGS,
        JSON.stringify(args).slice(0, 2000),
      );
      try {
        const baseUrl = new URL(url);
        const client = new Client(
          { name: "bene-chan-agent", version: "1.0.0" },
          { capabilities: {} },
        );
        const transport = new StreamableHTTPClientTransport(baseUrl, {
          requestInit: headers ? this.buildRequestInit(headers) : undefined,
        });
        await client.connect(transport);

        try {
          const result = await client.callTool({
            name: toolName,
            arguments: args,
          });
          span.setAttribute(
            BeneChanSemConv.MCP_TOOL_RESULT,
            JSON.stringify(result).slice(0, 2000),
          );
          return result;
        } finally {
          await client.close();
        }
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  private static buildRequestInit(headers: Header[]): RequestInit {
    const record: Record<string, string> = {};
    for (const h of headers) {
      if (h.key.trim()) {
        record[h.key.trim()] = h.value;
      }
    }
    return { headers: record };
  }
}
