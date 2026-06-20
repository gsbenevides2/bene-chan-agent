import * as p from "drizzle-orm/pg-core";

export const agents = p.pgTable("agents", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  name: p.text().notNull(),
  systemPrompt: p.text().notNull(),
  tools: p.text().array().notNull().default([]),
  mcpTools: p.jsonb("mcp_tools").notNull().default([]),
});

export const chatSessions = p.pgTable(
  "chat_sessions",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    title: p.text("title").notNull(),
    createdAt: p
      .timestamp("created_at", {
        withTimezone: true,
      })
      .notNull()
      .defaultNow(),
    agentId: p
      .uuid("agent_id")
      .notNull()
      .references(() => agents.id, {
        onDelete: "restrict",
      }),
  },
  (table) => [p.index("idx_chat_sessions_agent_id").on(table.agentId)],
);

export const roleEnum = p.pgEnum("role", [
  "user",
  "assistant",
  "tool",
  "system",
]);

export const toolCalls = p.pgTable(
  "tool_calls",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    messageId: p
      .uuid("message_id")
      .notNull()
      .references(() => messages.id, {
        onDelete: "cascade",
      }),
    toolId: p.text("tool_id").notNull(),
    toolName: p.text("tool_name").notNull(),
    toolArgs: p.text("tool_args"),
    timestamp: p
      .timestamp("timestamp", {
        withTimezone: true,
      })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    p.index("idx_tool_calls_message_id").on(table.messageId),
    p
      .index("idx_tool_calls_message_id_timestamp")
      .on(table.messageId, table.timestamp),
  ],
);

export const messages = p.pgTable(
  "messages",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    chatSessionId: p
      .uuid("chat_session_id")
      .notNull()
      .references(() => chatSessions.id, {
        onDelete: "cascade",
      }),
    role: roleEnum("role").notNull(),
    toolCallId: p.text("tool_call_id"),
    toolName: p.text("tool_name"),
    content: p.text("content"),
    timestamp: p
      .timestamp("timestamp", {
        withTimezone: true,
      })
      .notNull(),
  },
  (table) => [
    p.index("idx_messages_chat_session_id").on(table.chatSessionId),
    p
      .index("idx_messages_chat_session_id_timestamp")
      .on(table.chatSessionId, table.timestamp),
  ],
);

export const mcpServers = p.pgTable("mcp_servers", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  name: p.text().notNull(),
  url: p.text().notNull(),
  headers: p.jsonb("headers").notNull().default([]),
  createdAt: p
    .timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: p
    .timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mcpServerTools = p.pgTable(
  "mcp_server_tools",
  {
    id: p.uuid("id").primaryKey().defaultRandom(),
    serverId: p
      .uuid("server_id")
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    name: p.text().notNull(),
    description: p.text(),
    inputSchema: p.jsonb("input_schema"),
    createdAt: p
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [p.index("idx_mcp_server_tools_server_id").on(table.serverId)],
);

export type SelectChatSession = typeof chatSessions.$inferSelect;
export type SelectToolCall = typeof toolCalls.$inferSelect;
export type SelectMessage = typeof messages.$inferSelect;
export type SelectAgents = typeof agents.$inferSelect;
export type SelectMcpServer = typeof mcpServers.$inferSelect;
export type SelectMcpServerTools = typeof mcpServerTools.$inferSelect;

export const notifications = p.pgTable("notifications", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  title: p.text().notNull(),
  description: p.text().notNull(),
  image: p.text(),
  link: p.text(),
  read: p.boolean().notNull().default(false),
  createdAt: p
    .timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pushSubscriptions = p.pgTable("push_subscriptions", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  endpoint: p.text().notNull().unique(),
  p256dhKey: p.text("p256dh_key").notNull(),
  authKey: p.text("auth_key").notNull(),
  userAgent: p.text("user_agent"),
  enabled: p.boolean().notNull().default(true),
  createdAt: p
    .timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SelectNotification = typeof notifications.$inferSelect;
export type SelectPushSubscription = typeof pushSubscriptions.$inferSelect;
