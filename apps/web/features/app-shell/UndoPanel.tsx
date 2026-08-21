import { AlertTriangle, Check, RotateCcw, X } from "lucide-react";
import type { Side } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

type PendingUndo = {
  needsResponse?: boolean;
  requestedBy: Side;
};

export function UndoPanel({
  open,
  pendingUndo,
  undoNotice,
  latestEventId,
  connection,
  onRequest,
  onResolve
}: {
  open: boolean;
  pendingUndo: PendingUndo | undefined;
  undoNotice: string;
  latestEventId: string | undefined;
  connection: "offline" | "connecting" | "online";
  onRequest(): void;
  onResolve(accepted: boolean): void;
}) {
  const t = useTranslations("AppShell.undo");
  if (!open) return null;
  const hasIncomingRequest = Boolean(pendingUndo?.needsResponse);
  const hasOutgoingRequest = Boolean(pendingUndo && !pendingUndo.needsResponse);
  const incomingRequest = pendingUndo?.needsResponse ? pendingUndo : null;
  const undoTitle = hasIncomingRequest || hasOutgoingRequest ? t("requestedTitle") : t("title");
  const undoDescription = hasIncomingRequest
    ? t("incoming", {side: incomingRequest!.requestedBy === "corp" ? t("corp") : t("runner")})
    : hasOutgoingRequest
      ? t("waiting")
      : t("description");

  return (
    <section className="undoPanel" id="undo-strip" data-testid="undo-panel" role="region" aria-label={t("ariaLabel")}>
      <div className="undoPanelHeader">
        <h2>{undoTitle}</h2>
        <p className="meta">{undoDescription}</p>
        {undoNotice ? (
          <p className="undoNotice" role="alert">
            <AlertTriangle size={13} />
            {undoNotice}
          </p>
        ) : null}
      </div>
      {hasIncomingRequest ? (
        <div className="undoBox">
          <div className="splitButtons">
            <button className="button primary" onClick={() => onResolve(true)}>
              <Check size={15} />
              {t("accept")}
            </button>
            <button className="button" onClick={() => onResolve(false)}>
              <X size={15} />
              {t("decline")}
            </button>
          </div>
        </div>
      ) : hasOutgoingRequest ? (
        <div className="undoBox">
          <p className="meta">{t("pending")}</p>
        </div>
      ) : (
        <button className="button wide" onClick={onRequest} disabled={!latestEventId || connection !== "online"}>
          <RotateCcw size={15} />
          {t("request")}
        </button>
      )}
    </section>
  );
}
