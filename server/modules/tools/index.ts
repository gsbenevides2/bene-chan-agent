import Elysia from "elysia";
import { ToolModel } from "./model";
import { ToolService } from "@/server/services/tools";
import z from "zod";

export const tools = new Elysia({
  prefix: "/tools",
}).get(
  "/",
  () => {
    return ToolService.systemTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.parameters),
    }));
  },
  {
    response: ToolModel.GETToolSchemaResponse,
    detail: {
      summary: "List all tools available",
      description: "Returns all tools available in the plataform",
      tags: ["Tools"],
    },
  },
);
