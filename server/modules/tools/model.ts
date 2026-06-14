import z from "zod";

export const ToolSchema = z.object({
  id: z.uuid().meta({
    title: "Tool ID",
    description: "Unique identifier for the tool",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const GETToolSchemaResponse = z.array(ToolSchema);

export const ToolModel = {
  ToolSchema,
  GETToolSchemaResponse,
};
