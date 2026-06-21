import { drizzle } from "drizzle-orm/bun-sql";
import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";

const rawDb = drizzle(Bun.env.DATABASE_URL!);
export const db = instrumentDrizzleClient(rawDb, {
  dbSystem: "postgresql",
  captureQueryText: true,
  maxQueryTextLength: 2000,
});
