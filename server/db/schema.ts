import * as p from "drizzle-orm/pg-core";

export const agents = p.pgTable("agents", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  name: p.text().notNull(),
  systemPrompt: p.text().notNull(),
});

export const chatSessions = p.pgTable("chat_sessions", {
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
});

export const roleEnum = p.pgEnum("role", ["user", "assistant", "tool"]);

export const toolCalls = p.pgTable("tool_calls", {
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
});

export const messages = p.pgTable("messages", {
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
});

export type SelectChatSession = typeof chatSessions.$inferSelect;
export type SelectToolCall = typeof toolCalls.$inferSelect;
export type SelectMessage = typeof messages.$inferSelect;
export type SelectAgents = typeof agents.$inferSelect;
