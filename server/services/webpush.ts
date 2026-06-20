import webpush from "web-push";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export class WebPushService {
  static async sendNotification(data: {
    title: string;
    description: string;
    image?: string | null;
    link?: string | null;
  }): Promise<void> {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.enabled, true));

    const payload = JSON.stringify({
      title: data.title,
      body: data.description,
      icon: "/icon.png",
      image: data.image,
      data: { url: data.link },
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dhKey,
                auth: sub.authKey,
              },
            },
            payload,
          );
        } catch (error) {
          if (
            error instanceof webpush.WebPushError &&
            (error.statusCode === 410 || error.statusCode === 404)
          ) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          }
        }
      }),
    );
  }
}
