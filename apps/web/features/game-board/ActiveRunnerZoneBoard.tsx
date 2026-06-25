"use client";

import type { CSSProperties } from "react";
import type { LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";

import type { BoardHighlight } from "../../app/action-cues";
import type { ActionContext } from "../../app/action-board-ui";
import { CardView } from "../cards/CardView";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";
import type { FieldChoiceCardProps } from "./RunnerBoardStrips";
import { HandCardsRow, SideZoneFrame, zoneSideClass } from "./ZoneFrame";
import { formatCardCount, formatHandLimitCount, zoneHighlighted } from "./board-view-helpers";

type RigGroup = {
  key: string;
  label: string;
  cards: VisibleCard[];
};

type DiscardOption = {
  id: string;
};

export function ActiveRunnerZoneBoard({
  view,
  actionDisabled,
  activeHighlight,
  selectedActionContext,
  selectedDiscardOptionIdSet,
  ownRigGroups,
  ownRigCardsStyle,
  handCardsStyle,
  zoneCardsStyle,
  cardDisplayMode,
  boardZoneCollapsedFor,
  toggleBoardZoneCollapsed,
  cardActionsFor,
  enrichCard,
  discardOptionForCard,
  toggleDiscardOption,
  fieldChoiceCardProps,
  onAction,
  onFocus,
  onActionContextSelect
}: {
  view: PlayerView;
  actionDisabled: boolean;
  activeHighlight: BoardHighlight | null;
  selectedActionContext: ActionContext | null;
  selectedDiscardOptionIdSet: ReadonlySet<string>;
  ownRigGroups: RigGroup[];
  ownRigCardsStyle: CSSProperties;
  handCardsStyle: CSSProperties;
  zoneCardsStyle: CSSProperties;
  cardDisplayMode: CardDisplayMode;
  boardZoneCollapsedFor(key: string): boolean;
  toggleBoardZoneCollapsed(key: string): void;
  cardActionsFor(card: VisibleCard): LegalAction[];
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  discardOptionForCard(card: VisibleCard): DiscardOption | null;
  toggleDiscardOption(optionId: string): void;
  fieldChoiceCardProps(card: VisibleCard): FieldChoiceCardProps;
  onAction(action: LegalAction): void;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect(card: DisplayVisibleCard, hiddenSide?: Side): void;
}) {
  if (view.side !== "runner") return null;

  return (
    <div className="runnerGripHeapLayout">
      <SideZoneFrame
        side="runner"
        label="Grip"
        countLabel={formatHandLimitCount(view.own.gripOrHq.length, view.own.maxHandSize)}
        iconKind="grip"
        highlighted={zoneHighlighted(activeHighlight, view.side, "grip")}
        className="runnerGripZone"
        style={zoneCardsStyle}
        collapsed={boardZoneCollapsedFor("runner:grip")}
        onToggleCollapse={() => toggleBoardZoneCollapsed("runner:grip")}
      >
        <HandCardsRow style={handCardsStyle} count={view.own.gripOrHq.length}>
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
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label="Stack"
        countLabel={formatCardCount(view.own.stackOrRdCount)}
        iconKind="stack"
        highlighted={zoneHighlighted(activeHighlight, view.side, "stack")}
        className="runnerStackZone"
        style={zoneCardsStyle}
        collapsed={boardZoneCollapsedFor("runner:stack")}
        onToggleCollapse={() => toggleBoardZoneCollapsed("runner:stack")}
      >
        <div className="runnerStackPreview" style={zoneCardsStyle} aria-label={`Stack ${formatCardCount(view.own.stackOrRdCount)}`}>
          {view.own.stackOrRdCount > 0 ? (
            <div className="runnerStackBack" aria-hidden="true">
              <span />
            </div>
          ) : (
            <p className="archivesPileEmpty">Keine Karten im Stack.</p>
          )}
        </div>
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label="Heap"
        countLabel={formatCardCount(view.own.heapOrArchives.length)}
        iconKind="heap"
        highlighted={zoneHighlighted(activeHighlight, view.side, "heap")}
        className="runnerHeapZone"
        style={zoneCardsStyle}
        collapsed={boardZoneCollapsedFor("runner:heap")}
        onToggleCollapse={() => toggleBoardZoneCollapsed("runner:heap")}
        collapseLabel="Heap"
      >
        {view.own.heapOrArchives.length > 0 ? (
          <div
            className="runnerHeapOverlapRow"
            style={{
              ...zoneCardsStyle,
              "--zone-stack-visible-steps": String(Math.max(0, view.own.heapOrArchives.length - 1))
            } as CSSProperties}
          >
            {view.own.heapOrArchives.map((card) => {
              const displayCard = enrichCard(card);
              return (
                <CardView
                  key={card.instanceId}
                  card={displayCard}
                  compact
                  displayMode={cardDisplayMode}
                  inactiveZone="heap"
                  selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                  actions={cardActionsFor(card)}
                  actionDisabled={actionDisabled}
                  onAction={onAction}
                  onFocus={onFocus}
                  onActionContextSelect={onActionContextSelect}
                />
              );
            })}
          </div>
        ) : (
          <p className="archivesPileEmpty" style={zoneCardsStyle}>Keine Karten im Heap.</p>
        )}
      </SideZoneFrame>
      {view.own.rig ? (
        <SideZoneFrame
          side="runner"
          label="Rig"
          countLabel={formatCardCount(view.own.rig.length)}
          iconKind="rig"
          highlighted={zoneHighlighted(activeHighlight, view.side, "rig")}
          className="runnerRigZone"
          style={zoneCardsStyle}
          collapsed={boardZoneCollapsedFor("runner:rig")}
          onToggleCollapse={() => toggleBoardZoneCollapsed("runner:rig")}
          collapseLabel="Rig"
        >
          {ownRigGroups.length > 0 ? (
            <div className="rigGroups rigGroupsHorizontal rigGroupsTrack runnerRigZoneGroups">
              {ownRigGroups.map((group) => (
                <div className="rigGroup rigGroupHorizontal" key={group.key} style={ownRigCardsStyle}>
                  <div className="rigGroupLead">
                    <h3 className={`rigGroupSideLabel ${zoneSideClass("runner")}`}>{group.label}</h3>
                    {group.key === "program" ? (
                      <span className="zoneLimitBadge rigMemoryBadge" aria-label={`MU ${view.own.memoryUsed ?? 0} von ${view.own.memoryLimit ?? 0}`}>
                        MU <strong>{view.own.memoryUsed ?? 0}/{view.own.memoryLimit ?? 0}</strong>
                      </span>
                    ) : null}
                  </div>
                  <div className="cards rigGroupCards rigGroupCardsFull">
                    {group.cards.length > 0 ? (
                      group.cards.map((card) => {
                        const displayCard = enrichCard(card);
                        return (
                          <CardView
                            key={card.instanceId}
                            card={displayCard}
                            displayMode={cardDisplayMode}
                            selected={selectedActionContext?.kind === "card" && selectedActionContext.id === card.instanceId}
                            actions={cardActionsFor(card)}
                            actionDisabled={actionDisabled}
                            {...fieldChoiceCardProps(card)}
                            onAction={onAction}
                            onFocus={onFocus}
                            onActionContextSelect={onActionContextSelect}
                          />
                        );
                      })
                    ) : (
                      <span className="rigProgramEmptyPlaceholder" aria-hidden="true" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="archivesPileEmpty" style={zoneCardsStyle}>Keine Karten im Rig.</p>
          )}
        </SideZoneFrame>
      ) : null}
    </div>
  );
}
