"use client";
import { ChatMessage } from "@/server/modules/chat/messages/model";
import { Cog, CheckCircle, Zap, Clock } from "lucide-react";
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
    if (message.role === "tool") {
      return "bg-gradient-to-r from-success/90 to-success text-success-content shadow-lg border border-success/20";
    }
    if (
      message.role === "assistant" &&
      message.toolCalls &&
      message.toolCalls.length > 0
    ) {
      return "bg-gradient-to-r from-info/90 to-info text-info-content shadow-lg border border-info/20";
    }
    return "bg-transparent shadow-none text-base-content";
  };

  const getMessageIcon = () => {
    if (message.role === "tool") {
      return (
        <CheckCircle className="inline mr-3 w-5 h-5 text-success-content/80" />
      );
    }
    if (
      message.role === "assistant" &&
      message.toolCalls &&
      message.toolCalls.length > 0
    ) {
      return (
        <Cog className="inline mr-3 w-5 h-5 text-info-content/80 animate-spin" />
      );
    }
    return null;
  };

  const markdownToHtml = (markdown: string) => {
    const result = remark().use(html).processSync(markdown);
    return result.toString();
  };

  const formatMessageContent = () => {
    if (
      message.role === "assistant" &&
      message.toolCalls &&
      message.toolCalls.length > 0
    ) {
      return (
        <div className="space-y-3">
          {message.toolCalls.map((toolCall) => (
            <div key={toolCall.id}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  <svg
                    className={`inline mr-1 w-4 h-4 ${openMessage ? "rotate-180" : "rotate-90"} transition-transform`}
                    viewBox="0 0 100 100"
                  >
                    <polygon points="10,80 90,80 50,10" fill="#000" />
                  </svg>
                  Executando:{" "}
                  <span className="font-mono text-info-content/90">
                    {toolCall.toolName}
                  </span>
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
                  <pre className="max-h-32 overflow-auto font-mono text-info-content/80 text-xs leading-relaxed">
                    {JSON.stringify(JSON.parse(toolCall.toolArgs), null, 2)}
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
                className={`inline mr-1 w-4 h-4 ${openMessage ? "rotate-180" : "rotate-90"} transition-transform`}
                viewBox="0 0 100 100"
              >
                <polygon points="10,80 90,80 50,10" fill="#000" />
              </svg>
              <span className="font-mono text-success-content/90">
                {message.toolName}
              </span>{" "}
              - Concluído
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
              <pre className="max-h-40 overflow-auto font-mono text-success-content/80 text-xs leading-relaxed">
                {message.content}
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
          {getMessageIcon()}
          <div className="flex-1">{formatMessageContent()}</div>
        </div>
      </div>

      <div className="opacity-50 text-xs chat-footer">{formattedTimestamp}</div>
    </div>
  );
}
