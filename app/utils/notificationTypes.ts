export const OPEN_NOTIFICATION_CENTER_EVENT = "open-notification-center";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface WebPushStatus {
  permission: string;
  enabled: boolean;
}
