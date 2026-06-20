"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BellDot,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { useEventManager } from "@/app/utils/eventManager";
import { OPEN_NOTIFICATION_CENTER_EVENT } from "@/app/utils/notificationTypes";
import { useNotificationApi } from "@/app/utils/useNotification";
import type {
  NotificationItem,
  WebPushStatus,
} from "@/app/utils/notificationTypes";
import { useAlert } from "../hooks/useAlert";

function timeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pushStatus, setPushStatus] = useState<WebPushStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventManager = useEventManager();
  const api = useNotificationApi();
  const { error } = useAlert();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchPushStatus = useCallback(async () => {
    const status = await api.getWebPushStatus();
    if (status) setPushStatus(status);
  }, [api]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    fetchNotifications();
    fetchPushStatus();
  }, [fetchNotifications, fetchPushStatus]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const unlisten = eventManager.listen(
      OPEN_NOTIFICATION_CENTER_EVENT,
      handleOpen,
    );
    return () => unlisten?.();
  }, [eventManager, handleOpen]);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await api.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [api],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await api.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [api]);

  const handleDelete = useCallback(
    async (id: string) => {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [api],
  );

  const handleSubscribePush = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      error("Erro ao solicitar permissão para Notificações", {
        title: "Erro!",
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    });

    const subJSON = subscription.toJSON();
    await api.subscribePush(
      subJSON.endpoint!,
      subJSON.keys!.p256dh,
      subJSON.keys!.auth,
    );
    fetchPushStatus();
  }, [api, error, fetchPushStatus]);

  const handleUnsubscribePush = useCallback(async () => {
    if (!pushStatus) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.unsubscribePush();
    }
    const status = await api.getWebPushStatus();
    if (status) setPushStatus(status);
  }, [api, pushStatus]);

  return (
    <>
      <dialog className={`modal sm:modal-middle ${isOpen ? "modal-open" : ""}`}>
        <div className="p-0 w-11/12 max-w-lg modal-box">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-base-200 border-b">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Notificações</h3>
              {unreadCount > 0 && (
                <span className="badge badge-primary badge-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="btn btn-ghost btn-sm"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcar todas</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-base-content/70 text-center">
                <Bell className="opacity-50 mx-auto mb-2 w-8 h-8" />
                <p className="text-sm">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-base-content/70 text-center">
                <Bell className="opacity-50 mx-auto mb-2 w-8 h-8" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-base-200">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors ${n.read ? "" : "bg-primary/5"}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 shrink-0">
                        {n.read ? (
                          <BellDot className="w-4 h-4 text-base-content/40" />
                        ) : (
                          <BellRing className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p
                            className={`font-medium truncate ${n.read ? "text-base-content/70" : "text-base-content"}`}
                          >
                            {n.title}
                          </p>
                          <span className="ml-2 text-xs text-base-content/50 shrink-0">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-base-content/60 line-clamp-2">
                          {n.description}
                        </p>
                        {n.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.image}
                            alt=""
                            className="mt-2 rounded-lg w-full h-32 object-cover"
                          />
                        )}
                        {n.link && (
                          <a
                            href={n.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 mt-1 text-primary text-xs truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{n.link}</span>
                          </a>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          {!n.read && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="btn btn-ghost btn-xs"
                              title="Marcar como lida"
                            >
                              <Check className="w-3 h-3" />
                              <span>Lida</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="text-error btn btn-ghost btn-xs"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WebPush management */}
          <div className="flex justify-between items-center bg-base-200/50 p-4 border-base-200 border-t">
            <div className="flex items-center space-x-2">
              <BellRing className="w-4 h-4" />
              <span className="text-sm">WebPush</span>
            </div>
            <div className="flex items-center space-x-2">
              {pushStatus?.permission === "granted" ? (
                <button
                  onClick={handleUnsubscribePush}
                  className="btn btn-ghost btn-xs"
                >
                  Desabilitar
                </button>
              ) : (
                <button
                  onClick={handleSubscribePush}
                  className="btn btn-primary btn-xs"
                  disabled={
                    pushStatus?.permission === "denied" ||
                    !("Notification" in window)
                  }
                >
                  {pushStatus?.permission === "denied"
                    ? "Bloqueado"
                    : "Habilitar"}
                </button>
              )}
            </div>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={handleClose}>close</button>
        </form>
      </dialog>
    </>
  );
}
