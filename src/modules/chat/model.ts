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

export const MessageSchema = z.object({
  id: z.uuid().meta({
    title: "Message ID",
    description: "Unique identifier for the message",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  role: z.enum(["user", "assistant"]).meta({
    title: "Role",
    description: "Role of the message sender",
    example: "user",
  }),
  type: z.enum(["text", "toolCall", "toolResult"]).meta({
    title: "Type",
    description: "Type of the message",
    example: "text",
  }),
  text: z.string().optional().meta({
    title: "Text",
    description: "Content of the message, if type is 'text'",
    example: "Hello, how can I help you?",
  }),
  toolName: z.string().optional().meta({
    title: "Tool Name",
    description: "Name of the tool called, if type is 'toolCall'",
    example: "get_weather",
  }),
  toolArgs: z.record(z.string(), z.unknown()).optional().meta({
    title: "Tool Arguments",
    description: "Arguments passed to the tool, if type is 'toolCall'",
  }),
  toolResult: z.unknown().optional().meta({
    title: "Tool Result",
    description: "Result returned by the tool, if type is 'toolResult'",
  }),
  timestamp: z.number().meta({
    title: "Timestamp",
    description: "Unix timestamp of when the message was created",
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
});

export const CreateChatSessionPostResponseSchema = z.object({
  sessionId: z.uuidv4().meta({
    title: "Session ID",
    description: "The ID of the newly created chat session",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

// POST /chat/:sessionId/message
export const SendMessagePostBodySchema = z.object({
  message: z.string().meta({
    title: "Message",
    description: "The content of the message to be sent",
    example: "Hello, how can I help you?",
  }),
});

export const SendMessagePostParamSchema = z.object({
  sessionId: z.uuidv4().meta({
    title: "Session ID",
    description: "The ID of the chat session",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const SendMessagePostResponseSchema = z.object({
  event: z.string().meta({
    title: "Event",
    description: "The type of the event, e.g., 'message'",
    example: "message",
  }),
  data: MessageSchema.meta({
    title: "Data",
    description: "The message data associated with the event",
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

export const ChatModel = {
  MessageSchema,
  SendMessagePostBodySchema,
  SendMessagePostParamSchema,
  SendMessagePostResponseSchema,
  CreateChatSessionPostBodySchema,
  CreateChatSessionPostResponseSchema,
  ListChatSessionsResponseSchema,
  DeleteChatSessionParamSchema,
  DeleteChatSessionResponseSchema,
};

export type ChatMessage = z.infer<typeof MessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
