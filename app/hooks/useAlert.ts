import { useEventManager } from "@/app/utils/eventManager";
import {
  AlertConfig,
  SHOW_ALERT_EVENT,
  HIDE_ALERT_EVENT,
} from "@/app/utils/alertTypes";

export function useAlert() {
  const eventManager = useEventManager();

  const dispatchAlert = (
    message: string,
    config?: Partial<Omit<AlertConfig, "message">>,
  ) => {
    const alertConfig: AlertConfig = {
      message,
      type: config?.type || "info",
      title: config?.title,
      confirmText: config?.confirmText || "OK",
      onConfirm: config?.onConfirm,
      closeOnConfirm: config?.closeOnConfirm,
    };

    eventManager.dispatchEvent(SHOW_ALERT_EVENT, alertConfig);
  };

  /**
   * Mostra um alerta de sucesso
   */
  const success = (
    message: string,
    config?: Partial<Omit<AlertConfig, "message" | "type">>,
  ) => {
    dispatchAlert(message, { ...config, type: "success" });
  };

  /**
   * Mostra um alerta de erro
   */
  const error = (
    message: string,
    config?: Partial<Omit<AlertConfig, "message" | "type">>,
  ) => {
    dispatchAlert(message, { ...config, type: "error" });
  };

  /**
   * Mostra um alerta de warning
   */
  const warning = (
    message: string,
    config?: Partial<Omit<AlertConfig, "message" | "type">>,
  ) => {
    dispatchAlert(message, { ...config, type: "warning" });
  };

  /**
   * Mostra um alerta de informação
   */
  const info = (
    message: string,
    config?: Partial<Omit<AlertConfig, "message" | "type">>,
  ) => {
    dispatchAlert(message, { ...config, type: "info" });
  };

  /**
   * Fecha o alerta atual
   */
  const hide = () => {
    eventManager.dispatchEvent(HIDE_ALERT_EVENT);
  };

  return {
    alert,
    success,
    error,
    warning,
    info,
    hide,
  };
}
