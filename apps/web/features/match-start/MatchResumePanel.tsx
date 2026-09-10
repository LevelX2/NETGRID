"use client";

import { Cable, Link2, Trash2 } from "lucide-react";
import { useTranslations } from "use-intl/react";

import type {
  RecentSessionInfo,
  SessionInfo,
} from "../../app/session-recovery";

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
  onDiscardRecentSession,
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
  const t = useTranslations("MatchStart.resume");
  const side = (value: "runner" | "corp") => t(`side.${value}`);
  if (showingSessionRecovery && session) {
    return (
      <section className="resumeSessionInline" aria-label={t("restoreSession")}>
        <div className="resumeSessionSummary">
          <p className="eyebrow">{t("activeLocalSession")}</p>
          <h2>{t("match", { id: session.matchId })}</h2>
          <p className="meta">
            {side(session.side)} · {session.displayName}
            {connection !== "online" ? ` · ${t("notConnected")}` : ""}
          </p>
        </div>
        <div className="resumeSessionActions">
          <span
            className="resumeActionTooltip"
            data-tooltip={
              canReconnect ? t("reconnectActiveHelp") : t("noReconnectToken")
            }
          >
            <button
              className="button primary"
              onClick={onReconnect}
              type="button"
              disabled={!canReconnect}
            >
              <Cable size={15} />
              {t("reconnect")}
            </button>
          </span>
          <span
            className="resumeActionTooltip"
            data-tooltip={
              canReconnect ? t("copyLinkHelp") : t("noReconnectToken")
            }
          >
            <button
              className="button"
              onClick={onCopyReconnectLink}
              type="button"
              disabled={!canReconnect}
            >
              <Link2 size={15} />
              {t("copyLink")}
            </button>
          </span>
          <span className="resumeActionTooltip" data-tooltip={t("detachHelp")}>
            <button className="button" onClick={onLeaveMatch} type="button">
              <Trash2 size={15} />
              {t("detach")}
            </button>
          </span>
        </div>
      </section>
    );
  }

  if (!recentSession) return null;

  return (
    <section className="resumeSessionInline" aria-label={t("resumeSavedGame")}>
      <div className="resumeSessionSummary">
        <p className="eyebrow">{t("savedGame")}</p>
        <h2>
          {recentSession.opponentDisplayName
            ? t("against", {
                side: side(recentSession.side),
                opponent: recentSession.opponentDisplayName,
              })
            : t("sideGame", { side: side(recentSession.side) })}
        </h2>
        <p className="meta">
          {recentSession.displayName} ·{" "}
          {recentSession.matchStatus
            ? t(`status.${recentSession.matchStatus}`)
            : t("status.saved")}
          {canResumeRecentSession
            ? ` · ${t("resumeAvailable")}`
            : ` · ${t("enterTokenAgain")}`}
        </p>
        <details className="matchIdDetails">
          <summary>{t("showMatchId")}</summary>
          <code>{recentSession.matchId}</code>
        </details>
      </div>
      <div className="resumeSessionActions">
        <span
          className="resumeActionTooltip"
          data-tooltip={
            canResumeRecentSession ? t("resumeSavedHelp") : t("noUsableToken")
          }
        >
          <button
            className="button primary"
            onClick={onResumeRecentSession}
            type="button"
            disabled={!canResumeRecentSession}
          >
            <Cable size={15} />
            {t("resume")}
          </button>
        </span>
        <span
          className="resumeActionTooltip"
          data-tooltip={t("connectWithTokenHelp")}
        >
          <button
            className="button"
            onClick={onReconnectFromRecentSession}
            type="button"
          >
            <Link2 size={15} />
            {t("connectWithToken")}
          </button>
        </span>
        <span
          className="resumeActionTooltip"
          data-tooltip={t("discardSavedHelp")}
        >
          <button
            className="button"
            onClick={onDiscardRecentSession}
            type="button"
          >
            <Trash2 size={15} />
            {t("discard")}
          </button>
        </span>
      </div>
    </section>
  );
}
