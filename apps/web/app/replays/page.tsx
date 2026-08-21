"use client";

import type {
  ApiReplayAnalysisFrame,
  PublicGameEvent,
  Side,
} from "@netgrid/shared";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "use-intl/react";

import {
  CardImagePreferenceContext,
  CardScaleSettingsContext,
  CardTooltipSettingsContext,
} from "../../features/cards/card-display-settings";
import { usePersistentCardScaleSettings } from "../../features/cards/usePersistentCardScaleSettings";
import { ReplayBoard } from "../../features/replay/ReplayBoard";
import {
  DEFAULT_REPLAY_BOARD_SETTINGS,
  loadReplayBoardSettings,
} from "../../features/replay/replay-board-settings";
import {
  clampReplayFrame,
  nextReplayFrame,
  playbackDelayMs,
  publicEventsThroughReplayFrame,
} from "../../features/replay/replay-player-model";
import { readLocalStorage } from "../../lib/local-storage";
import type {
  CatalogCardDetail,
  CatalogListResponse,
} from "../../features/catalog/catalog-types";
import { CatalogDetailRequestCoordinator } from "../../features/catalog/catalog-detail-loader";
import { publicChronicleCardDefinitionIds } from "../../features/chronicle/chronicle-public-card-ids";
import type { PublicCardPresentationsById } from "../public-card-presentation";
import {
  CatalogCardPresentationsProvider,
  catalogCardPresentationsFor,
} from "../../features/catalog/catalog-card-presentations";

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
  publicEvents: PublicGameEvent[];
  timeline: ReplayTimelineStep[];
  frames: ApiReplayAnalysisFrame[];
  replayErrors: string[];
};

