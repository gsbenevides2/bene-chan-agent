import { db } from "@/server/db";
import {
  messages,
  SelectMessage,
  SelectToolCall,
  toolCalls,
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { ChatMessage, ToolCall } from "./model";
import { generateUpdateSet } from "@/server/db/utils";

export class MessageService {
  static async saveMessage(sessionId: string, message: ChatMessage) {
    const dbRows = chatMessageToDbRows(sessionId, message);
    if (dbRows?.message) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...restWithNoId } = dbRows.message;
      await db.insert(messages).values(dbRows.message).onConflictDoUpdate({
        target: messages.id,
        set: restWithNoId,
      });
    }
    if (dbRows?.toolCalls.length) {
      await db
        .insert(toolCalls)
        .values(dbRows.toolCalls)
        .onConflictDoUpdate({
          target: toolCalls.id,
          set: generateUpdateSet(toolCalls, toolCalls.id),
        });
    }
  }

  static async saveMultipleMessages(
    sessionId: string,
    messagesToSave: ChatMessage[],
  ) {
    const groupedDbRows = messagesToSave.map((message) =>
      chatMessageToDbRows(sessionId, message),
    );
    const messagesList = groupedDbRows
      .flatMap((group) => group?.message)
      .filter((message) => message) as SelectMessage[];

    const toolCallsList = groupedDbRows
      .flatMap((group) => group?.toolCalls)
      .filter((toolCall) => toolCall) as SelectToolCall[];
    if (messagesList.length) {
      await db
        .insert(messages)
        .values(messagesList)
        .onConflictDoUpdate({
          target: messages.id,
          set: generateUpdateSet(messages, messages.id),
        });
    }

    if (toolCallsList.length) {
      await db
        .insert(toolCalls)
        .values(toolCallsList)
        .onConflictDoUpdate({
          target: toolCalls.id,
          set: generateUpdateSet(toolCalls, toolCalls.id),
        });
    }
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const dbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatSessionId, sessionId))
      .orderBy(messages.timestamp);
    const messagesIds = dbMessages.map((msg) => msg.id);
    const dbToolCalls = await db
      .select()
      .from(toolCalls)
      .where(inArray(toolCalls.messageId, messagesIds))
      .orderBy(toolCalls.timestamp);

    return dbMessages
      .map((messageRow) => {
        const relatedToolCalls = dbToolCalls.filter(
          (toolCallRow) => toolCallRow.messageId === messageRow.id,
        );
        return dbChatRowsToChatMessage(messageRow, relatedToolCalls);
      })
      .filter((msg): msg is ChatMessage => msg !== undefined);
  }
}

function chatMessageToDbRows(
  sessionId: string,
  receivedChatMessage: ChatMessage,
):
  | {
      message: SelectMessage;
      toolCalls: SelectToolCall[];
    }
  | undefined {
  if (receivedChatMessage.role === "assistant") {
    const toolCallsRows: SelectToolCall[] =
      receivedChatMessage.toolCalls?.map((toolCall) =>
        toolCallToDbRow(receivedChatMessage.id, toolCall),
      ) ?? [];
    const message: SelectMessage = {
      role: "assistant",
      id: receivedChatMessage.id,
      content: receivedChatMessage.content ?? null,
      toolCallId: null,
      toolName: null,
      chatSessionId: sessionId,
      timestamp: receivedChatMessage.timestamp,
    };
    return {
      message,
      toolCalls: toolCallsRows,
    };
  } else if (receivedChatMessage.role === "user") {
    const message: SelectMessage = {
      role: "user",
      id: receivedChatMessage.id,
      content: receivedChatMessage.content ?? null,
      toolCallId: null,
      toolName: null,
      chatSessionId: sessionId,
      timestamp: receivedChatMessage.timestamp,
    };
    return {
      message,
      toolCalls: [],
    };
  } else if (receivedChatMessage.role === "tool") {
    const message: SelectMessage = {
      role: "tool",
      id: receivedChatMessage.id,
      content: receivedChatMessage.content ?? null,
      toolCallId: receivedChatMessage.toolCallId ?? null,
      chatSessionId: sessionId,
      toolName: receivedChatMessage.toolName ?? null,
      timestamp: receivedChatMessage.timestamp,
    };
    return {
      message,
      toolCalls: [],
    };
  } else if (receivedChatMessage.role === "system") {
    const message: SelectMessage = {
      role: "system",
      id: receivedChatMessage.id,
      content: receivedChatMessage.content ?? null,
      toolCallId: null,
      toolName: null,
      chatSessionId: sessionId,
      timestamp: receivedChatMessage.timestamp,
    };
    return {
      message,
      toolCalls: [],
    };
  }
  return undefined;
}

function toolCallToDbRow(
  messageId: string,
  toolCall: ToolCall,
): SelectToolCall {
  return {
    id: toolCall.id,
    messageId,
    toolId: toolCall.toolId,
    toolName: toolCall.toolName,
    toolArgs: JSON.stringify(toolCall.toolArgs),
    timestamp: toolCall.timestamp,
  };
}

function dbChatRowsToChatMessage(
  messageRow: SelectMessage,
  toolCallRows: SelectToolCall[],
): ChatMessage | undefined {
  if (messageRow.role === "assistant") {
    const toolCallsRows: ToolCall[] = toolCallRows.map((toolCallRow) =>
      dbToolRowToToolCall(toolCallRow),
    );
    return {
      id: messageRow.id,
      role: "assistant",
      content: messageRow.content ?? undefined,
      toolCalls: toolCallsRows,
      timestamp: messageRow.timestamp,
    };
  } else if (messageRow.role === "user") {
    return {
      id: messageRow.id,
      role: "user",
      content: messageRow.content ?? undefined,
      timestamp: messageRow.timestamp,
    };
  } else if (messageRow.role === "tool") {
    return {
      id: messageRow.id,
      role: "tool",
      content: messageRow.content ?? undefined,
      timestamp: messageRow.timestamp,
      toolCallId: messageRow.toolCallId ?? undefined,
      toolName: messageRow.toolName ?? undefined,
    };
  } else if (messageRow.role === "system") {
    return {
      id: messageRow.id,
      role: "system",
      content: messageRow.content ?? undefined,
      timestamp: messageRow.timestamp,
    };
  }
}

function dbToolRowToToolCall(toolCallRow: SelectToolCall): ToolCall {
  return {
    id: toolCallRow.id,
    toolId: toolCallRow.toolId,
    toolName: toolCallRow.toolName,
    toolArgs: toolCallRow.toolArgs ?? undefined,
    timestamp: toolCallRow.timestamp,
  };
}