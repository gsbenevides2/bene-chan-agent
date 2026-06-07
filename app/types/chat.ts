export enum ChatMessageSide {
  RECEIVED = "received",
  SENT = "sent",
}

export interface ChatMessage {
  id: string;
  text: string;
  side: ChatMessageSide;
  senderName: string;
  timestamp: string;
}
