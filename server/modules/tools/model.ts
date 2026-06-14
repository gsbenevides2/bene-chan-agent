import z from "zod";

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.unknown(),
});

export const GETToolSchemaResponse = z.array(ToolSchema);

export const ToolModel = {
  ToolSchema,
  GETToolSchemaResponse,
};