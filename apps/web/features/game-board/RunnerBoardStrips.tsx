"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import { type BoardHighlight } from "../../app/action-cues";
import {
  actionMatchesContext,
  groupRunnerRigCards,
  opponentRunnerRigCardActions,
  runAwareActionButtonLabel,
  runnerHostedCardsForHost,
  runnerRigCardInstanceMarker,
  runnerRigMemorySummary,
  type ActionContext,
} from "../../app/action-board-ui";
import {
  enrichVisibleCard,
  type DisplayVisibleCard,
} from "../cards/card-view-model";
import { useCardScaleSettings } from "../cards/card-display-settings";
import { useCatalogCardPresentations } from "../catalog/catalog-card-presentations";
import { CARD_SCALE_PERCENT_MIN, type CardDisplayMode } from "../settings/settings-model";
import { CardView } from "../cards/CardView";
import { RunnerHostedCardCluster } from "./RunnerHostedCardCluster";
import { SideZoneFrame, zoneSideClass } from "./ZoneFrame";

const RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT = 18;
const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

type CardDetailsById = Parameters<typeof enrichVisibleCard>[1];

type CardChoiceShortcut = {
  selected: boolean;
  disabled: boolean;
  onToggle(): void;
  label: string;
  selectedLabel: string;
  icon?: "add" | "eye";
};

export type FieldChoiceCardProps = {
  choiceSelected?: boolean;
  choiceShortcut?: CardChoiceShortcut;
  onSelect?: (card: DisplayVisibleCard, hiddenSide?: Side) => void;
};

