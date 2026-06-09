export type AlertType = "info" | "success" | "warning" | "error";

export interface AlertConfig {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  onConfirm?: () => void;
  closeOnConfirm?: boolean;
}

// Eventos para o sistema de alertas
export const SHOW_ALERT_EVENT = "show-alert";
export const HIDE_ALERT_EVENT = "hide-alert";

// Tipo do evento customizado
export interface ShowAlertEvent extends CustomEvent {
  detail: AlertConfig;
}

// Extensão do Window para incluir o alert customizado
declare global {
  interface Window {
    originalAlert: typeof window.alert;
  }
}
