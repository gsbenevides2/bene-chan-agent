import { useEventManager } from "@/app/utils/eventManager";
import {
  AlertConfig,
  SHOW_ALERT_EVENT,
  HIDE_ALERT_EVENT,
} from "@/app/utils/alertTypes";
import { useCallback } from "react";

export function useAlert() {
  const eventManager = useEventManager();

  const dispatchAlert = useCallback(
    (message: string, config?: Partial<Omit<AlertConfig, "message">>) => {
      const alertConfig: AlertConfig = {
        message,
        type: config?.type || "info",
        title: config?.title,
        confirmText: config?.confirmText || "OK",
        onConfirm: config?.onConfirm,
        closeOnConfirm: config?.closeOnConfirm,
      };

      eventManager.dispatchEvent(SHOW_ALERT_EVENT, alertConfig);
    },
    [eventManager],
  );

  /**
   * Mostra um alerta de sucesso
   */
  const success = useCallback(
    (
      message: string,
      config?: Partial<Omit<AlertConfig, "message" | "type">>,
    ) => {
      dispatchAlert(message, { ...config, type: "success" });
    },
    [dispatchAlert],
  );

  /**
   * Mostra um alerta de erro
   */
  const error = useCallback(
    (
      message: string,
      config?: Partial<Omit<AlertConfig, "message" | "type">>,
    ) => {
      dispatchAlert(message, { ...config, type: "error" });
    },
    [dispatchAlert],
  );

  /**
   * Mostra um alerta de warning
   */
  const warning = useCallback(
    (
      message: string,
      config?: Partial<Omit<AlertConfig, "message" | "type">>,
    ) => {
      dispatchAlert(message, { ...config, type: "warning" });
    },
    [dispatchAlert],
  );

  /**
   * Mostra um alerta de informação
   */
  const info = useCallback(
    (
      message: string,
      config?: Partial<Omit<AlertConfig, "message" | "type">>,
    ) => {
      dispatchAlert(message, { ...config, type: "info" });
    },
    [dispatchAlert],
  );

  /**
   * Fecha o alerta atual
   */
  const hide = useCallback(() => {
    eventManager.dispatchEvent(HIDE_ALERT_EVENT);
  }, [eventManager]);

  return {
    alert,
    success,
    error,
    warning,
    info,
    hide,
  };
}
