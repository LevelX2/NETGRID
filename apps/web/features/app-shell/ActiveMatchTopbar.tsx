"use client";

import {
  Cable,
  Brain,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flag,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Square,
  RotateCcw,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import { useTranslations } from "use-intl/react";
import {
  ActiveMatchWorkspaceNav,
  AppBrand,
  ConnectionBadge,
  type ActiveMatchWorkspace,
  type ConnectionState,
} from "./AppShell";
import { AppRuntimeStatus } from "./AppRuntimeStatus";

type PendingUndoState =
  | {
      needsResponse?: boolean;
    }
  | undefined;

export function ActiveMatchTopbar({
  topbarRef,
  appName,
  appStatusLabel,
  appIconSrc,
  appWordmarkSrc,
  statusText,
  connection,
  workspace,
  activeMatchIsGame,
  undoPanelOpen,
  pendingUndo,
  canReconnect,
  matchDetailsOpen,
  canStartNextSeriesGame,
  seriesTransitioning,
  canReturnToStart,
  canForfeit,
  canCancelSimulation,
  rightRailCollapsed,
  canRequestHumanAiAdvice,
  canOpenDeckGuide,
  humanAiAdvice,
  humanAiAdviceError,
  humanAiAdviceLoading,
  onWorkspace,
  onToggleUndoPanel,
  onReconnect,
  onToggleMatchDetails,
  onStartNextSeriesGame,
  onLeaveMatch,
  onRequestForfeitMatch,
  onRequestCancelSimulation,
  onToggleRightRail,
  onRequestHumanAiAdvice,
  onOpenDeckGuide,
  onCloseHumanAiAdvice,
}: {
  topbarRef: RefObject<HTMLElement | null>;
  appName: string;
  appStatusLabel: string;
  appIconSrc: string;
  appWordmarkSrc: string;
  statusText: string;
  connection: ConnectionState;
  workspace: ActiveMatchWorkspace;
  activeMatchIsGame: boolean;
  undoPanelOpen: boolean;
  pendingUndo: PendingUndoState;
  canReconnect: boolean;
  matchDetailsOpen: boolean;
  canStartNextSeriesGame: boolean;
  seriesTransitioning: boolean;
  canReturnToStart: boolean;
  canForfeit: boolean;
  canCancelSimulation: boolean;
  rightRailCollapsed: boolean;
  canRequestHumanAiAdvice: boolean;
  canOpenDeckGuide: boolean;
  humanAiAdvice: string | null;
  humanAiAdviceError: string;
  humanAiAdviceLoading: boolean;
  onWorkspace(workspace: ActiveMatchWorkspace): void;
  onToggleUndoPanel(): void;
  onReconnect(): void;
  onToggleMatchDetails(): void;
  onStartNextSeriesGame(): void;
  onLeaveMatch(): void;
  onRequestForfeitMatch(): void;
  onRequestCancelSimulation(): void;
  onToggleRightRail(): void;
  onRequestHumanAiAdvice(): void;
  onOpenDeckGuide(): void;
  onCloseHumanAiAdvice(): void;
}) {
  const t = useTranslations("AppShell.topbar");
  const undoLabel = pendingUndo?.needsResponse
    ? t("answerUndo")
    : t("requestUndo");
  const matchDetailsLabel = matchDetailsOpen
    ? t("hideMatchStatus")
    : t("showMatchStatus");
  const rightRailLabel = rightRailCollapsed
    ? t("showRightRail")
    : t("hideRightRail");

  return (
    <header className="topbar" ref={topbarRef}>
      <div className="topbarStatusGroup">
        <AppBrand
          appName={appName}
          iconSrc={appIconSrc}
          wordmarkSrc={appWordmarkSrc}
        />
        <div className="topbarMeta">
          <AppRuntimeStatus statusLabel={appStatusLabel} />
          <ConnectionBadge text={statusText} state={connection} />
        </div>
      </div>
      <ActiveMatchWorkspaceNav
        workspace={workspace}
        onWorkspace={onWorkspace}
      />
      {activeMatchIsGame ? (
        <div className="toolbar">
          <button
            className={`button iconOnly topbarUndoToggle ${undoPanelOpen ? "active" : ""} ${pendingUndo ? "attention" : ""}`}
            onClick={onToggleUndoPanel}
            title={undoLabel}
            aria-label={undoLabel}
            aria-expanded={undoPanelOpen}
            aria-controls="undo-strip"
            type="button"
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="button iconOnly"
            onClick={onRequestHumanAiAdvice}
            disabled={!canRequestHumanAiAdvice || humanAiAdviceLoading}
            title={t("askAi")}
            aria-label={t("askAi")}
            type="button"
          >
            <Brain size={16} />
          </button>
          {canOpenDeckGuide ? (
            <button
              className="button iconOnly"
              onClick={onOpenDeckGuide}
              title={t("openDeckGuide")}
              aria-label={t("openDeckGuide")}
              type="button"
            >
              <BookOpen size={16} />
            </button>
          ) : null}
          {connection !== "online" ? (
            <button
              className="button"
              onClick={onReconnect}
              disabled={!canReconnect}
              title={t("reconnect")}
              type="button"
            >
              <Cable size={16} />
              {t("reconnect")}
            </button>
          ) : null}
          <button
            className={`button iconOnly matchDetailsToggle ${matchDetailsOpen ? "active" : ""}`}
            onClick={onToggleMatchDetails}
            title={matchDetailsLabel}
            aria-label={matchDetailsLabel}
            aria-expanded={matchDetailsOpen}
            aria-controls="match-details-strip"
            type="button"
          >
            {matchDetailsOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          {canStartNextSeriesGame ? (
            <button
              className="button primary"
              onClick={onStartNextSeriesGame}
              disabled={seriesTransitioning}
              title={t("continueSeriesTitle")}
              type="button"
            >
              <Play size={16} />
              {seriesTransitioning ? t("creating") : t("continueSeries")}
            </button>
          ) : null}
          {canReturnToStart ? (
            <button
              className={canStartNextSeriesGame ? "button" : "button primary"}
              onClick={onLeaveMatch}
              title={t("backToStart")}
              type="button"
            >
              <Play size={16} />
              {t("startScreen")}
            </button>
          ) : null}
          {canForfeit ? (
            <button
              className="button dangerButton"
              onClick={onRequestForfeitMatch}
              title={t("forfeitTitle")}
              type="button"
            >
              <Flag size={16} />
              {t("forfeit")}
            </button>
          ) : null}
          {canCancelSimulation ? (
            <button
              className="button dangerButton"
              onClick={onRequestCancelSimulation}
              title={t("cancelSimulationTitle")}
              type="button"
            >
              <Square size={15} />
              {t("cancelSimulation")}
            </button>
          ) : null}
          <button
            className={`button iconOnly rightRailHeaderToggle ${rightRailCollapsed ? "is-hidden" : "is-visible"}`}
            onClick={onToggleRightRail}
            title={rightRailLabel}
            aria-label={rightRailLabel}
            aria-pressed={rightRailCollapsed}
            type="button"
          >
            {rightRailCollapsed ? (
              <PanelRightOpen size={16} />
            ) : (
              <PanelRightClose size={16} />
            )}
          </button>
        </div>
      ) : null}
      {humanAiAdvice || humanAiAdviceError || humanAiAdviceLoading ? (
        <div className="humanAiAdviceOverlay" role="presentation">
          <section
            className="humanAiAdviceDialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("aiAdvice")}
          >
            <div className="humanAiAdviceHeader">
              <strong>{t("aiAdvice")}</strong>
              <button
                className="button iconOnly"
                type="button"
                onClick={onCloseHumanAiAdvice}
                aria-label={t("closeAdvice")}
                title={t("close")}
              >
                <X size={15} />
              </button>
            </div>
            <p>
              {humanAiAdviceLoading
                ? t("aiLoading")
                : humanAiAdviceError || humanAiAdvice}
            </p>
          </section>
        </div>
      ) : null}
    </header>
  );
}
