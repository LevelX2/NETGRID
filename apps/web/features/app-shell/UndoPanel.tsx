import { AlertTriangle, Check, RotateCcw, X } from "lucide-react";
import type { Side } from "@netgrid/shared";

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
  if (!open) return null;
  const hasIncomingRequest = Boolean(pendingUndo?.needsResponse);
  const hasOutgoingRequest = Boolean(pendingUndo && !pendingUndo.needsResponse);
  const incomingRequest = pendingUndo?.needsResponse ? pendingUndo : null;
  const undoTitle = hasIncomingRequest || hasOutgoingRequest ? "Zurücknahme angefragt" : "Letzte Aktion zurücknehmen";
  const undoDescription = hasIncomingRequest
    ? `${sideLabel(incomingRequest!.requestedBy)} bittet um Zurücknahme der letzten Aktion.`
    : hasOutgoingRequest
      ? "Warte auf Bestätigung durch das Gegenüber."
      : "Sendet eine Anfrage an Dein Gegenüber.";

  return (
    <section className="undoPanel" id="undo-strip" data-testid="undo-panel" role="region" aria-label="Zurücknahme">
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
              Zustimmen
            </button>
            <button className="button" onClick={() => onResolve(false)}>
              <X size={15} />
              Ablehnen
            </button>
          </div>
        </div>
      ) : hasOutgoingRequest ? (
        <div className="undoBox">
          <p className="meta">Die letzte Aktion bleibt bestehen, bis die andere Seite zustimmt.</p>
        </div>
      ) : (
        <button className="button wide" onClick={onRequest} disabled={!latestEventId || connection !== "online"}>
          <RotateCcw size={15} />
          Zurücknahme anfragen
        </button>
      )}
    </section>
  );
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}
