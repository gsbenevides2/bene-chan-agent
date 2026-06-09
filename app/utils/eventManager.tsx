"use client";
import { useCallback, useEffect, useMemo } from "react";

declare global {
  interface Window {
    eventManager: EventTarget;
  }
}

export function CreateEventManager() {
  useEffect(() => {
    if (!window.eventManager) {
      window.eventManager = new EventTarget();
    }
  }, []);
  return null;
}

export function useEventManager() {
  const dispatchEvent = useCallback(function <T>(
    eventName: string,
    detail?: T,
  ) {
    if (!window.eventManager) {
      console.warn(
        "EventManager não encontrado. Certifique-se de que CreateEventManager está sendo usado.",
      );
      return;
    }
    const event = new CustomEvent<T>(eventName, { detail });
    window.eventManager.dispatchEvent(event);
  }, []);
  const listen = useCallback(function listen<T>(
    eventName: string,
    callback: (event: CustomEvent<T>) => void,
  ) {
    if (!window.eventManager) {
      console.warn(
        "EventManager não encontrado. Certifique-se de que CreateEventManager está sendo usado.",
      );
      return;
    }
    window.eventManager.addEventListener(eventName, callback as EventListener);
    return () =>
      window.eventManager.removeEventListener(
        eventName,
        callback as EventListener,
      );
  }, []);

  const values = useMemo(
    () => ({ dispatchEvent, listen }),
    [dispatchEvent, listen],
  );

  return values;
}
