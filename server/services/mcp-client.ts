import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface Header {
  key: string;
  value: string;
}

export class MCPClientService {
  static async connectAndListTools(
    url: string,
    headers?: Header[],
  ): Promise<MCPToolDefinition[]> {
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
      return tools;
    } finally {
      await client.close();
    }
  }

  static async callTool(
    url: string,
    toolName: string,
    args: Record<string, unknown> | undefined,
    headers?: Header[],
  ): Promise<unknown> {
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
      return result;
    } finally {
      await client.close();
    }
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
