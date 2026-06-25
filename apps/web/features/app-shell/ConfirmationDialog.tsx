import { AlertTriangle, Check, Shield, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type ConfirmationDialogRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm(): void | Promise<void>;
};

export function ConfirmationDialog({
  request,
  onCancel,
  onConfirm
}: {
  request: ConfirmationDialogRequest;
  onCancel(): void;
  onConfirm(): void;
}) {
  const tone = request.tone ?? "neutral";
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className={`confirmationDialogOverlay ${tone}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-message"
    >
      <div className="confirmationDialogBackdrop" aria-hidden="true" onClick={onCancel} />
      <section className="confirmationDialogPanel">
        <div className="confirmationDialogHeader">
          <span className="confirmationDialogIcon" aria-hidden="true">
            {tone === "danger" ? <AlertTriangle size={18} /> : <Shield size={18} />}
          </span>
          <div>
            <p className="eyebrow">Bestätigung</p>
            <h2 id="confirmation-dialog-title">{request.title}</h2>
          </div>
        </div>
        <p id="confirmation-dialog-message">{request.message}</p>
        <div className="confirmationDialogActions">
          <button ref={cancelButtonRef} className="button" onClick={onCancel} type="button">
            <X size={15} />
            {request.cancelLabel ?? "Abbrechen"}
          </button>
          <button className={`button primary ${tone === "danger" ? "dangerButton" : ""}`} onClick={onConfirm} type="button">
            {tone === "danger" ? <AlertTriangle size={15} /> : <Check size={15} />}
            {request.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
