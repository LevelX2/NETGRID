"use client";

import type { ApiReplayAnalysisFrame, Side } from "@netgrid/shared";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ReplayBoard } from "../../features/replay/ReplayBoard";
import {
  clampReplayFrame,
  nextReplayFrame,
  playbackDelayMs,
  type ReplayParticipant,
} from "../../features/replay/replay-player-model";

const SERVER_HTTP =
  process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

type ReplayIndexEntry = {
  replayId: string;
  matchId: string;
  status: string;
  matchMode: string;
  matchFormat: string;
  createdAt: string;
  updatedAt: string;
  winner?: string;
  finalStateHash: string;
  replayOk?: boolean;
  participantNames: { runner?: string; corp?: string };
  participantSides: Record<ReplayParticipant, Side>;
};

type ReplayTimelineStep = {
  eventId: string;
  index: number;
  side?: Side;
  label: string;
  timingPoint: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  hiddenInfoBarrier: boolean;
  eventFamily: string;
  learningHint: string;
};

type ReplayView = {
  replayId: string;
  matchId: string;
  perspective: Side | "local_analysis";
  metadata: ReplayIndexEntry;
  timeline: ReplayTimelineStep[];
  frames: ApiReplayAnalysisFrame[];
  replayErrors: string[];
};

export default function ReplayPage() {
  const [index, setIndex] = useState<ReplayIndexEntry[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [perspective, setPerspective] = useState<ReplayParticipant>("player_a");
  const [replay, setReplay] = useState<ReplayView>();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [opponentHandOpen, setOpponentHandOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let closed = false;
    const requestedMatchId = new URLSearchParams(window.location.search).get(
      "matchId",
    );
    const loadIndex = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${SERVER_HTTP}/api/replays`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          replays?: ReplayIndexEntry[];
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(
            payload.error?.message ??
              "Replay-Liste konnte nicht geladen werden.",
          );
        }
        if (closed) return;
        const entries = payload.replays ?? [];
        setIndex(entries);
        const requested = entries.find(
          (entry) => entry.matchId === requestedMatchId,
        );
        setSelectedMatchId(requested?.matchId ?? entries[0]?.matchId ?? "");
        if (requestedMatchId && !requested) {
          setError("Dieses öffentliche Replay ist nicht verfügbar.");
        }
      } catch (loadError) {
        if (!closed)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Replay-Liste konnte nicht geladen werden.",
          );
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void loadIndex();
    return () => {
      closed = true;
    };
  }, []);

  const selectedEntry = index.find(
    (entry) => entry.matchId === selectedMatchId,
  );
  useEffect(() => {
    let closed = false;
    if (!selectedMatchId) {
      setReplay(undefined);
      return;
    }
    const loadReplay = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${SERVER_HTTP}/api/replays/${encodeURIComponent(selectedMatchId)}?perspective=local_analysis`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as
          | ReplayView
          | { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(
            (payload as { error?: { message?: string } }).error?.message ??
              "Replay konnte nicht geladen werden.",
          );
        }
        if (!closed) {
          setReplay(payload as ReplayView);
          setFrameIndex(0);
          setPlaying(false);
        }
      } catch (loadError) {
        if (!closed) {
          setReplay(undefined);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Replay konnte nicht geladen werden.",
          );
        }
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void loadReplay();
    return () => {
      closed = true;
    };
  }, [selectedMatchId]);

  const frames = replay?.frames ?? [];
  const currentFrame = frames[clampReplayFrame(frameIndex, frames.length)];

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => {
        return nextReplayFrame(current, frames.length);
      });
    }, playbackDelayMs(speed));
    return () => window.clearInterval(timer);
  }, [playing, speed, frames.length]);

  useEffect(() => {
    if (playing && frameIndex >= frames.length - 1) setPlaying(false);
  }, [playing, frameIndex, frames.length]);

  const currentStep = useMemo(() => {
    if (!currentFrame?.sourceEventId) return undefined;
    return replay?.timeline.find(
      (step) => step.eventId === currentFrame.sourceEventId,
    );
  }, [currentFrame, replay?.timeline]);

  const seek = (next: number) => {
    setPlaying(false);
    setFrameIndex(clampReplayFrame(next, frames.length));
  };

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Lern-Replay</p>
          <h1 style={{ margin: 0 }}>Partie Schritt für Schritt verstehen</h1>
          <p style={{ marginBottom: 0, opacity: 0.78 }}>
            Perspektive wechseln, abspielen und bei Bedarf die gegnerische Hand
            parallel einblenden.
          </p>
        </div>
        <Link href="/">Zurück zur Übersicht</Link>
      </header>

      <section style={controlPanel} aria-label="Replay-Auswahl">
        <label style={fieldStyle}>
          Replay
          <select
            value={selectedMatchId}
            onChange={(event) => setSelectedMatchId(event.target.value)}
            disabled={index.length === 0}
          >
            {index.length === 0 ? (
              <option value="">Keine Replays</option>
            ) : null}
            {index.map((entry) => (
              <option key={entry.replayId} value={entry.matchId}>
                {participantLabel(entry)} ·{" "}
                {new Date(entry.updatedAt).toLocaleString("de-DE")}
              </option>
            ))}
          </select>
        </label>

        <div style={fieldStyle}>
          Perspektive
          <div style={buttonRow}>
            <button
              type="button"
              aria-pressed={perspective === "player_a"}
              onClick={() => setPerspective("player_a")}
              disabled={!selectedEntry}
            >
              Teilnehmer A
            </button>
            <button
              type="button"
              aria-pressed={perspective === "player_b"}
              onClick={() => setPerspective("player_b")}
              disabled={!selectedEntry}
            >
              Teilnehmer B
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpponentHandOpen((open) => !open)}
          disabled={!currentFrame}
          aria-pressed={opponentHandOpen}
          data-testid="toggle-replay-opponent-hand"
        >
          {opponentHandOpen ? "Gegnerhand schließen" : "Gegnerhand zeigen"}
        </button>
      </section>

      {error ? (
        <p role="alert" style={errorStyle}>
          {error}
        </p>
      ) : null}
      {loading ? <p>Lade Replay …</p> : null}

      {currentFrame ? (
        <>
          <section style={playbackPanel} aria-label="Replay-Steuerung">
            <div style={buttonRow}>
              <button
                type="button"
                onClick={() => seek(0)}
                disabled={frameIndex === 0}
              >
                Anfang
              </button>
              <button
                type="button"
                onClick={() => seek(frameIndex - 1)}
                disabled={frameIndex === 0}
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? "Pause" : "Abspielen"}
              </button>
              <button
                type="button"
                onClick={() => seek(frameIndex + 1)}
                disabled={frameIndex >= frames.length - 1}
              >
                Weiter
              </button>
              <button
                type="button"
                onClick={() => seek(frames.length - 1)}
                disabled={frameIndex >= frames.length - 1}
              >
                Ende
              </button>
            </div>

            <label style={{ ...fieldStyle, flex: 1 }}>
              Schritt {frameIndex + 1} von {frames.length}
              <input
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={frameIndex}
                onChange={(event) => seek(Number(event.target.value))}
                data-testid="replay-scrubber"
              />
            </label>

            <label style={fieldStyle}>
              Geschwindigkeit
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value={0.5}>0,5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </label>

            <div style={stepInfoStyle}>
              <strong>{currentStep?.label ?? "Startzustand"}</strong>
              <span>
                {currentStep?.learningHint ?? currentFrame.timingPoint}
              </span>
              <code>
                State {currentFrame.stateVersion} · Hash{" "}
                {currentFrame.stateHashVerified ? "verifiziert" : "abweichend"}
              </code>
            </div>
          </section>

          <ReplayBoard
            frame={currentFrame}
            perspective={perspective}
            opponentHandOpen={opponentHandOpen}
            onCloseOpponentHand={() => setOpponentHandOpen(false)}
          />
        </>
      ) : null}
    </main>
  );
}

function participantLabel(entry: ReplayIndexEntry): string {
  const sideA = entry.participantSides.player_a;
  const sideB = entry.participantSides.player_b;
  return `${entry.participantNames[sideA] ?? "Teilnehmer A"} vs ${entry.participantNames[sideB] ?? "Teilnehmer B"}`;
}

const pageStyle = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 16,
} as const;

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 18,
} as const;

const eyebrowStyle = {
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  opacity: 0.68,
} as const;

const controlPanel = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "end",
  gap: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: 16,
} as const;

const playbackPanel = {
  display: "grid",
  gridTemplateColumns: "auto minmax(240px, 1fr) auto",
  gap: 14,
  alignItems: "end",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: 16,
} as const;

const fieldStyle = {
  display: "grid",
  gap: 6,
} as const;

const buttonRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
} as const;

const stepInfoStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 12,
  borderTop: "1px solid rgba(255,255,255,0.1)",
  paddingTop: 12,
} as const;

const errorStyle = { color: "#ff8f8f", margin: 0 } as const;
