import * as p from "drizzle-orm/pg-core";

export const chatSessions = p.pgTable("chat_sessions", {
  id: p.uuid("id").primaryKey().defaultRandom(),
  title: p.text("title").notNull(),
  createdAt: p.timestamp("created_at").notNull().defaultNow(),
});
