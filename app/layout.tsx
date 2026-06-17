import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QuickBar from "@/app/components/QuickBar";
import NewChatModal from "@/app/components/NewChatModal";
import AlertModal from "@/app/components/AlertModal";
import { CreateEventManager } from "@/app/utils/eventManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bene-Chan Agent",
  description: "A my personal AI Agent to help me in a day use.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
    >
      <body className="flex flex-col h-full overflow-auto">
        {children}
        <CreateEventManager />
        <QuickBar />
        <NewChatModal />
        <AlertModal />
      </body>
    </html>
  );
}
