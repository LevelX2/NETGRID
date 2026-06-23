"use client";

import { Cable, Link2, Trash2 } from "lucide-react";

import type { RecentSessionInfo, SessionInfo } from "../../app/session-recovery";
import { recentSessionHeadline, recentSessionStatusLabel } from "../recent/recent-session-labels";

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Korp";
}

export function MatchResumePanel({
  showingSessionRecovery,
  session,
  connection,
  canReconnect,
  recentSession,
  canResumeRecentSession,
  onReconnect,
  onCopyReconnectLink,
  onLeaveMatch,
  onResumeRecentSession,
  onReconnectFromRecentSession,
  onDiscardRecentSession
}: {
  showingSessionRecovery: boolean;
  session: SessionInfo | null;
  connection: "offline" | "connecting" | "online";
  canReconnect: boolean;
  recentSession: RecentSessionInfo | null;
  canResumeRecentSession: boolean;
  onReconnect(): void;
  onCopyReconnectLink(): void;
  onLeaveMatch(): void;
  onResumeRecentSession(): void;
  onReconnectFromRecentSession(): void;
  onDiscardRecentSession(): void;
}) {
  if (showingSessionRecovery && session) {
    return (
      <section className="resumeSessionInline" aria-label="Sitzung wiederherstellen">
        <div className="resumeSessionSummary">
          <p className="eyebrow">Aktive lokale Sitzung</p>
          <h2>Match {session.matchId}</h2>
          <p className="meta">
            {sideLabel(session.side)} · {session.displayName}
            {connection !== "online" ? " · nicht verbunden" : ""}
          </p>
        </div>
        <div className="resumeSessionActions">
          <span className="resumeActionTooltip" data-tooltip={canReconnect ? "Aktive lokale Sitzung wieder verbinden" : "Für diese Sitzung liegt kein Wiederverbindungs-Token vor."}>
            <button className="button primary" onClick={onReconnect} type="button" disabled={!canReconnect}>
              <Cable size={15} />
              Wieder verbinden
            </button>
          </span>
          <span className="resumeActionTooltip" data-tooltip={canReconnect ? "Wiederverbindungslink kopieren" : "Für diese Sitzung liegt kein Wiederverbindungs-Token vor."}>
            <button className="button" onClick={onCopyReconnectLink} type="button" disabled={!canReconnect}>
              <Link2 size={15} />
              Link kopieren
            </button>
          </span>
          <span className="resumeActionTooltip" data-tooltip="Löst nur die lokale Browser-Sitzung. Das serverseitige Match bleibt unverändert.">
            <button className="button" onClick={onLeaveMatch} type="button">
              <Trash2 size={15} />
              Lokale Sitzung lösen
            </button>
          </span>
        </div>
      </section>
    );
  }

  if (!recentSession) return null;

  return (
    <section className="resumeSessionInline" aria-label="Gespeichertes Spiel fortsetzen">
      <div className="resumeSessionSummary">
        <p className="eyebrow">Gespeichertes Spiel</p>
        <h2>{recentSessionHeadline(recentSession)}</h2>
        <p className="meta">
          {recentSession.displayName} · {recentSessionStatusLabel(recentSession.matchStatus)}
          {canResumeRecentSession ? " · Fortsetzen verfügbar" : " · Token neu eintragen"}
        </p>
        <details className="matchIdDetails">
          <summary>Match-ID anzeigen</summary>
          <code>{recentSession.matchId}</code>
        </details>
      </div>
      <div className="resumeSessionActions">
        <span className="resumeActionTooltip" data-tooltip={canResumeRecentSession ? "Gespeicherte Sitzung fortsetzen" : "Für dieses Spiel liegt kein verwertbares Session-Token mehr vor."}>
          <button className="button primary" onClick={onResumeRecentSession} type="button" disabled={!canResumeRecentSession}>
            <Cable size={15} />
            Fortsetzen
          </button>
        </span>
        <span className="resumeActionTooltip" data-tooltip="Öffnet Beitreten mit dieser Match-ID. Den Token musst du aus dem Link ergänzen.">
          <button className="button" onClick={onReconnectFromRecentSession} type="button">
            <Link2 size={15} />
            Über Token verbinden
          </button>
        </span>
        <span className="resumeActionTooltip" data-tooltip="Entfernt nur dieses gespeicherte Spiel aus diesem Browser. Das serverseitige Match bleibt unverändert.">
          <button className="button" onClick={onDiscardRecentSession} type="button">
            <Trash2 size={15} />
            Verwerfen
          </button>
        </span>
      </div>
    </section>
  );
}
