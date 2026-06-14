import * as p from "drizzle-orm/pg-core";

export const agents = p.pgTable("agents", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  name: p.text().notNull(),
  systemPrompt: p.text().notNull(),
  tools: p.text().array().notNull().default([]),
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

export type SelectChatSession = typeof chatSessions.$inferSelect;
export type SelectToolCall = typeof toolCalls.$inferSelect;
export type SelectMessage = typeof messages.$inferSelect;
export type SelectAgents = typeof agents.$inferSelect;
