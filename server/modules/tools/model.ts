import z from "zod";

export const ToolSchema = z.object({
  name: z.string().meta({
    title: "Tool Name",
    description: "Unique name identifier for the tool",
    example: "get_current_weather",
  }),
  description: z.string().meta({
    title: "Tool Description",
    description: "Human-readable description of what the tool does",
    example: "Obtém as condições climáticas de uma localidade",
  }),
  parameters: z.unknown().meta({
    title: "Tool Parameters",
    description: "JSON Schema defining the parameters accepted by the tool",
    example: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "Localidade que se deseja obter",
        },
      },
      required: ["location"],
      additionalProperties: false,
    },
  }),
});

export const GETToolSchemaResponse = z.array(ToolSchema);

export const ToolModel = {
  ToolSchema,
  GETToolSchemaResponse,
};
