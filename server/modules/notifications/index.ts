import Elysia from "elysia";
import { NotificationModel } from "./model";
import { NotificationService } from "./service";

export const notifications = new Elysia({
  prefix: "/notifications",
  tags: ["Notifications"],
})
  .post(
    "/receive",
    async ({ body }) => {
      return await NotificationService.receiveNotification(body);
    },
    {
      body: NotificationModel.CreateNotificationBodySchema,
      detail: {
        summary: "Receive external notification",
        description:
          "Receive a notification from an external application. Requires a valid authentik bearer token with the bene-chan-notification-sender role.",
      },
    },
  )
  .get(
    "/unread-count",
    async () => {
      const count = await NotificationService.getUnreadCount();
      return { count };
    },
    {
      detail: {
        summary: "Get unread notification count",
        description: "Returns the count of unread notifications.",
      },
    },
  )
  .get(
    "/",
    async () => {
      return await NotificationService.listNotifications();
    },
    {
      response: NotificationModel.ListNotificationsResponseSchema,
      detail: {
        summary: "List all notifications",
        description:
          "Retrieve all notifications ordered by creation date descending.",
      },
    },
  )
  .put(
    "/read-all",
    async () => {
      return await NotificationService.markAllAsRead();
    },
    {
      response: NotificationModel.MarkAllReadResponseSchema,
      detail: {
        summary: "Mark all notifications as read",
        description: "Mark all unread notifications as read.",
      },
    },
  )
  .put(
    "/:notificationId",
    async ({ params, body }) => {
      if (body.read) {
        await NotificationService.markAsRead(params.notificationId);
      }
      return { success: true };
    },
    {
      params: NotificationModel.UpdateNotificationParamSchema,
      body: NotificationModel.UpdateNotificationBodySchema,
      response: NotificationModel.DeleteNotificationResponseSchema,
      detail: {
        summary: "Update a notification",
        description: "Mark a notification as read or update its properties.",
      },
    },
  )
  .delete(
    "/:notificationId",
    async ({ params }) => {
      return await NotificationService.deleteNotification(
        params.notificationId,
      );
    },
    {
      params: NotificationModel.UpdateNotificationParamSchema,
      response: NotificationModel.DeleteNotificationResponseSchema,
      detail: {
        summary: "Delete a notification",
        description: "Delete a notification by its ID.",
      },
    },
  )
  .post(
    "/push-subscribe",
    async ({ body }) => {
      const id = await NotificationService.subscribePush(body);
      return { id, success: true };
    },
    {
      body: NotificationModel.SubscribePushBodySchema,
      response: NotificationModel.SubscribePushResponseSchema,
      detail: {
        summary: "Subscribe to push notifications",
        description:
          "Save a browser push subscription for receiving WebPush notifications.",
      },
    },
  )
  .delete(
    "/push-delete/:subscriptionId",
    async ({ params }) => {
      await NotificationService.unsubscribePush(params.subscriptionId);
      return { success: true };
    },
    {
      params: NotificationModel.UnsubscribePushParamSchema,
      detail: {
        summary: "Unsubscribe from push notifications",
        description: "Disable a push subscription by its ID.",
      },
    },
  )
  .get(
    "/push-status/:subscriptionId",
    async ({ params }) => {
      return await NotificationService.getWebPushStatus(params.subscriptionId);
    },
    {
      params: NotificationModel.WebPushStatusParamSchema,
      response: NotificationModel.WebPushStatusResponseSchema,
      detail: {
        summary: "Get WebPush status",
        description:
          "Returns the current WebPush permission status and active subscriptions count.",
      },
    },
  );
