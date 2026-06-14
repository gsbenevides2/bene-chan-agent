import { z } from "zod";

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  systemPrompt: z.string(),
  tools: z.array(z.string()),
});

export const CreateAgentBodySchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  tools: z.array(z.string()).default([]),
});

export const UpdateAgentBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  systemPrompt: z.string().min(1).optional(),
  tools: z.array(z.string()).optional(),
});

export const UpdateAgentParamSchema = z.object({
  agentId: z.string().uuid(),
});

export const ListAgentsResponseSchema = z.array(AgentSchema);

export const AgentModel = {
  AgentSchema,
  CreateAgentBodySchema,
  UpdateAgentBodySchema,
  UpdateAgentParamSchema,
  ListAgentsResponseSchema,
};

export type Agent = z.infer<typeof AgentSchema>;
export type CreateAgentBody = z.infer<typeof CreateAgentBodySchema>;
export type UpdateAgentBody = z.infer<typeof UpdateAgentBodySchema>;