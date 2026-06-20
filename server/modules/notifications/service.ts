import { db } from "@/server/db";
import { notifications, pushSubscriptions } from "@/server/db/schema";
import { eq, count, desc, and } from "drizzle-orm";
import { WebPushService } from "@/server/services/webpush";

export class NotificationService {
  static async receiveNotification(data: {
    title: string;
    description: string;
    image?: string | null;
    link?: string | null;
  }) {
    const result = await db
      .insert(notifications)
      .values({
        title: data.title,
        description: data.description,
        image: data.image ?? null,
        link: data.link ?? null,
      })
      .returning();

    const notification = result.at(0);
    if (!notification) throw new Error("Failed to create notification");

    await WebPushService.sendNotification(data);

    return {
      id: notification.id,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  static async listNotifications() {
    const result = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));

    return result.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      image: n.image,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  static async markAsRead(notificationId: string) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  static async markAllAsRead() {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.read, false))
      .returning({ id: notifications.id });

    return { updatedCount: result.length };
  }

  static async deleteNotification(notificationId: string) {
    await db.delete(notifications).where(eq(notifications.id, notificationId));

    return { success: true };
  }

  static async subscribePush(data: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) {
    const exists = await db
      .select({
        id: pushSubscriptions.id,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint))
      .limit(1);

    if (exists.at(0)?.id) {
      return exists.at(0)?.id ?? "";
    }

    const result = await db
      .insert(pushSubscriptions)
      .values({
        endpoint: data.endpoint,
        p256dhKey: data.keys.p256dh,
        authKey: data.keys.auth,
        userAgent: null,
      })
      .onConflictDoNothing()
      .returning();

    const id = result.at(0)?.id ?? "";
    return id;
  }

  static async unsubscribePush(subscriptionId: string) {
    await db
      .update(pushSubscriptions)
      .set({ enabled: false })
      .where(eq(pushSubscriptions.id, subscriptionId));
  }

  static async getWebPushStatus(subscriptionId: string) {
    const result = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.id, subscriptionId),
          eq(pushSubscriptions.enabled, true),
        ),
      )
      .limit(1);

    if (result.at(0)?.id) {
      return {
        permission: "granted",
        enabled: true,
      };
    }

    return {
      permission: "not-granted",
      enabled: false,
    };
  }

  static async getUnreadCount() {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.read, false));

    return Number(result.at(0)?.count ?? 0);
  }
}
