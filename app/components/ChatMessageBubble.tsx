import { ChatMessage, ChatMessageSide } from "@/app/types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isReceived = message.side === ChatMessageSide.RECEIVED;

  return (
    <div className={`chat ${isReceived ? "chat-start" : "chat-end"}`}>
      <div className="chat-image avatar placeholder">
        <div
          className={`flex justify-center items-center ${isReceived ? "bg-primary" : "bg-secondary"} rounded-full w-10 text-neutral-content`}
        >
          <span className="font-bold text-sm">
            {message.senderName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="chat-header">{message.senderName}</div>
      <div className="bg-transparent shadow-none px-0 text-sm text-base-content whitespace-pre-wrap chat-bubble">
        {message.text}
      </div>
      <div className="opacity-50 text-xs chat-footer">{message.timestamp}</div>
    </div>
  );
}
