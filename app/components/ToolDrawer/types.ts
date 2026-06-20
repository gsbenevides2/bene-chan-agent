export interface ToolParam {
  name: string;
  description: string;
  parameters: unknown;
  source: "system" | "mcp";
  serverId?: string;
  serverName?: string;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface SchemaProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  enum?: unknown[];
  items?: Record<string, unknown>;
}
