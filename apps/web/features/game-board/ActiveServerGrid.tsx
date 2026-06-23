"use client";

import { Route } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";

import type { BoardHighlight } from "../../app/action-cues";
import {
  actionButtonLabel,
  iceModifierBadgesForServer,
  runPositionStatusLabel,
  serverBoardRows,
  serverDisplayLabel,
  showInstalledCorpState,
  type ActionContext
} from "../../app/action-board-ui";
import { CardView } from "../cards/CardView";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import { scoreCardStateBadges } from "../cards/ScoredAgendaState";
import type { CardDisplayMode } from "../settings/settings-model";
import { ArchivesDualStackLane } from "./ArchivesDualStackLane";
import type { FieldChoiceCardProps } from "./RunnerBoardStrips";
import { ServerCounterStrip } from "./CounterStrips";
import { HandCardsRow, ZoneCollapseButton, ZoneIdentityIcon, serverZoneIdentityIconKind, zoneSideClass } from "./ZoneFrame";
import {
  centralServerCountLabel,
  formatHandLimitCount,
  iceStackSlotClass,
  serverHighlighted,
  serverLanesForSide,
  zoneHighlighted
} from "./board-view-helpers";

const CORP_OPPONENT_HQ_PREVIEW_LIMIT = 18;
const RunIcon = Route;

type DiscardOption = {
  id: string;
};

