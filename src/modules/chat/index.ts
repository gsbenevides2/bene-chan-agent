import Elysia, { sse } from "elysia";
import { ChatModel } from "./model";
import Crypto from "crypto";
import { OpenRouterService } from "@/src/services/openrouter";
import { ChatService } from "./service";

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
  .post(
    "/:sessionId/message",
    async function* ({ body, params }) {
      yield sse({
        event: "message",
        data: {
          id: Crypto.randomUUID(),
          role: "user",
          type: "text",
          text: body.message,
          timestamp: Date.now(),
        },
      });

      const response = OpenRouterService.streamChat(body.message);
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
