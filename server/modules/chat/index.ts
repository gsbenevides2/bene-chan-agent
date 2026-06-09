import Elysia, { sse } from "elysia";
import { ChatModel, SendMessagePostReturn } from "./model";
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
  .post(
    "/",
    async ({ body }) => {
      const sessionId = await ChatService.createChat(body.title);
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
      await ChatService.saveMessage(params.sessionId, {
        id: receivedMessageId,
        role: "user",
        type: "text",
        text: body.message,
        timestamp: receivedMessageTimestamp,
      });
      yield sse({
        event: "message",
        data: {
          id: receivedMessageId,
          role: "user",
          type: "text",
          text: body.message,
          timestamp: receivedMessageTimestamp,
        },
      });

      const response = OpenRouterService.streamChat(
        body.message,
        async (finalMessages) => {
          await ChatService.saveMultipleMessages(
            params.sessionId,
            finalMessages,
          );
        },
      );
      let lastMessageId = "";
      for await (const message of response) {
        if (!lastMessageId) lastMessageId = message.id;
        if (lastMessageId !== message.id) {
        }
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
