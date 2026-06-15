import Elysia from "elysia";
import { ChatModel } from "./model";
import { ChatService } from "./service";
import { messageRoutes } from "./messages";

export const chat = new Elysia({
  prefix: "/chat",
  tags: ["Chat"],
})
  .use(messageRoutes)
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
      },
    },
  );
