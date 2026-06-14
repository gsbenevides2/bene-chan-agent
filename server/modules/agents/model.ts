import { z } from "zod";

export const AgentSchema = z.object({
  id: z.string().uuid().meta({
    title: "Agent ID",
    description: "Unique identifier for the agent",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().meta({
    title: "Agent Name",
    description: "Name of the agent",
    example: "Assistente Personalizado",
  }),
  systemPrompt: z.string().meta({
    title: "System Prompt",
    description: "System prompt defining the agent's behavior and personality",
    example: "Você é um assistente útil...",
  }),
  tools: z.array(z.string()).meta({
    title: "Tool Names",
    description: "List of tool names this agent can use. Use ['all'] to enable all tools",
    example: ["get_current_weather"],
  }),
});

export const CreateAgentBodySchema = z.object({
  name: z.string().min(1).max(100).meta({
    title: "Agent Name",
    description: "Name of the agent (1-100 characters)",
    example: "Assistente Personalizado",
  }),
  systemPrompt: z.string().min(1).meta({
    title: "System Prompt",
    description: "System prompt defining the agent's behavior and personality",
    example: "Você é um assistente útil e amigável.",
  }),
  tools: z.array(z.string()).default([]).meta({
    title: "Tool Names",
    description: "List of tool names this agent can use. Defaults to empty (no tools)",
    example: ["get_current_weather"],
  }),
});

export const UpdateAgentBodySchema = z.object({
  name: z.string().min(1).max(100).optional().meta({
    title: "Agent Name",
    description: "Name of the agent (1-100 characters)",
    example: "Assistente Personalizado",
  }),
  systemPrompt: z.string().min(1).optional().meta({
    title: "System Prompt",
    description: "System prompt defining the agent's behavior and personality",
    example: "Você é um assistente útil e amigável.",
  }),
  tools: z.array(z.string()).optional().meta({
    title: "Tool Names",
    description: "List of tool names this agent can use. Send ['all'] to enable all tools",
    example: ["get_current_weather"],
  }),
});

export const UpdateAgentParamSchema = z.object({
  agentId: z.string().uuid().meta({
    title: "Agent ID",
    description: "UUID of the agent to update",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const ListAgentsResponseSchema = z.array(AgentSchema);

export const SearchAgentsQuerySchema = z.object({
  q: z.string().min(1),
});

export const AgentModel = {
  AgentSchema,
  CreateAgentBodySchema,
  UpdateAgentBodySchema,
  UpdateAgentParamSchema,
  ListAgentsResponseSchema,
  SearchAgentsQuerySchema,
};

export type Agent = z.infer<typeof AgentSchema>;
export type CreateAgentBody = z.infer<typeof CreateAgentBodySchema>;
export type UpdateAgentBody = z.infer<typeof UpdateAgentBodySchema>;