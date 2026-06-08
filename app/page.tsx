"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { useEventManager } from "@/app/utils/eventManager";
import { OPEN_NEW_CHAT_MODAL_EVENT } from "@/app/components/NewChatModal";

export default function Home() {
  const eventManager = useEventManager();
  const openModal = useCallback(() => {
    eventManager.dispatchEvent(OPEN_NEW_CHAT_MODAL_EVENT);
  }, [eventManager]);
  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <main className="flex flex-col flex-1 justify-between items-center sm:items-start px-16 py-32 w-full max-w-4xl k">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center sm:items-start gap-6 sm:text-left text-center">
          <h1 className="font-semibold text-black dark:text-zinc-50 text-3xl leading-10 tracking-tight">
            Bem vindo à Bene-Chan!<br></br>Sua assistente virtual personalizada!
          </h1>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400 text-lg leading-8">
            O que vamos fazer juntos hoje?
          </p>
          <div className="flex sm:flex-row flex-col gap-4">
            <button className="btn btn-primary" onClick={openModal}>
              Nova Conversa
            </button>
            <Link href="/chats" className="btn-outline btn">
              Ver Conversas Anteriores
            </Link>
          </div>
        </div>
        <div className="flex sm:flex-row flex-col gap-4 font-medium text-base"></div>
      </main>
    </div>
  );
}
