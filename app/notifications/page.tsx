"use client";

import dynamic from "next/dynamic";

const NotificationsPage = dynamic(
  () => import("./NotificationsPage"),
  { ssr: false },
);

export default function Page() {
  return <NotificationsPage />;
}