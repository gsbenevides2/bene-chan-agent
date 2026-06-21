import { Elysia } from "elysia";
import { ModelsModel } from "./model";
import { ModelService } from "./service";

export const models = new Elysia({
  prefix: "/models",
})
  .get(
    "/",
    async () => {
      return await ModelService.listModels();
    },
    {
      response: ModelsModel.ListModelsResponseSchema,
      detail: {
        summary: "List all available models",
        description: "Retrieve a list of all available models from OpenRouter.",
        tags: ["Models"],
      },
    },
  );
