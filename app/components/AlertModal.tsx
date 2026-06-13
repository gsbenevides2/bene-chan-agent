"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import {
  AlertConfig,
  AlertType,
  SHOW_ALERT_EVENT,
  HIDE_ALERT_EVENT,
  ShowAlertEvent,
} from "@/app/utils/alertTypes";
import { useEventManager } from "@/app/utils/eventManager";

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-6 h-6" />;
    case "warning":
      return <AlertTriangle className="w-6 h-6" />;
    case "error":
      return <XCircle className="w-6 h-6" />;
    case "info":
    default:
      return <Info className="w-6 h-6" />;
  }
};

const getAlertClasses = (type: AlertType) => {
  switch (type) {
    case "success":
      return "text-success";
    case "warning":
      return "text-warning";
    case "error":
      return "text-error";
    case "info":
    default:
      return "text-info";
  }
};

const getButtonClasses = (type: AlertType) => {
  switch (type) {
    case "success":
      return "btn-success";
    case "warning":
      return "btn-warning";
    case "error":
      return "btn-error";
    case "info":
    default:
      return "btn-info";
  }
};

export default function AlertModal() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const eventManager = useEventManager();
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    dialogRef.current?.close();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleShowAlert = (event: Event) => {
      const alertEvent = event as ShowAlertEvent;
      setAlertConfig(alertEvent.detail);
      dialogRef.current?.showModal();
      setTimeout(() => {
        setIsOpen(true);
      }, 100);
    };

    const unlistenShow = eventManager.listen(SHOW_ALERT_EVENT, handleShowAlert);
    const unlistenHide = eventManager.listen(HIDE_ALERT_EVENT, handleClose);

    return () => {
      unlistenShow?.();
      unlistenHide?.();
    };
  }, [eventManager]);

  const handleConfirm = () => {
    if (alertConfig?.onConfirm) {
      alertConfig.onConfirm();
    }
    if (alertConfig?.closeOnConfirm !== false) {
      handleClose();
    }
  };

  const type = alertConfig?.type || "info";
  const iconClasses = getAlertClasses(type);
  const buttonClasses = getButtonClasses(type);
  const confirmText = alertConfig?.confirmText || "OK";
  const title = alertConfig?.title || "";
  const message = alertConfig?.message || "";

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${isOpen ? "modal-open" : ""}`}
      onClose={handleClose}
    >
      <div className="max-w-md modal-box">
        {/* Header com ícone e título */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`${iconClasses} shrink-0`}>{getAlertIcon(type)}</div>

          {title ? (
            <h3 className="font-bold text-base-content text-lg">{title}</h3>
          ) : null}
        </div>

        {/* Mensagem */}
        <div className="mb-6">
          <p className="text-base-content leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="modal-action">
          <button
            onClick={handleConfirm}
            className={`btn ${buttonClasses} btn-block`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* Backdrop para fechar */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