export default function ReplayPage() {
  const t = useTranslations("Replay");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [perspective, setPerspective] = useState<Side>("runner");
  const [replay, setReplay] = useState<ReplayView>();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardPresentationsById, setCardPresentationsById] =
    useState<PublicCardPresentationsById>({});
  const [cardDetailsById, setCardDetailsById] = useState<
    Record<string, CatalogCardDetail>
  >({});
  const cardDetailsByIdRef = useRef(cardDetailsById);
  const cardDetailRequestCoordinatorRef = useRef(
    new CatalogDetailRequestCoordinator(),
  );
  const [boardSettings, setBoardSettings] = useState(
    DEFAULT_REPLAY_BOARD_SETTINGS,
  );
  const cardScaleSettings = usePersistentCardScaleSettings();

  useEffect(() => {
    setBoardSettings(loadReplayBoardSettings(readLocalStorage));
  }, []);

  useEffect(() => {
    let closed = false;
    void fetch("/api/cards/catalog", { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) => {
        if (closed) return;
        setCardPresentationsById(catalogCardPresentationsFor(data.cards ?? []));
      })
      .catch(() => {
        if (!closed) setCardPresentationsById({});
      });
    return () => {
      closed = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = boardSettings.colorScheme;
  }, [boardSettings.colorScheme]);

  useEffect(() => {
    const requestedMatchId = new URLSearchParams(window.location.search).get(
      "matchId",
    );
    if (requestedMatchId) setSelectedMatchId(requestedMatchId);
    else setError(t("noReplaySelected"));
  }, [t]);

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
          | { error?: { code?: string } };
        if (!response.ok) {
          throw new Error("replay_load_failed");
        }
        if (!closed) {
          setReplay(payload as ReplayView);
          setFrameIndex(0);
          setPerspective("runner");
          setPlaying(false);
        }
      } catch {
        if (!closed) {
          setReplay(undefined);
          setError(t("loadFailed"));
        }
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void loadReplay();
    return () => {
      closed = true;
    };
  }, [selectedMatchId, t]);

  const frames = replay?.frames ?? [];
  const currentFrame = frames[clampReplayFrame(frameIndex, frames.length)];
  const currentPublicEvents = useMemo(
    () =>
      publicEventsThroughReplayFrame(
        replay?.publicEvents ?? [],
        currentFrame?.stateVersion ?? 0,
      ),
    [currentFrame?.stateVersion, replay?.publicEvents],
  );

  useEffect(() => {
    const cardIds = Array.from(
      new Set(
        (replay?.publicEvents ?? []).flatMap(publicChronicleCardDefinitionIds),
      ),
    );
    if (cardIds.length === 0) return;
    void cardDetailRequestCoordinatorRef.current.ensure(
      cardIds,
      (cardId) => Boolean(cardDetailsByIdRef.current[cardId]),
      async (cardId) => {
        const response = await fetch(
          `/api/cards/catalog/${encodeURIComponent(cardId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return null;
        const data = (await response.json()) as { card?: CatalogCardDetail };
        return data.card ?? null;
      },
      (detail) => {
        setCardDetailsById((current) => {
          if (current[detail.catalogCardId]) return current;
          const next = { ...current, [detail.catalogCardId]: detail };
          cardDetailsByIdRef.current = next;
          return next;
        });
      },
    );
  }, [replay?.publicEvents]);

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
  const resourceStripVisible = boardSettings.resourceStripMode === "on";
  const replayClassName = [
    "app",
    "activeMatch",
    "replayApp",
    boardSettings.topbarStickyEnabled ? "" : "topbarStickyDisabled",
    boardSettings.cyberspaceBackgroundEnabled
      ? "cyberspaceBackgroundEnabled"
      : "",
    `resourceStrip-${boardSettings.resourceStripMode}`,
    resourceStripVisible ? "resourceStripVisible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={replayClassName} data-theme={boardSettings.colorScheme}>
      <header className="topbar replayTopbar">
        <div className="replayTopbarIdentity">
          <button
            type="button"
            className="button replayBackButton"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.assign("/");
            }}
          >
            {t("backToGames")}
          </button>
          {replay ? (
            <strong>
              {participantLabel(
                replay.metadata,
                t("side.runner"),
                t("side.corp"),
              )}
            </strong>
          ) : null}
        </div>

        <div className="replayTopbarControls" aria-label={t("controls")}>
          <div
            className="replayPerspectiveSwitch"
            aria-label={t("perspective")}
          >
            <button
              className="button"
              type="button"
              aria-pressed={perspective === "runner"}
              onClick={() => setPerspective("runner")}
              disabled={!currentFrame}
            >
              {t("side.runner")}
            </button>
            <button
              className="button"
              type="button"
              aria-pressed={perspective === "corp"}
              onClick={() => setPerspective("corp")}
              disabled={!currentFrame}
            >
              {t("side.corp")}
            </button>
          </div>
          <button
            className="button iconOnly"
            type="button"
            onClick={() => seek(0)}
            disabled={frameIndex === 0}
            aria-label={t("toStart")}
            title={t("toStart")}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="button"
            type="button"
            onClick={() => seek(frameIndex - 1)}
            disabled={frameIndex === 0}
          >
            <ChevronLeft size={16} /> {t("previous")}
          </button>
          <button
            className="button replayPlayButton"
            type="button"
            onClick={togglePlayback}
            disabled={!currentFrame}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? t("pause") : t("play")}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => seek(frameIndex + 1)}
            disabled={frameIndex >= frames.length - 1}
          >
            {t("next")} <ChevronRight size={16} />
          </button>
          <strong className="replayStepCount">
            {frames.length > 0 ? frameIndex + 1 : 0} / {frames.length}
          </strong>
        </div>
      </header>

      {currentFrame ? (
        <div className="matchStrip replayTimelineStrip">
          <label className="replayScrubberLabel">
            <span>
              {frameIndex === 0
                ? t("initialState")
                : t("step", { number: frameIndex + 1 })}
            </span>
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
            {t("stateVersion", { version: currentFrame.stateVersion })}
          </span>
          <label className="replaySpeedLabel">
            {t("speed")}
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
        <div className="activeMatchWorkspace">{t("loading")}</div>
      ) : null}

      {currentFrame ? (
        <CardScaleSettingsContext.Provider
          value={{
            tooltipPercent: cardScaleSettings.cardTooltipScalePercent,
            handPercent: cardScaleSettings.cardHandScalePercent,
            archivePercent: cardScaleSettings.cardArchiveScalePercent,
            zonePercent: cardScaleSettings.cardZoneScalePercent,
            boardPercent: cardScaleSettings.cardBoardScalePercent,
            rigPercent: cardScaleSettings.cardRigScalePercent,
            specialZonePercent: cardScaleSettings.cardSpecialZoneScalePercent,
          }}
        >
          <CardImagePreferenceContext.Provider
            value={{
              preferGermanCardImages: boardSettings.preferGermanCardImages,
              showSetBadges: boardSettings.showSetBadges,
            }}
          >
            <CardTooltipSettingsContext.Provider
              value={{
                hoverOpenDelayMs: boardSettings.cardTooltipHoverDelayMs,
                mode: boardSettings.cardTooltipMode,
              }}
            >
              <CatalogCardPresentationsProvider value={cardPresentationsById}>
                <ReplayBoard
                  frame={currentFrame}
                  perspective={perspective}
                  displayNames={replay?.metadata.participantNames ?? {}}
                  publicEvents={currentPublicEvents}
                  cardPresentationsById={cardPresentationsById}
                  cardDetailsById={cardDetailsById}
                  cardDisplayMode={boardSettings.cardDisplayMode}
                  chronicleDetailMode={boardSettings.chronicleDetailMode}
                />
              </CatalogCardPresentationsProvider>
            </CardTooltipSettingsContext.Provider>
          </CardImagePreferenceContext.Provider>
        </CardScaleSettingsContext.Provider>
      ) : null}
    </main>
  );
}

function participantLabel(
  entry: ReplayIndexEntry,
  runnerFallback: string,
  corpFallback: string,
): string {
  return `${entry.participantNames.runner ?? runnerFallback} vs ${entry.participantNames.corp ?? corpFallback}`;
}
