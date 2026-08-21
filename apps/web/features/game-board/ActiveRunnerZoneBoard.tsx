"use client";

import type { CSSProperties } from "react";
import type {
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
  VisibleRunnerPaymentSupportAbility,
} from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import type { BoardHighlight } from "../../app/action-cues";
import {
  runnerHostedCardsForHost,
  runnerRigCardInstanceMarker,
  type ActionContext,
} from "../../app/action-board-ui";
import { CardView } from "../cards/CardView";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";
import type { FieldChoiceCardProps } from "./RunnerBoardStrips";
import { RunnerHostedCardCluster } from "./RunnerHostedCardCluster";
import { HandCardsRow, SideZoneFrame, zoneSideClass } from "./ZoneFrame";
import { zoneHighlighted } from "./board-view-helpers";
import {
  hiddenResourcePaymentPreselectionEquals,
  type HiddenResourcePaymentPreselection,
} from "../../app/hidden-resource-payment-preselection";

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
  paymentSupportPreselection,
  onAction,
  onFocus,
  onActionContextSelect,
  onTogglePaymentSupportAbility,
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
  paymentSupportPreselection: HiddenResourcePaymentPreselection | null;
  onAction(action: LegalAction): void;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onTogglePaymentSupportAbility(
    card: VisibleCard,
    ability: VisibleRunnerPaymentSupportAbility,
  ): void;
}) {
  const t = useTranslations("Board.runnerZones");
  if (view.side !== "runner") return null;
  const runnerRig = view.own.rig ?? [];

  return (
    <div className="runnerGripHeapLayout">
      <SideZoneFrame
        side="runner"
        label={t("grip")}
        countLabel={t("handCount", {count: view.own.gripOrHq.length, limit: view.own.maxHandSize})}
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
                selected={
                  selectedActionContext?.kind === "card" &&
                  selectedActionContext.id === card.instanceId
                }
                actions={cardActionsFor(card)}
                actionDisabled={actionDisabled}
                {...(discardOption
                  ? {
                      discardShortcut: {
                        selected: selectedDiscardOptionIdSet.has(
                          discardOption.id,
                        ),
                        disabled: actionDisabled,
                        onToggle: () => toggleDiscardOption(discardOption.id),
                      },
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
        label={t("stack")}
        countLabel={t("cardCount", {count: view.own.stackOrRdCount})}
        iconKind="stack"
        highlighted={zoneHighlighted(activeHighlight, view.side, "stack")}
        className="runnerStackZone"
        style={zoneCardsStyle}
        collapsed={boardZoneCollapsedFor("runner:stack")}
        onToggleCollapse={() => toggleBoardZoneCollapsed("runner:stack")}
      >
        <div
          className="runnerStackPreview"
          style={zoneCardsStyle}
          aria-label={t("stackAria", {count: t("cardCount", {count: view.own.stackOrRdCount})})}
        >
          {view.own.stackOrRdCount > 0 ? (
            <div className="runnerStackBack" aria-hidden="true">
              <span />
            </div>
          ) : (
            <p className="archivesPileEmpty">{t("emptyStack")}</p>
          )}
        </div>
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label={t("heap")}
        countLabel={t("cardCount", {count: view.own.heapOrArchives.length})}
        iconKind="heap"
        highlighted={zoneHighlighted(activeHighlight, view.side, "heap")}
        className="runnerHeapZone"
        style={zoneCardsStyle}
        collapsed={boardZoneCollapsedFor("runner:heap")}
        onToggleCollapse={() => toggleBoardZoneCollapsed("runner:heap")}
        collapseLabel={t("heap")}
      >
        {view.own.heapOrArchives.length > 0 ? (
          <div
            className="runnerHeapOverlapRow"
            style={
              {
                ...zoneCardsStyle,
                "--zone-stack-visible-steps": String(
                  Math.max(0, view.own.heapOrArchives.length - 1),
                ),
              } as CSSProperties
            }
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
                  selected={
                    selectedActionContext?.kind === "card" &&
                    selectedActionContext.id === card.instanceId
                  }
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
          <p className="archivesPileEmpty" style={zoneCardsStyle}>
            {t("emptyHeap")}
          </p>
        )}
      </SideZoneFrame>
      {view.own.rig ? (
        <SideZoneFrame
          side="runner"
          label={t("rig")}
          countLabel={t("cardCount", {count: view.own.rig.length})}
          iconKind="rig"
          highlighted={zoneHighlighted(activeHighlight, view.side, "rig")}
          className="runnerRigZone"
          style={zoneCardsStyle}
          collapsed={boardZoneCollapsedFor("runner:rig")}
          onToggleCollapse={() => toggleBoardZoneCollapsed("runner:rig")}
          collapseLabel={t("rig")}
        >
          {ownRigGroups.length > 0 ? (
            <div className="rigGroups rigGroupsHorizontal rigGroupsTrack runnerRigZoneGroups">
              {ownRigGroups.map((group) => (
                <div
                  className="rigGroup rigGroupHorizontal"
                  key={group.key}
                  style={ownRigCardsStyle}
                >
                  <div className="rigGroupLead">
                    <h3
                      className={`rigGroupSideLabel ${zoneSideClass("runner")}`}
                    >
                      {group.label}
                    </h3>
                    {group.key === "program" ? (
                      <span
                        className="zoneLimitBadge rigMemoryBadge"
                        aria-label={t("memoryAria", {used: view.own.memoryUsed ?? 0, limit: view.own.memoryLimit ?? 0})}
                      >
                        MU{" "}
                        <strong>
                          {view.own.memoryUsed ?? 0}/{view.own.memoryLimit ?? 0}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                  <div className="cards rigGroupCards rigGroupCardsFull">
                    {group.cards.length > 0 ? (
                      group.cards.map((card) => {
                        return (
                          <RunnerHostedCardCluster
                            key={card.instanceId}
                            hostCard={card}
                            hostedCards={runnerHostedCardsForHost(
                              runnerRig,
                              card.instanceId,
                            )}
                            renderCard={(rigCard) => {
                              const displayCard = enrichCard(rigCard);
                              return (
                                <CardView
                                  card={displayCard}
                                  displayMode={cardDisplayMode}
                                  instanceMarker={runnerRigCardInstanceMarker(
                                    runnerRig,
                                    rigCard.instanceId,
                                  )}
                                  selected={
                                    selectedActionContext?.kind === "card" &&
                                    selectedActionContext.id ===
                                      rigCard.instanceId
                                  }
                                  actions={cardActionsFor(rigCard)}
                                  actionDisabled={actionDisabled}
                                  paymentSupportShortcuts={(
                                    rigCard.runnerPaymentSupportAbilities ?? []
                                  ).map((ability) => ({
                                    identityKey: ability.sourceAbilityId,
                                    selected:
                                      hiddenResourcePaymentPreselectionEquals(
                                        paymentSupportPreselection,
                                        rigCard.instanceId,
                                        ability,
                                      ),
                                    disabled: actionDisabled,
                                    label: t("reservePayment", {ability: ability.label}),
                                    selectedLabel: t("removePaymentReservation", {ability: ability.label}),
                                    gainCredits: ability.gainCredits,
                                    onToggle: () =>
                                      onTogglePaymentSupportAbility(
                                        rigCard,
                                        ability,
                                      ),
                                  }))}
                                  {...fieldChoiceCardProps(rigCard)}
                                  onAction={onAction}
                                  onFocus={onFocus}
                                  onActionContextSelect={onActionContextSelect}
                                />
                              );
                            }}
                          />
                        );
                      })
                    ) : (
                      <span
                        className="rigProgramEmptyPlaceholder"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="archivesPileEmpty" style={zoneCardsStyle}>
              {t("emptyRig")}
            </p>
          )}
        </SideZoneFrame>
      ) : null}
    </div>
  );
}
