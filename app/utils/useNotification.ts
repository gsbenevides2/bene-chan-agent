import { useCallback } from "react";
import { getApiClient } from "@/app/utils/client";
import { WebPushStatus } from "./notificationTypes";

const LOCAL_STORAGE_KEY = "notification-sub-id";

export function useNotificationApi() {
  const listNotifications = useCallback(async () => {
    const api = getApiClient();
    const res = await api.notifications.get();
    return (
      res.data?.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        image: n.image ?? null,
        link: n.link ?? null,
        read: n.read,
        createdAt: n.createdAt,
      })) ?? []
    );
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const api = getApiClient();
    await api.notifications({ notificationId: id }).put({ read: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const api = getApiClient();
    const res = await api.notifications["read-all"].put();
    return res.data?.updatedCount ?? 0;
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const api = getApiClient();
    await api.notifications({ notificationId: id }).delete();
  }, []);

  const getUnreadCount = useCallback(async () => {
    const api = getApiClient();
    const res = await api.notifications["unread-count"].get();
    return res.data?.count ?? 0;
  }, []);

  const subscribePush = useCallback(
    async (endpoint: string, p256dh: string, auth: string) => {
      const api = getApiClient();
      const res = await api.notifications["push-subscribe"].post({
        endpoint,
        keys: { p256dh, auth },
      });
      const subId = res.data?.id;
      if (subId) {
        localStorage.setItem(LOCAL_STORAGE_KEY, subId);
      }
    },
    [],
  );

  const unsubscribePush = useCallback(async () => {
    const savedSubsIds = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSubsIds) {
      const api = getApiClient();
      await api.notifications["push-delete"]({
        subscriptionId: savedSubsIds,
      }).delete();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const getWebPushStatus = useCallback(async (): Promise<WebPushStatus> => {
    const subId = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!subId) {
      return {
        enabled: false,
        permission: "not-granted",
      };
    }
    const api = getApiClient();
    const res = await api.notifications["push-status"]({
      subscriptionId: subId,
    }).get();
    if (res.data) return res.data;
    return {
      enabled: false,
      permission: "not-granted",
    };
  }, []);
  return {
    listNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    subscribePush,
    unsubscribePush,
    getWebPushStatus,
  };
}
