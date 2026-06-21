import { z } from "zod";

export const ModelSchema = z.object({
  id: z.string().meta({
    title: "Model ID",
    description: "Canonical slug for the model (e.g. openai/gpt-4o)",
    example: "openai/gpt-4o",
  }),
  name: z.string().meta({
    title: "Model Name",
    description: "Display name of the model",
    example: "GPT-4o",
  }),
  provider: z.string().meta({
    title: "Provider",
    description: "Provider name extracted from the model ID",
    example: "OpenAI",
  }),
  description: z.string().optional().meta({
    title: "Description",
    description: "Description of the model",
    example: "Optimized for speed and quality",
  }),
});

export const ListModelsResponseSchema = z.array(ModelSchema).meta({
  title: "List Models Response",
  description: "An array of available models from OpenRouter",
});

export const ModelsModel = {
  ModelSchema,
  ListModelsResponseSchema,
};

export type Model = z.infer<typeof ModelSchema>;
