import { ChatMessage } from "@/src/modules/chat/model";
import { Cog, CheckCircle } from "lucide-react";
import { remark } from "remark";
import html from "remark-html";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isReceived = message.role === "assistant";
  const senderName = isReceived ? "Bene-chan" : "Você";

  // Determinar estilo baseado no tipo da mensagem
  const getMessageStyle = () => {
    switch (message.type) {
      /*
      case "thinking":
        return "bg-neutral text-neutral-content opacity-80 animate-pulse";
        */
      case "toolCall":
        return "bg-info text-info-content";
      case "toolResult":
        return "bg-success text-success-content";
      default:
        return "bg-transparent shadow-none text-base-content";
    }
  };

  // Determinar ícone baseado no tipo da mensagem
  const getMessageIcon = () => {
    switch (message.type) {
      /*
      case "thinking":
        return <Brain className="inline mr-2 w-4 h-4" />;
        */
      case "toolCall":
        return <Cog className="inline mr-2 w-4 h-4 animate-spin" />;
      case "toolResult":
        return <CheckCircle className="inline mr-2 w-4 h-4" />;
      default:
        return null;
    }
  };

  // Formatar conteúdo da mensagem
  const formatMessageContent = () => {
    if (message.type === "toolCall" && message.toolName) {
      return (
        <div>
          <div className="mb-1 font-semibold text-sm">
            🔧 Executando: {message.toolName}
          </div>
          {message.toolArgs && (
            <div className="opacity-70 text-xs">
              Parâmetros: {JSON.stringify(message.toolArgs, null, 2)}
            </div>
          )}
        </div>
      );
    }

    if (message.type === "toolResult" && message.toolResult) {
      return (
        <div>
          <div className="mb-1 font-semibold text-sm">
            ✅ {message.toolName} - Resultado:
          </div>
          <pre className="bg-base-200 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(message.toolResult, null, 2)}
          </pre>
        </div>
      );
    }

    const markdownToHtml = (markdown: string) => {
      const result = remark().use(html).processSync(markdown);
      return result.toString();
    };
    if (!message.text) return null;

    return (
      <div dangerouslySetInnerHTML={{ __html: markdownToHtml(message.text) }} />
    );
  };

  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString(
    ["pt-BR"],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className={`chat ${isReceived ? "chat-start" : "chat-end"}`}>
      <div className="chat-image avatar placeholder">
        <div
          className={`flex justify-center items-center bg-secondary text-secondary-content rounded-full w-10`}
        >
          <span className="font-bold text-sm">
            {senderName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="chat-header">
        {senderName}
        {message.type && message.type !== "text" && (
          <span className="ml-2 badge badge-xs">{message.type}</span>
        )}
      </div>

      <div className={`py-2 text-sm  rounded-lg ${getMessageStyle()}`}>
        {getMessageIcon()}
        {formatMessageContent()}
      </div>

      <div className="opacity-50 text-xs chat-footer">{formattedTimestamp}</div>
    </div>
  );
}
