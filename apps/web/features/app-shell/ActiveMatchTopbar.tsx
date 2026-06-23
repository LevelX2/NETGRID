"use client";

import {
  Cable,
  ChevronDown,
  ChevronUp,
  Flag,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RotateCcw
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
  rightRailCollapsed,
  onWorkspace,
  onToggleUndoPanel,
  onReconnect,
  onToggleMatchDetails,
  onStartNextSeriesGame,
  onLeaveMatch,
  onRequestForfeitMatch,
  onToggleRightRail
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
  rightRailCollapsed: boolean;
  onWorkspace(workspace: ActiveMatchWorkspace): void;
  onToggleUndoPanel(): void;
  onReconnect(): void;
  onToggleMatchDetails(): void;
  onStartNextSeriesGame(): void;
  onLeaveMatch(): void;
  onRequestForfeitMatch(): void;
  onToggleRightRail(): void;
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
    </header>
  );
}