export function ActiveServerGrid({
  view,
  actionDisabled,
  activeHighlight,
  activeRunTargetIds,
  activeRunIceId,
  viewedApproachIceId,
  viewedInstalledExposeCardId,
  selectedActionContext,
  selectedDiscardOptionIdSet,
  boardLaneStyle,
  handCardsStyle,
  zoneCardsStyle,
  cardDisplayMode,
  boardZoneCollapsedFor,
  toggleBoardZoneCollapsed,
  runActionForServer,
  cardActionsFor,
  enrichCard,
  scoreAreaCardsBySide,
  discardOptionForCard,
  toggleDiscardOption,
  fieldChoiceCardProps,
  onAction,
  onFocus,
  onActionContextSelect,
  onSelectActionContext
}: {
  view: PlayerView;
  actionDisabled: boolean;
  activeHighlight: BoardHighlight | null;
  activeRunTargetIds: string[];
  activeRunIceId: string | null;
  viewedApproachIceId: string | null;
  viewedInstalledExposeCardId: string | null;
  selectedActionContext: ActionContext | null;
  selectedDiscardOptionIdSet: ReadonlySet<string>;
  boardLaneStyle: CSSProperties;
  handCardsStyle: CSSProperties;
  zoneCardsStyle: CSSProperties;
  cardDisplayMode: CardDisplayMode;
  boardZoneCollapsedFor(key: string): boolean;
  toggleBoardZoneCollapsed(key: string): void;
  runActionForServer(serverId: string): LegalAction | null;
  cardActionsFor(card: VisibleCard): LegalAction[];
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  scoreAreaCardsBySide(side: Side): VisibleCard[];
  discardOptionForCard(card: VisibleCard): DiscardOption | null;
  toggleDiscardOption(optionId: string): void;
  fieldChoiceCardProps(card: VisibleCard): FieldChoiceCardProps;
  onAction(action: LegalAction): void;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onSelectActionContext(context: ActionContext): void;
}) {
  const laneClassName = (lane: { kind: "ice" | "root"; cards: VisibleCard[] }) =>
    `lane ${lane.kind === "ice" ? "iceLane" : "rootLane"}${lane.kind === "ice" && lane.cards.length >= 7 ? " scrollableIceLane" : ""}`;

  return (
    <div className="serverGrid">
      {serverBoardRows(view.servers, view.side).map((row) =>
        row.servers.length > 0 ? (
          <div className={`serverRow ${row.kind}`} key={row.kind} data-testid={`server-row-${row.kind}`}>
            {row.servers.map((server) => {
              const countLabel = centralServerCountLabel(view, server.id);
              const runAction = runActionForServer(server.id);
              const lanes = serverLanesForSide(view.side, server);
              const isOwnCorpHq = view.side === "corp" && server.id === "hq";
              const isOpponentCorpHq = view.side === "runner" && server.id === "hq";
              const isCorpHqComposite = isOwnCorpHq || isOpponentCorpHq;
              const opponentCorpHqCount = isOpponentCorpHq ? Math.max(0, Math.floor(view.opponent.handCount)) : 0;
              const opponentCorpHqPreviewCount = Math.min(opponentCorpHqCount, CORP_OPPONENT_HQ_PREVIEW_LIMIT);
              const opponentCorpHqPreviewCards = Array.from({ length: opponentCorpHqPreviewCount }, (_, index): DisplayVisibleCard => ({
                instanceId: `corp-opponent-hq-hidden-${index}`,
                known: false,
                rezzed: false,
                owner: "corp"
              }));
              const serverCollapsed = boardZoneCollapsedFor(`corp:${server.id}`);
              const renderLaneCards = (lane: { kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }) => {
                if (server.id === "archives" && lane.kind === "root") {
                  return (
                    <ArchivesDualStackLane
                      viewerSide={view.side}
                      visibleCards={lane.cards}
                      totalArchivesCount={view.side === "runner" ? (view.opponent.discardCount ?? lane.cards.length) : lane.cards.length}
                      emptyLabel={lane.label}
                      collapsed={false}
                      displayMode={cardDisplayMode}
                      selectedContext={selectedActionContext}
                      actionDisabled={actionDisabled}
                      cardActionsFor={cardActionsFor}
                      onAction={onAction}
                      onFocus={onFocus}
                      onActionContextSelect={onActionContextSelect}
                      enrichCard={enrichCard}
                    />
                  );
                }
                if (lane.cards.length === 0) {
                  return (
                    <span className="laneEmptyPlaceholder" aria-label={`${lane.label} leer`}>
                      {lane.label}
                    </span>
                  );
                }
                return lane.cards.map((card, index) => {
                  const displayCard = enrichCard(card);
                  return (
                    <CardView
                      key={card.instanceId}
                      card={displayCard}
                      compact
                      displayMode={cardDisplayMode}
                      hiddenSide="corp"
                      installedCorpCard={showInstalledCorpState(server.id, lane.kind)}
                      selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                      actions={cardActionsFor(card)}
                      actionDisabled={actionDisabled}
                      {...(lane.kind === "ice" ? { slotClassName: iceStackSlotClass(card) } : {})}
                      {...(lane.kind === "ice" ? { positionBadge: String(index + 1) } : {})}
                      {...(lane.kind === "ice" ? { modifierBadges: iceModifierBadgesForServer(server) } : {})}
                      scoreStateBadges={scoreCardStateBadges(displayCard, scoreAreaCardsBySide("corp"))}
                      runPositionActive={lane.kind === "ice" && activeRunIceId === card.instanceId}
                      {...(lane.kind === "ice" && activeRunIceId === card.instanceId
                        ? { runPositionLabel: runPositionStatusLabel(view) ?? "Aktuelles ICE" }
                        : {})}
                      viewMarkerActive={(lane.kind === "ice" && viewedApproachIceId === card.instanceId) || viewedInstalledExposeCardId === card.instanceId}
                      {...fieldChoiceCardProps(card)}
                      onAction={onAction}
                      onFocus={onFocus}
                      onActionContextSelect={onActionContextSelect}
                    />
                  );
                });
              };
              return (
                <article
                  className={`server ${isCorpHqComposite ? "corpHqServer" : ""} ${serverCollapsed ? "serverCollapsed" : ""} ${serverHighlighted(activeHighlight, server.id) ? "cueHighlight" : ""} ${activeRunTargetIds.includes(server.id) ? "activeRunTarget" : ""} ${selectedActionContext?.kind === "server" && selectedActionContext.id === server.id ? "selectedActionSource" : ""}`}
                  key={server.id}
                  data-testid="server"
                  data-server-id={server.id}
                >
                  <div className="serverLayout">
                    <div className="serverLead">
                      <div className="serverLeadTop">
                        <button
                          className={`serverContextButton serverContextSideButton rigGroupSideLabel ${zoneSideClass("corp")}`}
                          type="button"
                          onClick={() => onSelectActionContext({ kind: "server", id: server.id, label: serverDisplayLabel(server.id) })}
                        >
                          {serverDisplayLabel(server.id)}
                        </button>
                        {countLabel !== null ? <span className={`serverCount serverCountSideLabel ${zoneSideClass("corp")}`}>{countLabel}</span> : null}
                      </div>
                      {runAction ? (
                        <button
                          className="serverRunButton serverRunButtonSide serverRunButtonCorner"
                          type="button"
                          onClick={() => onAction(runAction)}
                          disabled={actionDisabled}
                          aria-label={`${actionButtonLabel(runAction)} starten`}
                          data-tooltip={actionButtonLabel(runAction)}
                          data-testid="server-run-action"
                          data-server-id={server.id}
                        >
                          <span className="serverRunGlyph" aria-hidden="true">
                            <RunIcon size={14} />
                          </span>
                          <span className="serverRunActionIcon" aria-hidden="true">
                            <span className="costActionIcon" />
                          </span>
                        </button>
                      ) : null}
                      <div className="serverLeadBottom">
                        <ZoneIdentityIcon side="corp" kind={serverZoneIdentityIconKind(server.id)} label={serverDisplayLabel(server.id)} />
                        <ZoneCollapseButton
                          side="corp"
                          label={serverDisplayLabel(server.id)}
                          collapsed={serverCollapsed}
                          onToggle={() => toggleBoardZoneCollapsed(`corp:${server.id}`)}
                        />
                      </div>
                    </div>
                    {!serverCollapsed ? (
                      <div className="serverBody">
                        <ServerCounterStrip displays={server.counterDisplays} serverLabel={serverDisplayLabel(server.id)} />
                        <div className={isCorpHqComposite ? "corpHqComposite" : "pairedServerLanes"}>
                          {isOwnCorpHq ? (
                            <>
                              <div className={`corpHqHandPanel ${zoneHighlighted(activeHighlight, view.side, "hq") ? "cueHighlightSoft" : ""}`}>
                                <HandCardsRow className="corpHqHandCards" style={handCardsStyle} count={view.own.gripOrHq.length}>
                                  {view.own.gripOrHq.map((card) => {
                                    const displayCard = enrichCard(card);
                                    const discardOption = discardOptionForCard(card);
                                    return (
                                      <CardView
                                        key={card.instanceId}
                                        card={displayCard}
                                        displayMode={cardDisplayMode}
                                        hiddenSide={view.side}
                                        selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                                        actions={cardActionsFor(card)}
                                        actionDisabled={actionDisabled}
                                        scoreStateBadges={scoreCardStateBadges(displayCard, scoreAreaCardsBySide("corp"))}
                                        {...(discardOption
                                          ? {
                                              discardShortcut: {
                                                selected: selectedDiscardOptionIdSet.has(discardOption.id),
                                                disabled: actionDisabled,
                                                onToggle: () => toggleDiscardOption(discardOption.id)
                                              }
                                            }
                                          : {})}
                                        onAction={onAction}
                                        onFocus={onFocus}
                                        onActionContextSelect={onActionContextSelect}
                                      />
                                    );
                                  })}
                                </HandCardsRow>
                              </div>
                              <ServerLanes lanes={lanes} laneClassName={laneClassName} boardLaneStyle={boardLaneStyle} renderLaneCards={renderLaneCards} wrapForCorpHq />
                            </>
                          ) : isOpponentCorpHq ? (
                            <>
                              <div className={`corpHqHandPanel corpOpponentHqHandPanel ${zoneHighlighted(activeHighlight, view.side, "hq") ? "cueHighlightSoft" : ""}`}>
                                {opponentCorpHqPreviewCards.length > 0 ? (
                                  <div
                                    className="corpOpponentHqPreview"
                                    style={{
                                      ...zoneCardsStyle,
                                      "--corp-hq-visible-steps": String(Math.max(0, opponentCorpHqPreviewCards.length - 1))
                                    } as CSSProperties}
                                    aria-label={`Korp-HQ: ${formatHandLimitCount(view.opponent.handCount, view.opponent.maxHandSize)}, verdeckte Karten`}
                                  >
                                    {opponentCorpHqPreviewCards.map((card) => (
                                      <CardView key={card.instanceId} card={card} compact displayMode={cardDisplayMode} hiddenSide="corp" onFocus={onFocus} />
                                    ))}
                                    {opponentCorpHqCount > CORP_OPPONENT_HQ_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{opponentCorpHqCount - CORP_OPPONENT_HQ_PREVIEW_LIMIT}</span> : null}
                                  </div>
                                ) : (
                                  <p className="archivesPileEmpty">Keine Karten in HQ.</p>
                                )}
                              </div>
                              <ServerLanes lanes={lanes} laneClassName={laneClassName} boardLaneStyle={boardLaneStyle} renderLaneCards={renderLaneCards} wrapForCorpHq />
                            </>
                          ) : (
                            <ServerLanes lanes={lanes} laneClassName={laneClassName} boardLaneStyle={boardLaneStyle} renderLaneCards={renderLaneCards} />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null
      )}
    </div>
  );
}

function ServerLanes({
  lanes,
  laneClassName,
  boardLaneStyle,
  renderLaneCards,
  wrapForCorpHq = false
}: {
  lanes: Array<{ kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }>;
  laneClassName(lane: { kind: "ice" | "root"; cards: VisibleCard[] }): string;
  boardLaneStyle: CSSProperties;
  renderLaneCards(lane: { kind: "ice" | "root"; label: "ICE" | "Root"; cards: VisibleCard[] }): ReactNode;
  wrapForCorpHq?: boolean;
}) {
  const laneGroups = (
    <>
      {lanes.map((lane) => (
        <div className="serverLaneGroup pairedServerLane" key={lane.label}>
          <div className={laneClassName(lane)} style={boardLaneStyle}>
            {renderLaneCards(lane)}
          </div>
        </div>
      ))}
    </>
  );

  if (!wrapForCorpHq) return laneGroups;

  return (
    <div className="pairedServerLanes corpHqServerLanes">
      {laneGroups}
    </div>
  );
}
