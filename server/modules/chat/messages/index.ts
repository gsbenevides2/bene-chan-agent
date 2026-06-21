import Elysia, { sse } from "elysia";
import Crypto from "crypto";
import { OpenRouterService } from "@/server/services/openrouter";
import { MessageService } from "./service";
import { MessageModel, ChatMessage, SendMessagePostReturn } from "./model";
import { ChatService } from "../service";

export type MessageReturn = AsyncGenerator<
  ReturnType<typeof sse<SendMessagePostReturn>>
>;

export const messageRoutes = new Elysia({
  prefix: "/:sessionId",
  tags: ["Message"],
})
  .get(
    "/messages",
    async ({ params }) => {
      const messages = await MessageService.getMessages(params.sessionId);
      return messages;
    },
    {
      params: MessageModel.GetMessagesParamSchema,
      response: MessageModel.GetMessagesResponseSchema,
      detail: {
        summary: "Get messages of a chat session",
        description:
          "Retrieve all messages associated with a specific chat session.",
      },
    },
  )
  .post(
    "/message",
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
      await MessageService.saveMessage(params.sessionId, messageData);
      yield sse({
        event: "message",
        data: {
          id: receivedMessageId,
          role: "user",
          content: body.message,
          timestamp: receivedMessageTimestamp,
        },
      });

      const model = await ChatService.getAgentModel(params.sessionId);

      const { systemTools, mcpTools } = await ChatService.getAgentTools(
        params.sessionId,
      );

      const mcpToolRefs =
        mcpTools.length > 0
          ? await ChatService.resolveMCPToolRefs(mcpTools)
          : undefined;

      const response = OpenRouterService.streamChat(
        model,
        await MessageService.getMessages(params.sessionId),
        params.sessionId,
        systemTools.length > 0 ? systemTools : undefined,
        mcpToolRefs,
      );
      for await (const message of response) {
        yield sse({
          event: "message",
          data: message,
        });
      }
    },
    {
      body: MessageModel.SendMessagePostBodySchema,
      params: MessageModel.SendMessagePostParamSchema,
      detail: {
        summary: "Send a message to the chat model",
        description:
          "Send a message to the chat model and receive a stream of responses.",
      },
    },
  );
