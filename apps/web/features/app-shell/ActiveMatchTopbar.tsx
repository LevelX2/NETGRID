"use client";

import {
  Cable,
  Brain,
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
import {
  ActiveMatchWorkspaceNav,
  AppBrand,
  ConnectionBadge,
  type ActiveMatchWorkspace,
  type ConnectionState
} from "./AppShell";

type PendingUndoState = {
  needsResponse?: boolean;
} | undefined;

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
  onCloseHumanAiAdvice(): void;
}) {
  const undoLabel = pendingUndo?.needsResponse ? "Zurücknahme beantworten" : "Zurücknahme anfragen";
  const matchDetailsLabel = matchDetailsOpen ? "Aktives Spiel: Status ausblenden" : "Aktives Spiel: Status einblenden";
  const rightRailLabel = rightRailCollapsed ? "Rechten Bereich einblenden" : "Rechten Bereich ausblenden";

  return (
    <header className="topbar" ref={topbarRef}>
      <div className="topbarStatusGroup">
        <AppBrand appName={appName} iconSrc={appIconSrc} wordmarkSrc={appWordmarkSrc} />
        <div className="topbarMeta">
          <span className="topbarVersion">{appStatusLabel}</span>
          <ConnectionBadge text={statusText} state={connection} />
        </div>
      </div>
      <ActiveMatchWorkspaceNav workspace={workspace} onWorkspace={onWorkspace} />
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
            title="KI für mein Deck fragen"
            aria-label="KI für mein Deck fragen"
            type="button"
          >
            <Brain size={16} />
          </button>
          {connection !== "online" ? (
            <button className="button" onClick={onReconnect} disabled={!canReconnect} title="Wieder verbinden" type="button">
              <Cable size={16} />
              Wieder verbinden
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
            {matchDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canStartNextSeriesGame ? (
            <button
              className="button primary"
              onClick={onStartNextSeriesGame}
              disabled={seriesTransitioning}
              title="Nächstes Serienspiel mit Seitenwechsel erstellen"
              type="button"
            >
              <Play size={16} />
              {seriesTransitioning ? "Erstelle..." : "Matchserie fortsetzen"}
            </button>
          ) : null}
          {canReturnToStart ? (
            <button className={canStartNextSeriesGame ? "button" : "button primary"} onClick={onLeaveMatch} title="Zurück zum Startbildschirm" type="button">
              <Play size={16} />
              Startbildschirm
            </button>
          ) : null}
          {canForfeit ? (
            <button className="button dangerButton" onClick={onRequestForfeitMatch} title="Spiel aufgeben" type="button">
              <Flag size={16} />
              Aufgeben
            </button>
          ) : null}
          {canCancelSimulation ? (
            <button className="button dangerButton" onClick={onRequestCancelSimulation} title="KI-gegen-KI-Simulation abbrechen" type="button">
              <Square size={15} />
              Simulation abbrechen
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
            {rightRailCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>
        </div>
      ) : null}
      {humanAiAdvice || humanAiAdviceError || humanAiAdviceLoading ? (
        <div className="humanAiAdviceOverlay" role="presentation">
          <section
            className="humanAiAdviceDialog"
            role="dialog"
            aria-modal="true"
            aria-label="KI für mein Deck"
          >
            <div className="humanAiAdviceHeader">
              <strong>KI für mein Deck</strong>
              <button
                className="button iconOnly"
                type="button"
                onClick={onCloseHumanAiAdvice}
                aria-label="Hinweis schließen"
                title="Schließen"
              >
                <X size={15} />
              </button>
            </div>
            <p>
              {humanAiAdviceLoading
                ? "Die KI prüft die aktuelle Situation …"
                : humanAiAdviceError || humanAiAdvice}
            </p>
          </section>
        </div>
      ) : null}
    </header>
  );
}
