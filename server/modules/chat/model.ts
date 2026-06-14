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

export const ToolCallSchema = z.object({
  id: z.uuid().meta({
    title: "ToolCall ID",
    description: "Unique identifier for the message",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  toolId: z.string().meta({
    title: "Tool ID Of OpenRouter",
    description:
      "The identifier for the tool being called received from OpenRouter, if type is 'toolCall'",
    example: "get_weather",
  }),
  toolName: z.string().meta({
    title: "Tool Name",
    description: "Name of the tool called, if type is 'toolCall'",
    example: "get_weather",
  }),
  toolArgs: z.string().optional().meta({
    title: "Tool Arguments",
    description: "Arguments passed to the tool, if type is 'toolCall'",
    example: '{"location": "New York"}',
  }),
  timestamp: z.date().meta({
    title: "Timestamp",
    description: "The date and time when the tool call was made",
    example: "2024-01-01T12:00:00Z",
  }),
});
export const CommomMessageSchema = z.object({
  id: z.uuid().meta({
    title: "Message ID",
    description: "Unique identifier for the message",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  timestamp: z.date().meta({
    title: "Timestamp",
    description: "The date and time when the message was created",
    example: "2024-01-01T12:00:00Z",
  }),
});
export const AssistantMessageSchema = CommomMessageSchema.extend({
  role: z.literal("assistant").meta({
    title: "Role",
    description:
      "Role of the message sender, which is 'assistant' for this schema",
    example: "assistant",
  }),
  content: z.string().optional().meta({
    title: "Content",
    description: "Content of the assistant message",
    example: "The weather today is sunny with a high of 25°C.",
  }),
  toolCalls: z.array(ToolCallSchema).optional().meta({
    title: "List Of Tools Calls",
    description: "List of tools called in this message, if type is 'toolCall'",
  }),
});
export const UserMessageSchema = CommomMessageSchema.extend({
  role: z.literal("user").meta({
    title: "Role",
    description: "Role of the message sender, which is 'user' for this schema",
    example: "user",
  }),
  content: z.string().optional().meta({
    title: "Content",
    description: "Content of the user message",
    example: "What's the weather like today?",
  }),
});
export const ToolResultMessageSchema = CommomMessageSchema.extend({
  role: z.literal("tool").meta({
    title: "Role",
    description:
      "Role of the message sender, which is 'tool' for this schema representing the result of a tool call",
    example: "tool",
  }),
  toolName: z.string().optional().meta({
    title: "Tool Name",
    description: "Name of the tool that generated this result",
    example: "get_weather",
  }),
  toolCallId: z.string().optional().meta({
    title: "ToolCall ID",
    description:
      "The identifier for the tool call that generated this result, if type is 'toolResult'",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  content: z.string().optional().meta({
    title: "Content",
    description: "Content of the tool result message",
    example: "The weather today is sunny with a high of 25°C.",
  }),
});
export const SystemMessageSchema = CommomMessageSchema.extend({
  role: z.literal("system").meta({
    title: "Role",
    description:
      "Role of the message sender, which is 'system' for this schema representing the system message prompt",
  }),
  content: z.string().optional().meta({
    title: "Content",
    description: "Content of the tool result message",
    example: "The weather today is sunny with a high of 25°C.",
  }),
});

export const MessageSchema = z
  .union([
    AssistantMessageSchema,
    UserMessageSchema,
    ToolResultMessageSchema,
    SystemMessageSchema,
  ])
  .meta({
    title: "Chat Message",
    description:
      "A message in the chat session, which can be from the user, assistant, or a tool result",
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

// GET /chat/:sessionId/message
export const GetMessagesParamSchema = z.object({
  sessionId: z.uuidv4().meta({
    title: "Session ID",
    description: "The ID of the chat session to retrieve messages from",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const GetMessagesResponseSchema = z.array(MessageSchema).meta({
  title: "Get Messages Response",
  description: "An array of messages in the chat session",
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

export const SendMessagePostResponseMessageSchema = z.object({
  event: z.literal("message").meta({
    title: "Event",
    description: "The type of the event, e.g., 'message'",
    example: "message",
  }),
  data: MessageSchema.meta({
    title: "Data",
    description: "The message data associated with the event",
  }),
});
export const SendMessagePostResponseErrorSchema = z.object({
  event: z.literal("error").meta({
    title: "Event",
    description: "The type of the event, e.g., 'message'",
    example: "message",
  }),
  data: z
    .object({
      code: z.string().meta({
        title: "Error Code",
        description: "A machine-readable error code",
        example: "invalid_input",
      }),
      message: z.string().meta({
        title: "Error Message",
        description: "A human-readable error message",
        example: "The input provided is invalid.",
      }),
    })
    .meta({
      title: "Data",
      description: "The error data associated with the event",
    }),
});

export const SendMessagePostResponseSchema = z
  .union([
    SendMessagePostResponseMessageSchema,
    SendMessagePostResponseErrorSchema,
  ])
  .meta({
    title: "Send Message Post Response",
    description:
      "The response schema for sending a message, which can be either a message event or an error event",
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
// (Esquema para atualização de título da sessão, por exemplo)
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
  MessageSchema,
  ChatSessionSchema,
  GetMessagesParamSchema,
  GetMessagesResponseSchema,
  SendMessagePostBodySchema,
  SendMessagePostParamSchema,
  SendMessagePostResponseSchema,
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

export type ToolCall = z.infer<typeof ToolCallSchema>;
export type ToolResultMessage = z.infer<typeof ToolResultMessageSchema>;
export type ChatMessage = z.infer<typeof MessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type SendMessagePostReturn = z.infer<
  typeof SendMessagePostResponseSchema
>;
