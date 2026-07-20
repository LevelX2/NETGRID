"use client";

import type { ApiReplayAnalysisFrame, Side } from "@netgrid/shared";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ReplayBoard } from "../../features/replay/ReplayBoard";
import {
  clampReplayFrame,
  nextReplayFrame,
  playbackDelayMs,
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
  const [perspective, setPerspective] = useState<Side>("runner");
  const [replay, setReplay] = useState<ReplayView>();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
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
        if (!closed) setError(errorMessage(loadError, "Replay-Liste"));
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void loadIndex();
    return () => {
      closed = true;
    };
  }, []);

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
          setPerspective("runner");
          setPlaying(false);
        }
      } catch (loadError) {
        if (!closed) {
          setReplay(undefined);
          setError(errorMessage(loadError, "Replay"));
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
  const currentStep = useMemo(() => {
    if (!currentFrame?.sourceEventId) return undefined;
    return replay?.timeline.find(
      (step) => step.eventId === currentFrame.sourceEventId,
    );
  }, [currentFrame, replay?.timeline]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => nextReplayFrame(current, frames.length));
    }, playbackDelayMs(speed));
    return () => window.clearInterval(timer);
  }, [playing, speed, frames.length]);

  useEffect(() => {
    if (playing && frameIndex >= frames.length - 1) setPlaying(false);
  }, [playing, frameIndex, frames.length]);

  const seek = (next: number) => {
    setPlaying(false);
    setFrameIndex(clampReplayFrame(next, frames.length));
  };
  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (frameIndex >= frames.length - 1) setFrameIndex(0);
    setPlaying(true);
  };

  return (
    <main
      className="app activeMatch cyberspaceBackgroundEnabled resourceStrip-on resourceStripVisible replayApp"
      data-theme="black"
    >
      <header className="topbar replayTopbar">
        <div className="replayTopbarIdentity">
          <Link href="/" className="button replayBackButton">
            Zurück
          </Link>
          <label>
            <span className="srOnly">Replay auswählen</span>
            <select
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              disabled={index.length === 0}
              aria-label="Replay auswählen"
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
        </div>

        <div className="replayTopbarControls" aria-label="Replay-Steuerung">
          <div className="replayPerspectiveSwitch" aria-label="Perspektive">
            <button
              className="button"
              type="button"
              aria-pressed={perspective === "runner"}
              onClick={() => setPerspective("runner")}
              disabled={!currentFrame}
            >
              Runner
            </button>
            <button
              className="button"
              type="button"
              aria-pressed={perspective === "corp"}
              onClick={() => setPerspective("corp")}
              disabled={!currentFrame}
            >
              Korp
            </button>
          </div>
          <button
            className="button iconOnly"
            type="button"
            onClick={() => seek(0)}
            disabled={frameIndex === 0}
            aria-label="Zum Anfang"
            title="Zum Anfang"
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="button"
            type="button"
            onClick={() => seek(frameIndex - 1)}
            disabled={frameIndex === 0}
          >
            <ChevronLeft size={16} /> Zurück
          </button>
          <button
            className="button replayPlayButton"
            type="button"
            onClick={togglePlayback}
            disabled={!currentFrame}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? "Pause" : "Abspielen"}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => seek(frameIndex + 1)}
            disabled={frameIndex >= frames.length - 1}
          >
            Nächster Schritt <ChevronRight size={16} />
          </button>
          <strong className="replayStepCount">
            {frames.length > 0 ? frameIndex + 1 : 0} / {frames.length}
          </strong>
        </div>
      </header>

      {currentFrame ? (
        <div className="matchStrip replayTimelineStrip">
          <label className="replayScrubberLabel">
            <span>{currentStep?.label ?? "Startzustand"}</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={frameIndex}
              onChange={(event) => seek(Number(event.target.value))}
              data-testid="replay-scrubber"
            />
          </label>
          <span className="replayLearningHint">
            {currentStep?.learningHint ?? currentFrame.timingPoint}
          </span>
          <label className="replaySpeedLabel">
            Tempo
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            >
              <option value={0.5}>0,5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </label>
        </div>
      ) : null}

      {error ? (
        <div className="matchNotice replayError" role="alert">
          {error}
        </div>
      ) : null}
      {loading && !currentFrame ? (
        <div className="activeMatchWorkspace">Lade Replay …</div>
      ) : null}

      {currentFrame ? (
        <ReplayBoard
          frame={currentFrame}
          perspective={perspective}
          displayNames={replay?.metadata.participantNames ?? {}}
        />
      ) : null}
    </main>
  );
}

function participantLabel(entry: ReplayIndexEntry): string {
  return `${entry.participantNames.runner ?? "Runner"} vs ${entry.participantNames.corp ?? "Korp"}`;
}

function errorMessage(error: unknown, subject: string): string {
  return error instanceof Error
    ? error.message
    : `${subject} konnte nicht geladen werden.`;
}
