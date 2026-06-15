import { ChatStreamChoice, ChatStreamDelta } from "@openrouter/sdk/models";
import { ChatMessage } from "../modules/chat/messages/model";

export function receivedMessagesProcessor() {
  const deltas: ChatStreamDelta[] = [];
  const alreadyProcessedMessages: ChatMessage[] = [];

  function choiceProcessor(choice: ChatStreamChoice) {
    const deltaIndex = deltas.at(choice.index);
    if (!deltaIndex) {
      deltas[choice.index] = choice.delta;
      return;
    }

    if (choice.delta.content) {
      deltaIndex.content = (deltaIndex.content ?? "") + choice.delta.content;
    }

    if (choice.delta.toolCalls?.length) {
      const deltaIndexToolCalls = deltaIndex.toolCalls ?? [];

      for (const toolCall of choice.delta.toolCalls) {
        const existingToolCall = deltaIndexToolCalls.at(toolCall.index);

        if (!existingToolCall) {
          deltaIndexToolCalls[toolCall.index] = toolCall;
          continue;
        }

        if (toolCall.id) {
          existingToolCall.id = (existingToolCall.id ?? "") + toolCall.id;
        }

        if (toolCall.function) {
          if (!existingToolCall.function) {
            existingToolCall.function = toolCall.function;
          } else if (toolCall.function.name) {
            existingToolCall.function.name =
              (existingToolCall.function.name ?? "") + toolCall.function.name;
          } else if (toolCall.function.arguments) {
            existingToolCall.function.arguments =
              (existingToolCall.function.arguments ?? "") +
              toolCall.function.arguments;
          }
        }

        if (toolCall.type) {
          if (!existingToolCall.type) existingToolCall.type = toolCall.type;
        }

        deltaIndexToolCalls[toolCall.index] = existingToolCall;
      }

      deltaIndex.toolCalls = deltaIndexToolCalls;
    }

    deltas[choice.index] = deltaIndex;
  }

  function tranformDeltasToMessages() {
    for (let deltaIndex = 0; deltaIndex < deltas.length; deltaIndex++) {
      const delta = deltas[deltaIndex];
      const processedMessage = alreadyProcessedMessages.at(deltaIndex);
      const messageId = processedMessage?.id ?? crypto.randomUUID();
      const timestamp = processedMessage?.timestamp ?? new Date();
      const role = delta.role ?? "assistant";
      const content = delta.content ?? processedMessage?.content;

      const toolCalls =
        processedMessage && "toolCalls" in processedMessage
          ? (processedMessage?.toolCalls ?? [])
          : [];
      const deltaToolCalls = delta.toolCalls ?? [];
      for (
        let toolCallIndex = 0;
        toolCallIndex < deltaToolCalls.length;
        toolCallIndex++
      ) {
        const toolCallDelta = deltaToolCalls[toolCallIndex];
        const processedToolCall = toolCalls.at(toolCallIndex);
        const id = processedToolCall?.id ?? crypto.randomUUID();
        const toolName =
          toolCallDelta.function?.name ?? processedToolCall?.toolName ?? "";
        const toolId = toolCallDelta.id ?? processedToolCall?.toolId ?? "";
        const toolArgs =
          toolCallDelta.function?.arguments ?? processedToolCall?.toolArgs;
        const timestamp = processedToolCall?.timestamp ?? new Date();

        toolCalls[toolCallIndex] = {
          id,
          toolName,
          toolId,
          toolArgs,
          timestamp,
        };
      }

      alreadyProcessedMessages[deltaIndex] = {
        id: messageId,
        timestamp,
        role,
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    }
  }

  function receiveStreamingMessage(choice: ChatStreamChoice) {
    choiceProcessor(choice);
    tranformDeltasToMessages();
    return alreadyProcessedMessages.at(choice.index);
  }

  return {
    receiveStreamingMessage,
    alreadyProcessedMessages,
  };
}
