import Elysia, { sse } from "elysia";
import { ChatMessage, ChatModel, SendMessagePostReturn } from "./model";
import Crypto from "crypto";
import { OpenRouterService } from "@/server/services/openrouter";
import { ChatService } from "./service";

export type MessageReturn = AsyncGenerator<
  ReturnType<typeof sse<SendMessagePostReturn>>
>;

export const chat = new Elysia({
  prefix: "/chat",
})
  .get(
    "/",
    async () => {
      return await ChatService.listChats();
    },
    {
      response: ChatModel.ListChatSessionsResponseSchema,
      detail: {
        summary: "List all chat sessions",
        description: "Retrieve a list of all existing chat sessions.",
        tags: ["Chat"],
      },
    },
  )
  .get(
    "/search",
    async ({ query }) => {
      return await ChatService.searchChats(query.q);
    },
    {
      query: ChatModel.SearchChatSessionsQuerySchema,
      response: ChatModel.ListChatSessionsResponseSchema,
      detail: {
        summary: "Search chat sessions",
        description: "Search chat sessions by title.",
        tags: ["Chat"],
      },
    },
  )
  .post(
    "/",
    async ({ body }) => {
      const sessionId = await ChatService.createChat(body.title, body.agentId);
      return {
        sessionId,
      };
    },
    {
      body: ChatModel.CreateChatSessionPostBodySchema,
      response: ChatModel.CreateChatSessionPostResponseSchema,
      detail: {
        summary: "Create a new chat session",
        description:
          "Create a new chat session with an optional initial message.",
        tags: ["Chat"],
      },
    },
  )
  .delete(
    "/:sessionId",
    async ({ params }) => {
      await ChatService.deleteChat(params.sessionId);
      return {
        success: true,
      };
    },
    {
      params: ChatModel.DeleteChatSessionParamSchema,
      reponse: ChatModel.DeleteChatSessionResponseSchema,
      detail: {
        summary: "Delete a chat session",
        description: "Delete an existing chat session by its ID.",
        tags: ["Chat"],
      },
    },
  )
  .put(
    "/:sessionId",
    async ({ body, params }) => {
      await ChatService.updateChat(params.sessionId, body.title);
      return {
        success: true,
      };
    },
    {
      params: ChatModel.UpdateChatSessionParamSchema,
      body: ChatModel.UpdateChatSessionBodySchema,
      response: ChatModel.UpdateChatSessionResponseSchema,
      detail: {
        summary: "Update a chat session",
        description: "Update the title of an existing chat session by its ID.",
        tags: ["Chat"],
      },
    },
  )
  .get(
    "/:sessionId/messages",
    async ({ params }) => {
      const messages = await ChatService.getMessages(params.sessionId);
      return messages;
    },
    {
      params: ChatModel.GetMessagesParamSchema,
      response: ChatModel.GetMessagesResponseSchema,
      detail: {
        summary: "Get messages of a chat session",
        description:
          "Retrieve all messages associated with a specific chat session.",
        tags: ["Chat"],
      },
    },
  )
  .post(
    "/:sessionId/message",
    async function* ({ body, params }): MessageReturn {
      const chatExists = await ChatService.chatExists(params.sessionId);
      if (!chatExists) {
        yield sse({
          event: "error",
          data: {
            message: "Chat não encontrado!",
            code: "CHAT_SESSION_NOT_FOUND",
          },
        });
        return;
      }
      const receivedMessageId = Crypto.randomUUID();
      const receivedMessageTimestamp = new Date();
      const messageData: ChatMessage = {
        id: receivedMessageId,
        role: "user",
        content: body.message,
        timestamp: receivedMessageTimestamp,
      };
      await ChatService.saveMessage(params.sessionId, messageData);
      yield sse({
        event: "message",
        data: {
          id: receivedMessageId,
          role: "user",
          content: body.message,
          timestamp: receivedMessageTimestamp,
        },
      });

      const agentTools = await ChatService.getAgentTools(params.sessionId);

      const response = OpenRouterService.streamChat(
        await ChatService.getMessages(params.sessionId),
        params.sessionId,
        agentTools.length > 0 ? agentTools : undefined,
      );
      for await (const message of response) {
        yield sse({
          event: "message",
          data: message,
        });
      }
    },
    {
      body: ChatModel.SendMessagePostBodySchema,
      params: ChatModel.SendMessagePostParamSchema,
      detail: {
        summary: "Send a message to the chat model",
        description:
          "Send a message to the chat model and receive a stream of responses.",
        tags: ["Chat"],
      },
    },
  );
