"use client";

import dynamic from "next/dynamic";

export const ClientNotificationCenter = dynamic(
  () => import("@/app/components/NotificationCenter"),
  { ssr: false },
);