export function RunnerOpponentZonesStrip({
  view,
  cardDetailsById,
  displayMode,
  selectedContext,
  contextualActions,
  actionDisabled,
  highlightedZone,
  onFocus,
  onActionContext,
  onAction
}: {
  view: PlayerView;
  cardDetailsById: CardDetailsById;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  contextualActions: LegalAction[];
  actionDisabled: boolean;
  highlightedZone: BoardHighlight | null;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContext(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction(action: LegalAction): void;
}) {
  const t = useTranslations("Board.runnerZones");
  const { zonePercent } = useCardScaleSettings();
  const zoneCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, zonePercent / 100);
  const zoneCardsStyle = useMemo(() => ({ "--zone-card-scale": String(zoneCardScale) } as CSSProperties), [zoneCardScale]);
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});
  const zoneCollapsed = (zone: "grip" | "heap" | "stack") => (zone === "grip" ? collapsedZones[zone] ?? true : Boolean(collapsedZones[zone]));
  const toggleZoneCollapsed = (zone: "grip" | "heap" | "stack") => setCollapsedZones((current) => ({ ...current, [zone]: !current[zone] }));
  if (view.side !== "corp") return null;
  const heapCards = view.opponent.discardCards ?? [];
  const heapCount = view.opponent.discardCount ?? heapCards.length;
  const gripCount = Math.max(0, Math.floor(view.opponent.handCount));
  const gripCountLabel = t("handCount", {count: view.opponent.handCount, limit: view.opponent.maxHandSize});
  const stackCountLabel = t("cardCount", {count: view.opponent.deckCount});
  const heapCountLabel = t("cardCount", {count: heapCount});
  const gripPreviewCount = Math.min(gripCount, RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT);
  const gripPreviewCards = Array.from({ length: gripPreviewCount }, (_, index): DisplayVisibleCard => ({
    instanceId: `runner-opponent-grip-hidden-${index}`,
    known: false,
    rezzed: false,
    owner: "runner"
  }));
  const cardActionsForHeap = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? t("card") }));
  };

  return (
    <section className="runnerOpponentZonesStrip" aria-label={t("runnerZones")} data-testid="runner-opponent-zones">
      <SideZoneFrame
        side="runner"
        label={t("grip")}
        countLabel={gripCountLabel}
        iconKind="grip"
        highlighted={zoneHighlighted(highlightedZone, "runner", "grip")}
        className="runnerOpponentZone runnerOpponentCountZone runnerOpponentGripZone"
        style={zoneCardsStyle}
        title={t("gripOpponentHelp")}
        ariaLabel={t("runnerGripAria", {count: gripCountLabel})}
        collapsed={zoneCollapsed("grip")}
        onToggleCollapse={() => toggleZoneCollapsed("grip")}
        collapseLabel={t("grip")}
      >
        {gripPreviewCards.length > 0 ? (
          <div
            className="runnerOpponentGripPreview"
            style={{
              ...zoneCardsStyle,
              "--runner-grip-visible-steps": String(Math.max(0, gripPreviewCards.length - 1))
            } as CSSProperties}
            aria-label={t("hiddenGripAria", {count: gripCountLabel})}
          >
            {gripPreviewCards.map((card) => (
              <CardView key={card.instanceId} card={card} compact displayMode={displayMode} hiddenSide="runner" onFocus={onFocus} />
            ))}
            {gripCount > RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{gripCount - RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT}</span> : null}
          </div>
        ) : (
          <p className="archivesPileEmpty">{t("emptyGrip")}</p>
        )}
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label={t("stack")}
        countLabel={stackCountLabel}
        iconKind="stack"
        highlighted={zoneHighlighted(highlightedZone, "runner", "stack")}
        className="runnerOpponentZone runnerOpponentCountZone runnerOpponentStackZone"
        style={zoneCardsStyle}
        title={t("stackOpponentHelp")}
        ariaLabel={t("runnerStackAria", {count: stackCountLabel})}
        collapsed
      />
      <SideZoneFrame
        side="runner"
        label={t("heap")}
        countLabel={heapCountLabel}
        iconKind="heap"
        highlighted={zoneHighlighted(highlightedZone, "runner", "heap")}
        className="runnerOpponentZone runnerOpponentHeapCompact"
        style={zoneCardsStyle}
        title={t("heapHelp")}
        ariaLabel={t("runnerHeapAria", {count: heapCountLabel})}
        collapsed={zoneCollapsed("heap")}
        onToggleCollapse={() => toggleZoneCollapsed("heap")}
        collapseLabel={t("heap")}
      >
        {heapCards.length > 0 ? (
          <div
            className="runnerHeapCompactPreview runnerHeapOverlapRow"
            style={{
              ...zoneCardsStyle,
              "--zone-stack-visible-steps": String(Math.max(0, heapCards.length - 1))
            } as CSSProperties}
          >
            {heapCards.map((card) => {
              const displayCard = enrichVisibleCard(card, cardDetailsById);
              return (
                <CardView
                  key={card.instanceId}
                  card={displayCard}
                  compact
                  displayMode={displayMode}
                  inactiveZone="heap"
                  selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                  actions={cardActionsForHeap(card)}
                  actionDisabled={actionDisabled}
                  onAction={onAction}
                  onFocus={onFocus}
                  onActionContextSelect={onActionContext}
                />
              );
            })}
          </div>
        ) : (
          <p className="archivesPileEmpty">{t("emptyHeap")}</p>
        )}
      </SideZoneFrame>
    </section>
  );
}

