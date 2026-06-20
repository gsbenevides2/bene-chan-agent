import { z } from "zod";

export const NotificationSchema = z.object({
  id: z.uuid().meta({
    title: "Notification ID",
    description: "Unique identifier for the notification",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  title: z.string().meta({
    title: "Title",
    description: "Title of the notification",
    example: "New message from John",
  }),
  description: z.string().meta({
    title: "Description",
    description: "Description of the notification",
    example: "John sent you a new message",
  }),
  image: z.string().nullable().optional().meta({
    title: "Image URL",
    description: "Optional image URL for the notification",
    example: "https://example.com/image.png",
  }),
  link: z.string().nullable().optional().meta({
    title: "Link URL",
    description: "Optional link URL to open when clicking the notification",
    example: "https://example.com/post/123",
  }),
  read: z.boolean().meta({
    title: "Read",
    description: "Whether the notification has been read",
    example: false,
  }),
  createdAt: z.string().datetime().meta({
    title: "Created At",
    description: "ISO timestamp of when the notification was created",
    example: "2024-06-01T12:00:00.000Z",
  }),
});

export const CreateNotificationBodySchema = z.object({
  title: z.string().min(1).max(255).meta({
    title: "Title",
    description: "Title of the notification",
    example: "New message from John",
  }),
  description: z.string().min(1).max(1000).meta({
    title: "Description",
    description: "Description of the notification",
    example: "John sent you a new message",
  }),
  image: z.string().url().optional().meta({
    title: "Image URL",
    description: "Optional image URL",
    example: "https://example.com/image.png",
  }),
  link: z.string().url().optional().meta({
    title: "Link URL",
    description: "Optional link URL",
    example: "https://example.com/post/123",
  }),
});

export const ReceiveNotificationResponseSchema = z.object({
  id: z.string().uuid().meta({
    title: "Notification ID",
    description: "ID of the created notification",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  createdAt: z.string().datetime().meta({
    title: "Created At",
    description: "ISO timestamp of when the notification was created",
    example: "2024-06-01T12:00:00.000Z",
  }),
});

export const ListNotificationsResponseSchema = z
  .array(NotificationSchema)
  .meta({
    title: "List Notifications Response",
    description: "Array of notifications ordered by creation date descending",
  });

export const UpdateNotificationParamSchema = z.object({
  notificationId: z.string().uuid().meta({
    title: "Notification ID",
    description: "ID of the notification to update",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const UpdateNotificationBodySchema = z.object({
  read: z.boolean().optional().meta({
    title: "Read",
    description: "Whether the notification is marked as read",
    example: true,
  }),
});

export const SubscribePushBodySchema = z.object({
  endpoint: z.string().url().meta({
    title: "Endpoint",
    description: "Push service endpoint URL",
    example: "https://fcm.googleapis.com/...",
  }),
  keys: z.object({
    p256dh: z.string().meta({
      title: "P256DH Key",
      description: "Public encryption key",
      example: "BDPA...",
    }),
    auth: z.string().meta({
      title: "Auth Key",
      description: "Authentication secret",
      example: "qLg...",
    }),
  }),
});

export const SubscribePushResponseSchema = z.object({
  id: z.uuid().meta({
    title: "Subscription ID",
    description: "ID of the push subscription to remove",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  success: z.boolean().meta({
    title: "Indicates success subscription",
    description: "Indicates success subscription",
  }),
});

export const UnsubscribePushParamSchema = z.object({
  subscriptionId: z.string().uuid().meta({
    title: "Subscription ID",
    description: "ID of the push subscription to remove",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const WebPushStatusResponseSchema = z.object({
  permission: z.string().meta({
    title: "Permission",
    description: "Browser notification permission status",
    example: "granted",
  }),
  enabled: z.boolean().meta({
    title: "Enabled",
    description: "Whether push notifications are enabled",
    example: true,
  }),
});

export const WebPushStatusParamSchema = z.object({
  subscriptionId: z.string().uuid().meta({
    title: "Subscription ID",
    description: "ID of the push subscription to remove",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const MarkAllReadResponseSchema = z.object({
  updatedCount: z.number().int().meta({
    title: "Updated Count",
    description: "Number of notifications marked as read",
    example: 5,
  }),
});

export const DeleteNotificationResponseSchema = z.object({
  success: z.boolean().meta({
    title: "Success",
    description: "Whether the notification was deleted",
    example: true,
  }),
});

export const NotificationModel = {
  NotificationSchema,
  CreateNotificationBodySchema,
  ReceiveNotificationResponseSchema,
  ListNotificationsResponseSchema,
  UpdateNotificationParamSchema,
  UpdateNotificationBodySchema,
  SubscribePushBodySchema,
  SubscribePushResponseSchema,
  UnsubscribePushParamSchema,
  WebPushStatusResponseSchema,
  WebPushStatusParamSchema,
  MarkAllReadResponseSchema,
  DeleteNotificationResponseSchema,
};

export type Notification = z.infer<typeof NotificationSchema>;
export type CreateNotificationBody = z.infer<
  typeof CreateNotificationBodySchema
>;
export type SubscribePushBody = z.infer<typeof SubscribePushBodySchema>;
