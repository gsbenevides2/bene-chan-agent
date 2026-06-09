import * as p from "drizzle-orm/pg-core";

export const chatSessions = p.pgTable("chat_sessions", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  title: p.text("title").notNull(),
  createdAt: p
    .timestamp("created_at", {
      withTimezone: true,
    })
    .notNull()
    .defaultNow(),
});

export const roleEnum = p.pgEnum("role", ["user", "assistant"]);
export const typeEnum = p.pgEnum("type", ["text", "toolCall", "toolResult"]);

export const messages = p.pgTable("messages", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  chatSessionId: p
    .uuid("chat_session_id")
    .notNull()
    .references(() => chatSessions.id, {
      onDelete: "cascade",
    }),
  role: roleEnum("role").notNull(),
  type: typeEnum("type").notNull(),
  text: p.text("text"),
  toolName: p.text("tool_name"),
  toolArgs: p.jsonb("tool_args"),
  toolResult: p.jsonb("tool_result"),
  timestamp: p
    .timestamp("timestamp", {
      withTimezone: true,
    })
    .notNull(),
});