export function RunnerRigStrip({
  view,
  cardDetailsById,
  displayMode,
  selectedContext,
  contextualActions,
  actionDisabled,
  highlightedZone,
  fieldChoiceCardProps,
  onFocus,
  onActionContext,
  onAction
}: {
  view: PlayerView;
  cardDetailsById: CardDetailsById;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  contextualActions: LegalAction[];
  actionDisabled: boolean;
  highlightedZone?: BoardHighlight | null;
  fieldChoiceCardProps?: (card: VisibleCard) => FieldChoiceCardProps;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContext(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction(action: LegalAction): void;
}) {
  const t = useTranslations("Board.runnerZones");
  const cardPresentationsById = useCatalogCardPresentations();
  const { zonePercent } = useCardScaleSettings();
  const zoneCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, zonePercent / 100);
  const opponentRigStyle = useMemo(
    () =>
      ({
        "--zone-card-scale": String(zoneCardScale),
        "--mini-cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * zoneCardScale)}px`
      } as CSSProperties),
    [zoneCardScale]
  );
  const [rigCollapsed, setRigCollapsed] = useState(false);
  if (opponentSide(view.side) !== "runner") return null;
  const runnerRig = view.opponent.rig ?? [];
  const memorySummary = runnerRigMemorySummary(view, "opponent");
  const groups = groupRunnerRigCards(runnerRig, { includeEmptyProgramGroup: Boolean(memorySummary) });
  const cardActionsForRig = (card: VisibleCard): LegalAction[] =>
    opponentRunnerRigCardActions(card, contextualActions);
  return (
    <SideZoneFrame
      side="runner"
      label={t("rig")}
      countLabel={t("cardCount", {count: runnerRig.length})}
      iconKind="rig"
      highlighted={zoneHighlighted(highlightedZone ?? null, "runner", "rig")}
      className="runnerOpponentZone runnerOpponentRigZone runnerRigZone"
      style={opponentRigStyle}
      title={t("rigHelp")}
      ariaLabel={t("runnerRigAria", {count: t("cardCount", {count: runnerRig.length})})}
      testId="runner-rig"
      collapsed={rigCollapsed}
      onToggleCollapse={() => setRigCollapsed((current) => !current)}
      collapseLabel={t("rig")}
    >
      {groups.length > 0 ? (
        <div className="rigGroups rigGroupsHorizontal rigGroupsTrack runnerRigZoneGroups">
          {groups.map((group) => (
            <div
              className="rigGroup rigGroupHorizontal"
              key={group.key}
              style={opponentRigStyle}
            >
              <div className="rigGroupLead">
                <h3 className={`rigGroupSideLabel ${zoneSideClass("runner")}`}>{group.label}</h3>
                {group.key === "program" && memorySummary ? (
                  <span className="zoneLimitBadge rigMemoryBadge" aria-label={memorySummary.ariaLabel}>
                    MU <strong>{memorySummary.text}</strong>
                  </span>
                ) : null}
              </div>
              <div className="cards rigGroupCards rigGroupCardsMini">
                {group.cards.length > 0 ? (
                  group.cards.map((card) => {
                    return (
                      <RunnerHostedCardCluster
                        key={card.instanceId}
                        hostCard={card}
                        hostedCards={runnerHostedCardsForHost(runnerRig, card.instanceId)}
                        renderCard={(rigCard) => {
                          const displayCard = enrichVisibleCard(rigCard, cardDetailsById);
                          return (
                            <CardView
                              card={displayCard}
                              compact
                              displayMode={displayMode}
                              instanceMarker={runnerRigCardInstanceMarker(runnerRig, rigCard.instanceId)}
                              {...(rigCard.known ? {} : { hiddenSide: "runner" as const })}
                              selected={selectedContext?.kind === "card" && selectedContext.id === rigCard.instanceId}
                              actions={cardActionsForRig(rigCard)}
                              actionDisabled={actionDisabled}
                              actionLabelForAction={(action) => runAwareActionButtonLabel(view, action, cardPresentationsById)}
                              {...fieldChoiceCardProps?.(rigCard)}
                              onFocus={onFocus}
                              onActionContextSelect={onActionContext}
                              onAction={onAction}
                            />
                          );
                        }}
                      />
                    );
                  })
                ) : (
                  <span className="rigProgramEmptyPlaceholder compact" aria-hidden="true" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="archivesPileEmpty" style={opponentRigStyle}>{t("emptyRig")}</p>
      )}
    </SideZoneFrame>
  );
}

function zoneHighlighted(highlight: BoardHighlight | null, side: Side, zone: "grip" | "stack" | "heap" | "rig"): boolean {
  return Boolean(highlight?.kind === "zone" && highlight.side === side && highlight.zone === zone);
}

function opponentSide(side: Side): Side {
  return side === "corp" ? "runner" : "corp";
}
