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
  .get(
    "/:sessionId",
    async ({ params }) => {
      return await ChatService.getChat(params.sessionId);
    },
    {
      params: ChatModel.DeleteChatSessionParamSchema,
      response: ChatModel.ChatSessionSchema,
      detail: {
        summary: "Get a chat session",
        description: "Retrieve a chat session by its ID.",
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
  )
  .put(
    "/:sessionId/model",
    async ({ body, params }) => {
      await ChatService.updateSessionModel(params.sessionId, body.model);
      return {
        success: true,
      };
    },
    {
      params: ChatModel.UpdateChatModelParamSchema,
      body: ChatModel.UpdateChatModelBodySchema,
      response: ChatModel.UpdateChatModelResponseSchema,
      detail: {
        summary: "Update chat session model",
        description:
          "Update the model used by a specific chat session. This overrides the agent's default model.",
      },
    },
  );
