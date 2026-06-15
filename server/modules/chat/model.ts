import { z } from "zod";

export const ChatSessionSchema = z.object({
  id: z.uuid().meta({
    title: "Chat Session ID",
    description: "Unique identifier for the chat session",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  title: z.string().meta({
    title: "Chat Session Title",
    description: "The title of the chat session",
    example: "My Chat Session",
  }),
  createdAt: z.date().meta({
    title: "Created At",
    description: "The date and time when the chat session was created",
    example: "2024-01-01T12:00:00Z",
  }),
});

// GET /chat
export const ListChatSessionsResponseSchema = z.array(ChatSessionSchema).meta({
  title: "List Chat Sessions Response",
  description: "An array of chat sessions",
});

// POST /chat
export const CreateChatSessionPostBodySchema = z.object({
  title: z.string().nonoptional().meta({
    title: "Chat Session Title",
    description: "The title of the chat session to be created",
    example: "My Chat Session",
  }),
  agentId: z.string().uuid().meta({
    title: "Agent ID",
    description: "The ID of the agent to associate with this chat session",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const CreateChatSessionPostResponseSchema = z.object({
  sessionId: z.uuidv4().meta({
    title: "Session ID",
    description: "The ID of the newly created chat session",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

// DELETE /chat/:sessionId
export const DeleteChatSessionParamSchema = z.object({
  sessionId: z.uuidv4().meta({
    title: "Session ID",
    description: "The ID of the chat session to be deleted",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const DeleteChatSessionResponseSchema = z.object({
  success: z.boolean().meta({
    title: "Success",
    description: "Indicates whether the chat session was successfully deleted",
    example: true,
  }),
});

// PUT /chat/:sessionId
export const UpdateChatSessionParamSchema = z.object({
  sessionId: z.uuidv4().meta({
    title: "Session ID",
    description: "The ID of the chat session to be updated",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const UpdateChatSessionBodySchema = z.object({
  title: z.string().nonoptional().meta({
    title: "Chat Session Title",
    description: "The new title of the chat session",
    example: "Updated Chat Session Title",
  }),
});

export const UpdateChatSessionResponseSchema = z.object({
  success: z.boolean().meta({
    title: "Success",
    description: "Indicates whether the chat session was successfully updated",
    example: true,
  }),
});

export const SearchChatSessionsQuerySchema = z.object({
  q: z.string().min(1),
});

export const ChatModel = {
  ChatSessionSchema,
  CreateChatSessionPostBodySchema,
  CreateChatSessionPostResponseSchema,
  ListChatSessionsResponseSchema,
  DeleteChatSessionParamSchema,
  DeleteChatSessionResponseSchema,
  UpdateChatSessionParamSchema,
  UpdateChatSessionBodySchema,
  UpdateChatSessionResponseSchema,
  SearchChatSessionsQuerySchema,
};

export type ChatSession = z.infer<typeof ChatSessionSchema>;