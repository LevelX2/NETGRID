import { Clipboard, CopyPlus, RotateCcw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "use-intl/react";
import type {
  ApiLobbyParticipantPayload,
  ApiLobbyPayload,
} from "@netgrid/shared";

import {
  formatLobbyTime,
  isInvalidatingTerminalStatus,
  playerSlotForSide,
} from "./lobby-format";

type LobbyClientPayload = ApiLobbyPayload;
type LobbyParticipant = ApiLobbyParticipantPayload;

export function StartLobbyPanel({
  lobby,
  joinUrl,
  chatText,
  connection,
  onReady,
  onCancel,
  onCancelMatch,
  onLeaveMatch,
  onRecreate,
  onDiscardLocal,
  onReturnToSetup,
  onChatText,
  onSendChat,
  onCopyJoinLink,
}: {
  lobby: LobbyClientPayload;
  joinUrl?: string | undefined;
  chatText: string;
  connection: "offline" | "connecting" | "online";
  onReady: (ready: boolean) => void;
  onCancel: () => void;
  onCancelMatch: () => void;
  onLeaveMatch: () => void;
  onRecreate: () => void;
  onDiscardLocal: () => void;
  onReturnToSetup: () => void;
  onChatText: (value: string) => void;
  onSendChat: () => void;
  onCopyJoinLink: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("MatchStart.lobby");
  const terminalTitle = (
    status: string,
    winner: "runner" | "corp" | "draw" | undefined,
  ): string => {
    if (status === "cancelled") return t("terminal.cancelled");
    if (status === "forfeited")
      return winner === "runner" || winner === "corp"
        ? t("terminal.forfeitWinner", { side: t(`side.${winner}`) })
        : t("terminal.forfeited");
    if (status === "finished")
      return winner === "runner" || winner === "corp"
        ? t("terminal.winner", { side: t(`side.${winner}`) })
        : t("terminal.finished");
    if (status === "expired") return t("terminal.expired");
    if (status === "abandoned") return t("terminal.abandoned");
    return t("terminal.inactive");
  };
  const terminalMessage = (
    status: string,
    result: typeof lobby.lifecycleResult,
  ): string => {
    if (result?.reason) {
      return result.reason === "cancel"
        ? t("terminal.cancelledMessage")
        : result.reason === "leave"
          ? t("terminal.abandonedMessage")
          : result.reason === "forfeit"
            ? t("terminal.forfeitMessage")
            : t("terminal.timeExpiredMessage");
    }
    if (status === "cancelled") return t("terminal.cancelledMessage");
    if (status === "expired") return t("terminal.expiredMessage");
    if (status === "abandoned") return t("terminal.abandonedMessage");
    return t("terminal.inactiveMessage");
  };
  const playerClockLabel = (): string => {
    const clock = lobby.playerClock;
    if (!clock || clock.mode === "none") return t("noPlayerTime");
    const minutes = clock.startingTimeMs
      ? Math.round(clock.startingTimeMs / 60_000)
      : null;
    const grace =
      clock.gracePeriodMs !== undefined
        ? Math.round(clock.gracePeriodMs / 1000)
        : null;
    if (minutes && grace !== null)
      return t("playerTimeWithGrace", { minutes, seconds: grace });
    if (minutes) return t("playerTimeMinutes", { minutes });
    return t("playerTimeActive");
  };
  const start = lobby.startLobby;
  const selfPlayer = start ? playerSlotForSide(start, lobby.side) : "player_a";
  const self = start?.participants[selfPlayer];
  const opponentPlayer = selfPlayer === "player_a" ? "player_b" : "player_a";
  const opponent = start?.participants[opponentPlayer];
  const selfReady = self?.ready ?? false;
  const countdownActive =
    lobby.matchStatus === "countdown" && Boolean(start?.countdownEndsAt);
  const opponentReady = opponent?.ready ?? false;
  const terminal =
    isInvalidatingTerminalStatus(lobby.matchStatus) ||
    lobby.matchStatus === "forfeited" ||
    lobby.matchStatus === "finished";
  const isHost = selfPlayer === "player_a";
  const canUseReadiness = Boolean(
    start &&
    (lobby.matchStatus === "ready_check" || lobby.matchStatus === "countdown"),
  );
  const showJoinLink = Boolean(
    joinUrl &&
    !terminal &&
    (lobby.pendingDeckHandshake || lobby.matchStatus === "pending"),
  );
  const opponentName =
    lobby.opponentStatus.displayName ??
    (opponent?.connected ? opponent.displayName : t("waitingForOpponent"));
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const countdownValue = useMemo(() => {
    if (!countdownActive || !start?.countdownEndsAt) return null;
    const remainingMs =
      new Date(start.countdownEndsAt).getTime() - countdownNowMs;
    if (remainingMs <= 0) return null;
    return Math.ceil(remainingMs / 1000);
  }, [countdownActive, start?.countdownEndsAt, countdownNowMs]);
  useEffect(() => {
    const element = chatMessagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [start?.chatMessages.length]);
  useEffect(() => {
    if (!countdownActive || !start?.countdownEndsAt) return;
    setCountdownNowMs(Date.now());
    const handle = window.setInterval(() => setCountdownNowMs(Date.now()), 120);
    return () => window.clearInterval(handle);
  }, [countdownActive, start?.countdownEndsAt]);
  return (
    <section className="startLobbyPanel" data-testid="start-lobby">
      {countdownValue ? (
        <div
          className="lobbyCountdownOverlay"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="lobbyCountdownDigit" key={countdownValue}>
            {countdownValue}
          </span>
        </div>
      ) : null}
      <div className="startLobbyHeader">
        <div>
          <p className="eyebrow">
            {terminal ? t("terminalStatus") : t("readyLobby")}
          </p>
          <h2>
            {terminal
              ? terminalTitle(
                  lobby.matchStatus,
                  lobby.lifecycleResult?.winnerSide,
                )
              : start
                ? start.sideAssignmentMode === "random_pending"
                  ? t("sideRandomized")
                  : t("startsAs", { side: t(`side.${lobby.side}`) })
                : t("matchCreated")}
          </h2>
          <p className="meta">
            {opponentName ? t("opponentName", { name: opponentName }) : ""}
          </p>
        </div>
        <div className="startLobbyHeaderActions">
          <span className={`statusPill ${connection}`}>
            {connection === "online"
              ? t("youOnline")
              : connection === "connecting"
                ? t("youConnecting")
                : t("youOffline")}
          </span>
          {terminal ? (
            <>
              <button
                className="button primary"
                onClick={onRecreate}
                type="button"
                data-testid="recreate-match"
              >
                <CopyPlus size={15} />
                {t("recreate")}
              </button>
              <button
                className="button subtle"
                onClick={onDiscardLocal}
                type="button"
                data-testid="discard-local-session"
              >
                <Trash2 size={15} />
                {t("discard")}
              </button>
            </>
          ) : (
            <button
              className="button subtle"
              onClick={onReturnToSetup}
              type="button"
            >
              <RotateCcw size={15} />
              {t("backToSelection")}
            </button>
          )}
        </div>
      </div>
      {showJoinLink ? (
        <div className="joinLinkRow">
          <input
            value={joinUrl}
            readOnly
            aria-label={t("joinLink")}
            data-testid="join-link"
          />
          <button className="button" onClick={onCopyJoinLink} type="button">
            <Clipboard size={15} />
            {t("copyJoinLink")}
          </button>
        </div>
      ) : null}
      {terminal ? (
        <p className="muted">
          {terminalMessage(lobby.matchStatus, lobby.lifecycleResult)}
        </p>
      ) : start ? (
        <>
          <div className="lobbyFacts">
            <span>
              {start.matchFormat === "two_game_side_swap"
                ? t("matchSeries", { count: start.seriesGamesPlanned ?? 0 })
                : t(`matchFormat.${start.matchFormat}`)}
            </span>
            <span title={t("agendaTargetHelp")}>
              {t("agendaTarget", { count: start.agendaPointsToWin })}
            </span>
            <span title={t("playerTimeHelp")}>{playerClockLabel()}</span>
            <span title={t("traceHelp")}>
              {start.traceRulesProfile === "modern_open"
                ? t("trace.modern")
                : start.traceRulesProfile === "classic_blind"
                  ? t("trace.classic")
                  : t("trace.classicCorpTies")}
            </span>
            <span>
              {t("countdownSeconds", { count: start.countdownSeconds })}
            </span>
          </div>
          <div className="lobbyParticipants">
            <LobbyParticipantCard title={t("you")} participant={self} />
            <LobbyParticipantCard
              title={t("opponent")}
              participant={opponent}
            />
          </div>
          {canUseReadiness ? (
            <>
              <div className="readinessSummary">
                <span>{selfReady ? t("youReady") : t("youNotReady")}</span>
                <span>
                  {opponentReady ? t("opponentReady") : t("opponentNotReady")}
                </span>
              </div>
              <div className="lobbyActions">
                <button
                  className={`button lobbyReadyToggle${selfReady ? " is-ready" : ""}`}
                  onClick={() => onReady(!selfReady)}
                  type="button"
                  disabled={connection !== "online"}
                  data-testid="ready-toggle"
                >
                  {selfReady ? t("withdrawReady") : t("ready")}
                </button>
                {countdownActive ? (
                  <button className="button" onClick={onCancel} type="button">
                    <X size={15} />
                    {t("cancelCountdown")}
                  </button>
                ) : null}
                <button
                  className="button dangerButton"
                  onClick={isHost ? onCancelMatch : onLeaveMatch}
                  type="button"
                  disabled={connection !== "online"}
                  data-testid={isHost ? "cancel-match" : "leave-lobby"}
                >
                  <X size={15} />
                  {isHost ? t("cancelMatch") : t("leaveLobby")}
                </button>
                <span className="countdownText">
                  {countdownActive
                    ? t("countdownUntil", {
                        time: formatLobbyTime(start.countdownEndsAt, locale),
                      })
                    : t("startsWhenReady")}
                </span>
              </div>
              <div className="lobbyChat">
                <div className="lobbyChatMessages" ref={chatMessagesRef}>
                  {start.chatMessages.length === 0 ? (
                    <p className="muted">{t("noMessages")}</p>
                  ) : null}
                  {start.chatMessages.map((message) => (
                    <p key={message.id}>
                      <strong>{message.displayName}</strong>
                      <span>{formatLobbyTime(message.sentAt, locale)}</span>
                      {message.text}
                    </p>
                  ))}
                </div>
                <div className="lobbyChatInput">
                  <input
                    value={chatText}
                    maxLength={300}
                    onChange={(event) => onChatText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onSendChat();
                    }}
                    placeholder={t("shortMessage")}
                  />
                  <button className="button" onClick={onSendChat} type="button">
                    {t("send")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="lobbyActions">
              <span className="countdownText">
                {lobby.pendingDeckHandshake?.presentation.code ===
                "lobby_waiting_for_participant_deck"
                  ? t("waitingForParticipantDeck")
                  : t("opponentCanJoin")}
              </span>
              <button
                className="button dangerButton"
                onClick={isHost ? onCancelMatch : onLeaveMatch}
                type="button"
                disabled={connection !== "online"}
                data-testid={isHost ? "cancel-match" : "leave-lobby"}
              >
                <X size={15} />
                {isHost ? t("cancelMatch") : t("leaveLobby")}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="muted">
            {lobby.pendingDeckHandshake?.presentation.code ===
            "lobby_waiting_for_participant_deck"
              ? t("waitingForParticipantDeck")
              : t("preparing")}
          </p>
          <div className="lobbyActions">
            <button
              className="button dangerButton"
              onClick={isHost ? onCancelMatch : onLeaveMatch}
              type="button"
              data-testid={isHost ? "cancel-match" : "leave-lobby"}
            >
              <X size={15} />
              {isHost ? t("cancelMatch") : t("leaveLobby")}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function LobbyParticipantCard({
  title,
  participant,
}: {
  title: string;
  participant?: LobbyParticipant | undefined;
}) {
  const t = useTranslations("MatchStart.lobby");
  return (
    <div className="lobbyParticipantCard">
      <strong>{title}</strong>
      <span>{participant?.displayName ?? t("notConnected")}</span>
      <span>
        {participant?.side
          ? t(`side.${participant.side}`)
          : t("sideRandomized")}
      </span>
      <span>
        {participant?.runnerDeckReady && participant.corpDeckReady
          ? t("decksChecked")
          : t("decksOpen")}
      </span>
      <span>{participant?.ready ? t("statusReady") : t("statusNotReady")}</span>
      <span>
        {t(`connection.${participant?.connectionQuality ?? "offline"}`)}
      </span>
    </div>
  );
}
