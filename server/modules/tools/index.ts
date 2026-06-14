import Elysia from "elysia";
import { ToolModel } from "./model";

export const tools = new Elysia({
  prefix: "/tools",
}).get(
  "/",
  () => {
    return [];
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
