import { Clipboard, CopyPlus, RotateCcw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiLobbyParticipantPayload, ApiLobbyPayload } from "@netgrid/shared";

import { matchStartPlayerClockLabel } from "../../app/match-start";
import {
  connectionQualityLabel,
  formatLobbyTime,
  isInvalidatingTerminalStatus,
  matchFormatLabel,
  playerSlotForSide,
  startLobbySideHeadline,
  terminalLobbyMessage,
  terminalLobbyTitle
} from "./lobby-format";

type LobbyClientPayload = ApiLobbyPayload;
type LobbyParticipant = ApiLobbyParticipantPayload;

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Korp";
}

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
  onCopyJoinLink
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
  const start = lobby.startLobby;
  const selfPlayer = start ? playerSlotForSide(start, lobby.side) : "player_a";
  const self = start?.participants[selfPlayer];
  const opponentPlayer = selfPlayer === "player_a" ? "player_b" : "player_a";
  const opponent = start?.participants[opponentPlayer];
  const selfReady = self?.ready ?? false;
  const countdownActive = lobby.matchStatus === "countdown" && Boolean(start?.countdownEndsAt);
  const opponentReady = opponent?.ready ?? false;
  const terminal = isInvalidatingTerminalStatus(lobby.matchStatus) || lobby.matchStatus === "forfeited" || lobby.matchStatus === "finished";
  const isHost = selfPlayer === "player_a";
  const canUseReadiness = Boolean(start && (lobby.matchStatus === "ready_check" || lobby.matchStatus === "countdown"));
  const showJoinLink = Boolean(joinUrl && !terminal && (lobby.pendingDeckHandshake || lobby.matchStatus === "pending"));
  const opponentName = lobby.opponentStatus.displayName ?? (opponent?.connected ? opponent.displayName : "Wartet auf Gegenüber");
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const countdownValue = useMemo(() => {
    if (!countdownActive || !start?.countdownEndsAt) return null;
    const remainingMs = new Date(start.countdownEndsAt).getTime() - countdownNowMs;
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
        <div className="lobbyCountdownOverlay" aria-live="polite" aria-atomic="true">
          <span className="lobbyCountdownDigit" key={countdownValue}>
            {countdownValue}
          </span>
        </div>
      ) : null}
      <div className="startLobbyHeader">
        <div>
          <p className="eyebrow">{terminal ? "Terminaler Matchstatus" : "Startbereitschaftslobby"}</p>
          <h2>{terminal ? terminalLobbyTitle(lobby.matchStatus, lobby.lifecycleResult) : start ? startLobbySideHeadline(lobby) : "Match erstellt"}</h2>
          <p className="meta">{opponentName ? `Gegenüber: ${opponentName}` : ""}</p>
        </div>
        <div className="startLobbyHeaderActions">
          <span className={`statusPill ${connection}`}>{connection === "online" ? "Du: verbunden" : connection === "connecting" ? "Du: verbindest" : "Du: getrennt"}</span>
          {terminal ? (
            <>
              <button className="button primary" onClick={onRecreate} type="button" data-testid="recreate-match">
                <CopyPlus size={15} />
                Neu erstellen
              </button>
              <button className="button subtle" onClick={onDiscardLocal} type="button" data-testid="discard-local-session">
                <Trash2 size={15} />
                Verwerfen
              </button>
            </>
          ) : (
            <button className="button subtle" onClick={onReturnToSetup} type="button">
              <RotateCcw size={15} />
              Zurück zur Auswahl
            </button>
          )}
        </div>
      </div>
      {showJoinLink ? (
        <div className="joinLinkRow">
          <input value={joinUrl} readOnly aria-label="Join-Link" data-testid="join-link" />
          <button className="button" onClick={onCopyJoinLink} type="button">
            <Clipboard size={15} />
            Join-Link kopieren
          </button>
        </div>
      ) : null}
      {terminal ? (
        <p className="muted">{terminalLobbyMessage(lobby.matchStatus, lobby.lifecycleResult)}</p>
      ) : start ? (
        <>
          <div className="lobbyFacts">
            <span>{matchFormatLabel(start.matchFormat)}</span>
            <span title="Agenda-Punkte, die für den Spielsieg erreicht werden müssen.">Zielwert {start.agendaPointsToWin} Agenda-Punkte</span>
            <span title="Spielerzeit-Einstellung für dieses Match.">{matchStartPlayerClockLabel(lobby.playerClock)}</span>
            <span>Countdown {start.countdownSeconds}s</span>
          </div>
          <div className="lobbyParticipants">
            <LobbyParticipantCard title="Du" participant={self} />
            <LobbyParticipantCard title="Gegenüber" participant={opponent} />
          </div>
          {canUseReadiness ? (
            <>
              <div className="readinessSummary">
                <span>{selfReady ? "Du bist bereit." : "Du bist noch nicht bereit."}</span>
                <span>{opponentReady ? "Gegenüber ist bereit." : "Gegenüber ist noch nicht bereit."}</span>
              </div>
              <div className="lobbyActions">
                <button className={`button lobbyReadyToggle${selfReady ? " is-ready" : ""}`} onClick={() => onReady(!selfReady)} type="button" disabled={connection !== "online"} data-testid="ready-toggle">
                  {selfReady ? "Bereitschaft zurücknehmen" : "Ich bin bereit"}
                </button>
                {countdownActive ? (
                  <button className="button" onClick={onCancel} type="button">
                    <X size={15} />
                    Countdown abbrechen
                  </button>
                ) : null}
                <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" disabled={connection !== "online"} data-testid={isHost ? "cancel-match" : "leave-lobby"}>
                  <X size={15} />
                  {isHost ? "Match abbrechen" : "Lobby verlassen"}
                </button>
                <span className="countdownText">{countdownActive ? `Countdown bis ${formatLobbyTime(start.countdownEndsAt)}` : "Startet automatisch, sobald beide bereit sind."}</span>
              </div>
              <div className="lobbyChat">
                <div className="lobbyChatMessages" ref={chatMessagesRef}>
                  {start.chatMessages.length === 0 ? <p className="muted">Noch keine Nachrichten.</p> : null}
                  {start.chatMessages.map((message) => (
                    <p key={message.id}>
                      <strong>{message.displayName}</strong>
                      <span>{formatLobbyTime(message.sentAt)}</span>
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
                    placeholder="Kurze Nachricht"
                  />
                  <button className="button" onClick={onSendChat} type="button">
                    Senden
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="lobbyActions">
              <span className="countdownText">{lobby.pendingDeckHandshake?.message ?? "Gegenüber kann jetzt über den Join-Link beitreten."}</span>
              <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" disabled={connection !== "online"} data-testid={isHost ? "cancel-match" : "leave-lobby"}>
                <X size={15} />
                {isHost ? "Match abbrechen" : "Lobby verlassen"}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="muted">{lobby.pendingDeckHandshake?.message ?? "Die Lobby wird vorbereitet."}</p>
          <div className="lobbyActions">
            <button className="button dangerButton" onClick={isHost ? onCancelMatch : onLeaveMatch} type="button" data-testid={isHost ? "cancel-match" : "leave-lobby"}>
              <X size={15} />
              {isHost ? "Match abbrechen" : "Lobby verlassen"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function LobbyParticipantCard({ title, participant }: { title: string; participant?: LobbyParticipant | undefined }) {
  return (
    <div className="lobbyParticipantCard">
      <strong>{title}</strong>
      <span>{participant?.displayName ?? "Noch nicht verbunden"}</span>
      <span>{participant?.side ? sideLabel(participant.side) : "Seite wird beim Start ausgelost"}</span>
      <span>{participant?.runnerDeckReady && participant.corpDeckReady ? "Decks geprüft" : "Decks offen"}</span>
      <span>{participant?.ready ? "Status: bereit" : "Status: nicht bereit"}</span>
      <span>{connectionQualityLabel(participant?.connectionQuality)}</span>
    </div>
  );
}
