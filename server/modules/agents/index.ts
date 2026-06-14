import { Elysia } from "elysia";
import { AgentModel } from "./model";
import { AgentService } from "./service";

export const agents = new Elysia({
  prefix: "/agents",
})
  .post(
    "/",
    async ({ body }) => {
      return await AgentService.createAgent(body);
    },
    {
      body: AgentModel.CreateAgentBodySchema,
      response: AgentModel.AgentSchema,
      detail: {
        summary: "Create a new agent",
        description: "Create a new agent with name and system prompt.",
        tags: ["Agents"],
      },
    },
  )
  .get(
    "/",
    async () => {
      return await AgentService.listAgents();
    },
    {
      response: AgentModel.ListAgentsResponseSchema,
      detail: {
        summary: "List all agents",
        description: "Retrieve a list of all existing agents.",
        tags: ["Agents"],
      },
    },
  )
  .get(
    "/search",
    async ({ query }) => {
      return await AgentService.searchAgents(query.q);
    },
    {
      query: AgentModel.SearchAgentsQuerySchema,
      response: AgentModel.ListAgentsResponseSchema,
      detail: {
        summary: "Search agents",
        description: "Search agents by name.",
        tags: ["Agents"],
      },
    },
  )
  .put(
    "/:agentId",
    async ({ params, body }) => {
      return await AgentService.updateAgent(params.agentId, body);
    },
    {
      params: AgentModel.UpdateAgentParamSchema,
      body: AgentModel.UpdateAgentBodySchema,
      response: AgentModel.AgentSchema,
      detail: {
        summary: "Update an agent",
        description: "Update the name and/or system prompt of an agent.",
        tags: ["Agents"],
      },
    },
  );