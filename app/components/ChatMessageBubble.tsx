"use client";
import { ChatMessage } from "@/server/modules/chat/messages/model";
import { Zap, Clock } from "lucide-react";
import { useState } from "react";
import { remark } from "remark";
import html from "remark-html";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isReceived = message.role !== "user";
  const [openMessage, setOpenMessage] = useState(false);

  const getSenderName = () => {
    if (message.role === "user") return "Você";
    if (message.role === "assistant") return "Bene-chan";
    if (message.role === "tool") return "Bene-chan";
    return "Bene-chan";
  };

  const senderName = getSenderName();

  const isToggleable =
    message.role === "tool" ||
    (message.role === "assistant" &&
      message.toolCalls &&
      message.toolCalls.length > 0);

  const getMessageStyle = () => {
    return "bg-transparent shadow-none text-base-content";
  };

  const markdownToHtml = (markdown: string) => {
    const result = remark().use(html).processSync(markdown);
    return result.toString();
  };

  const parseContent = (content: string, parseTimes = 1) => {
    try {
      let result = content;
      for (let i = 1; i <= parseTimes; i++) {
        result = JSON.parse(result);
      }
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return content;
    }
  };

  const formatMessageContent = () => {
    if (
      message.role === "assistant" &&
      message.toolCalls &&
      message.toolCalls.length > 0
    ) {
      return (
        <div className="space-y-3">
          {message.content ? (
            <div
              className="mb-3"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(message.content),
              }}
            />
          ) : null}
          {message.toolCalls.map((toolCall) => (
            <div key={toolCall.id}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  <svg
                    className={`inline mr-1 w-2 h-2 ${openMessage ? "rotate-180" : "rotate-90"} transition-transform`}
                    viewBox="0 0 100 100"
                  >
                    <polygon points="10,80 90,80 50,10" fill="#fff" />
                  </svg>
                  Executando: {toolCall.toolName}
                </span>
              </div>
              {toolCall.toolArgs && openMessage ? (
                <div className="bg-black/10 backdrop-blur-sm mt-2 p-3 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="opacity-60 w-3 h-3" />
                    <span className="opacity-80 font-medium text-xs">
                      Parâmetros:
                    </span>
                  </div>
                  <pre className="max-h-32 overflow-auto font-mono text-xs leading-relaxed">
                    {parseContent(toolCall.toolArgs, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ))}
          {openMessage ? (
            <div className="flex items-center gap-2 opacity-70 text-xs">
              <Clock className="w-3 h-3" />
              <span>Aguardando resposta...</span>
            </div>
          ) : null}
        </div>
      );
    }

    if (message.role === "tool") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              <svg
                className={`inline mr-1 w-2 h-2 ${openMessage ? "rotate-180" : "rotate-90"} transition-transform`}
                viewBox="0 0 100 100"
              >
                <polygon points="10,80 90,80 50,10" fill="#fff" />
              </svg>
              Execução de {message.toolName} concluída!
            </span>
          </div>
          {openMessage && message.content ? (
            <div className="bg-black/10 backdrop-blur-sm p-3 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="opacity-60 w-3 h-3" />
                <span className="opacity-80 font-medium text-xs">
                  Resultado:
                </span>
              </div>
              <pre className="max-h-40 overflow-auto font-mono text-xs leading-relaxed">
                {parseContent(message.content, 1)}
              </pre>
            </div>
          ) : null}
        </div>
      );
    }

    if (!message.content) return null;

    return (
      <div
        dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
      />
    );
  };

  const formattedTimestamp = message.timestamp.toLocaleTimeString(["pt-BR"], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`chat ${isReceived ? "chat-start" : "chat-end"} ${isToggleable ? "cursor-pointer" : ""}`}
      onClick={() => isToggleable && setOpenMessage(!openMessage)}
    >
      <div className="chat-image avatar placeholder">
        <div className="flex justify-center items-center bg-secondary rounded-full w-10 text-secondary-content">
          <span className="font-bold text-sm">
            {senderName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="chat-header">{senderName}</div>

      <div className={`p-4 text-sm rounded-xl ${getMessageStyle()}`}>
        <div className="flex items-start">
          <div className="flex-1">{formatMessageContent()}</div>
        </div>
      </div>

      <div className="opacity-50 text-xs chat-footer">{formattedTimestamp}</div>
    </div>
  );
}
