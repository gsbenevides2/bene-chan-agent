import { SchemaProperty } from "./types";

export function parseSchema(schema: Record<string, unknown>): {
  properties: SchemaProperty[];
} {
  const props = (schema.properties ?? {}) as Record<string, unknown>;
  const required = (schema.required ?? []) as string[];
  const entries = Object.entries(props).map(([name, prop]) => {
    const p = prop as Record<string, unknown>;
    return {
      name,
      type: (p.type as string) ?? "string",
      description: (p.description as string) ?? undefined,
      required: required.includes(name),
      enum: p.enum as unknown[] | undefined,
      items: p.items as Record<string, unknown> | undefined,
    };
  });
  return { properties: entries };
}
