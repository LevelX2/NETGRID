"use client";

import type {
  ApiReplayAnalysisFrame,
  LegalAction,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import {
  actionSlotCapacityForTurn,
  groupRunnerRigCards,
} from "../../app/action-board-ui";
import { ReadOnlyTurnActionPanel } from "../actions/LegalActionsPanel";
import { CardPreviewPanel } from "../cards/CardPreviewPanel";
import {
  useCardImagePreference,
  useCardScaleSettings,
} from "../cards/card-display-settings";
import {
  enrichVisibleCard,
  type DisplayVisibleCard,
} from "../cards/card-view-model";
import { ActiveRunnerZoneBoard } from "../game-board/ActiveRunnerZoneBoard";
import { ActiveServerGrid } from "../game-board/ActiveServerGrid";
import { ActiveMatchResourceStrip } from "../game-board/ResourceStrip";
import {
  RunnerOpponentZonesStrip,
  RunnerRigStrip,
  type FieldChoiceCardProps,
} from "../game-board/RunnerBoardStrips";
import { RunTimelineOverlay } from "../game-board/RunTimelineOverlay";
import { OpponentPanel, PlayerPanel } from "../game-board/SideStatusPanels";
import { SpecialZonesStrip } from "../game-board/SpecialZonesStrip";
import { ScoredAgendaOverlay } from "../game-board/ScoredAgendaOverlay";
import { ChroniclePanel } from "../chronicle/ChroniclePanel";
import {
  CARD_SCALE_PERCENT_MIN,
  type CardDisplayMode,
  type ChronicleDetailMode,
} from "../settings/settings-model";
import type { OverlayPositionPreference } from "../../lib/overlay-position";
import type { PublicCardPresentationsById } from "../../app/public-card-presentation";

const EMPTY_CARD_DETAILS = {};
const EMPTY_ACTIONS: LegalAction[] = [];
const EMPTY_IDS = new Set<string>();
const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

export function ReplayBoard({
  frame,
  perspective,
  displayNames,
  publicEvents,
  cardPresentationsById,
  cardDisplayMode,
  chronicleDetailMode,
  onCardDisplayMode,
}: {
  frame: ApiReplayAnalysisFrame;
  perspective: Side;
  displayNames: Partial<Record<Side, string>>;
  publicEvents: PublicGameEvent[];
  cardPresentationsById: PublicCardPresentationsById;
  cardDisplayMode: CardDisplayMode;
  chronicleDetailMode: ChronicleDetailMode;
  onCardDisplayMode(value: CardDisplayMode): void;
}) {
  const baseView = frame.playerViews[perspective];
  const view = useMemo(
    () => ({ ...baseView, publicEvents }),
    [baseView, publicEvents],
  );
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>(
    {},
  );
  const [scoreAreaOpen, setScoreAreaOpen] = useState<Record<Side, boolean>>({
    runner: false,
    corp: false,
  });
  const [scoreAreaPositions, setScoreAreaPositions] = useState<
    Record<Side, OverlayPositionPreference>
  >({
    runner: { kind: "default" },
    corp: { kind: "default" },
  });
  const [focusedCard, setFocusedCard] = useState<{
    card: DisplayVisibleCard;
    hiddenSide?: Side;
  } | null>(null);
  const [cardPreviewCollapsed, setCardPreviewCollapsed] = useState(false);
  const cardScaleSettings = useCardScaleSettings();
  const { preferGermanCardImages } = useCardImagePreference();
  const handCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardScaleSettings.handPercent / 100,
  );
  const rigCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardScaleSettings.rigPercent / 100,
  );
  const zoneCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardScaleSettings.zonePercent / 100,
  );
  const boardCardScale = Math.max(
    CARD_SCALE_PERCENT_MIN / 100,
    cardScaleSettings.boardPercent / 100,
  );
  const handCardsStyle = useMemo(
    () =>
      ({
        "--cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * handCardScale)}px`,
      }) as CSSProperties,
    [handCardScale],
  );
  const ownRigCardsStyle = useMemo(
    () =>
      ({
        "--cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * rigCardScale)}px`,
      }) as CSSProperties,
    [rigCardScale],
  );
  const zoneCardsStyle = useMemo(
    () => ({ "--zone-card-scale": String(zoneCardScale) }) as CSSProperties,
    [zoneCardScale],
  );
  const boardLaneStyle = useMemo(
    () => ({ "--lane-card-scale": String(boardCardScale) }) as CSSProperties,
    [boardCardScale],
  );

  const enrichCard = (card: VisibleCard): DisplayVisibleCard =>
    enrichVisibleCard(card, EMPTY_CARD_DETAILS);
  const focusCard = (card: DisplayVisibleCard, hiddenSide?: Side) =>
    setFocusedCard({ card, ...(hiddenSide ? { hiddenSide } : {}) });
  const scoreAreaCardsBySide = (side: Side): VisibleCard[] =>
    side === view.side ? view.own.scoreArea : view.opponent.scoreArea;
  const agendaPointsBySide = (side: Side): number =>
    side === view.side ? view.own.agendaPoints : view.opponent.agendaPoints;
  const ownRigGroups = useMemo(
    () =>
      groupRunnerRigCards(view.own.rig ?? [], {
        includeEmptyProgramGroup:
          view.side === "runner" && typeof view.own.memoryLimit === "number",
      }),
    [view],
  );
  const activeRunIceId =
    view.run?.encounteredIce?.instanceId ??
    view.run?.approachedIce?.instanceId ??
    null;
  const actionCapacities = useMemo(
    () => ({
      runner: actionSlotCapacityForTurn(
        "runner",
        view.side === "runner" ? view.own.clicks : view.opponent.clicks,
        publicEvents,
      ),
      corp: actionSlotCapacityForTurn(
        "corp",
        view.side === "corp" ? view.own.clicks : view.opponent.clicks,
        publicEvents,
      ),
    }),
    [publicEvents, view],
  );

  const noAction = (_action: LegalAction) => undefined;
  const noFocusAction = (_card: DisplayVisibleCard, _hiddenSide?: Side) =>
    undefined;
  const noFieldChoice = (_card: VisibleCard): FieldChoiceCardProps => ({});

  return (
    <>
      {(["corp", "runner"] as const).map((side) => (
        <ScoredAgendaOverlay
          key={side}
          side={side}
          cards={scoreAreaCardsBySide(side)}
          agendaPoints={agendaPointsBySide(side)}
          agendaPointsToWin={view.agendaPointsToWin}
          open={scoreAreaOpen[side]}
          position={scoreAreaPositions[side]}
          cardDisplayMode={cardDisplayMode}
          enrichCard={enrichCard}
          cardActionsFor={() => EMPTY_ACTIONS}
          actionDisabled
          selectedContext={null}
          onAction={noAction}
          onFocus={focusCard}
          onActionContextSelect={noFocusAction}
          onClose={() =>
            setScoreAreaOpen((current) => ({ ...current, [side]: false }))
          }
          onPosition={(position) =>
            setScoreAreaPositions((current) => ({
              ...current,
              [side]: position,
            }))
          }
        />
      ))}

      {view.run ? (
        <RunTimelineOverlay
          view={view}
          legalActions={EMPTY_ACTIONS}
          runActions={EMPTY_ACTIONS}
          cardDetailsById={EMPTY_CARD_DETAILS}
          actionDisabled
          corpRunAutoPassActive={false}
          onAction={noAction}
          onChoiceOption={() => undefined}
          onCorpRunAutoPassEnabled={() => undefined}
        />
      ) : null}

      <ActiveMatchResourceStrip
        view={view}
        agendaPointsToWin={view.agendaPointsToWin}
        actionCapacities={actionCapacities}
        ariaHidden={false}
        topOffsetPx={58}
      />

      <div className="main" data-testid="replay-normal-game-surface">
        <aside className="column panel sidePanel">
          <OpponentPanel
            view={view}
            {...(displayNames[opponentSide(view.side)]
              ? {
                  displayName:
                    displayNames[opponentSide(view.side)] ??
                    sideLabel(opponentSide(view.side)),
                }
              : {})}
            scoreAreaCards={scoreAreaCardsBySide(opponentSide(view.side))}
            scoreAreaOpen={scoreAreaOpen[opponentSide(view.side)]}
            agendaPointsToWin={view.agendaPointsToWin}
            scoreAreaHighlighted={false}
            onToggleScoreArea={() =>
              setScoreAreaOpen((current) => ({
                ...current,
                [opponentSide(view.side)]: !current[opponentSide(view.side)],
              }))
            }
          />
          <ReadOnlyTurnActionPanel
            view={view}
            actionCapacities={actionCapacities}
          />
          <PlayerPanel
            view={view}
            title={`${displayNames[view.side] ?? sideLabel(view.side)} · ${sideLabel(view.side)}`}
            scoreAreaCards={scoreAreaCardsBySide(view.side)}
            agendaPointsToWin={view.agendaPointsToWin}
            scoreAreaOpen={scoreAreaOpen[view.side]}
            scoreAreaHighlighted={false}
            onToggleScoreArea={() =>
              setScoreAreaOpen((current) => ({
                ...current,
                [view.side]: !current[view.side],
              }))
            }
          />
          <SpecialZonesStrip
            view={view}
            cardDetailsById={EMPTY_CARD_DETAILS}
            displayMode={cardDisplayMode}
            compact
            onFocus={focusCard}
          />
        </aside>

        <section className="board boardPanel" data-testid="active-board">
          {view.side === "corp" ? (
            <section
              className="opponentRunnerBoardStrip"
              aria-label="Runner-Bereich"
            >
              <RunnerOpponentZonesStrip
                view={view}
                cardDetailsById={EMPTY_CARD_DETAILS}
                displayMode={cardDisplayMode}
                selectedContext={null}
                contextualActions={EMPTY_ACTIONS}
                actionDisabled
                highlightedZone={null}
                onFocus={focusCard}
                onActionContext={noFocusAction}
                onAction={noAction}
              />
              <RunnerRigStrip
                view={view}
                cardDetailsById={EMPTY_CARD_DETAILS}
                displayMode={cardDisplayMode}
                selectedContext={null}
                contextualActions={EMPTY_ACTIONS}
                actionDisabled
                highlightedZone={null}
                onFocus={focusCard}
                onActionContext={noFocusAction}
                onAction={noAction}
              />
            </section>
          ) : (
            <RunnerRigStrip
              view={view}
              cardDetailsById={EMPTY_CARD_DETAILS}
              displayMode={cardDisplayMode}
              selectedContext={null}
              contextualActions={EMPTY_ACTIONS}
              actionDisabled
              onFocus={focusCard}
              onActionContext={noFocusAction}
              onAction={noAction}
            />
          )}

          {view.winner ? (
            <div className="runBar">
              <Sparkles size={18} />
              <span className="winner">
                {view.winner === "runner"
                  ? "Runner"
                  : view.winner === "corp"
                    ? "Korp"
                    : "Unentschieden"}{" "}
                gewinnt.
              </span>
            </div>
          ) : null}

          <ActiveServerGrid
            view={view}
            actionDisabled
            activeHighlight={null}
            activeRunTargetIds={view.run ? [view.run.attackedServerId] : []}
            activeRunIceId={activeRunIceId}
            viewedApproachIceId={view.run?.approachedIce?.instanceId ?? null}
            viewedInstalledExposeCardId={null}
            exposedCardHighlightIds={EMPTY_IDS}
            selectedActionContext={null}
            selectedDiscardOptionIdSet={EMPTY_IDS}
            boardLaneStyle={boardLaneStyle}
            handCardsStyle={handCardsStyle}
            zoneCardsStyle={zoneCardsStyle}
            cardDisplayMode={cardDisplayMode}
            boardZoneCollapsedFor={(key) => Boolean(collapsedZones[key])}
            toggleBoardZoneCollapsed={(key) =>
              setCollapsedZones((current) => ({
                ...current,
                [key]: !current[key],
              }))
            }
            runActionForServer={() => null}
            cardActionsFor={() => EMPTY_ACTIONS}
            enrichCard={enrichCard}
            scoreAreaCardsBySide={scoreAreaCardsBySide}
            discardOptionForCard={() => null}
            toggleDiscardOption={() => undefined}
            fieldChoiceCardProps={noFieldChoice}
            onAction={noAction}
            onFocus={focusCard}
            onActionContextSelect={noFocusAction}
            onSelectActionContext={() => undefined}
          />

          <section className="section panel boardSection zoneBoardSection">
            <ActiveRunnerZoneBoard
              view={view}
              actionDisabled
              activeHighlight={null}
              selectedActionContext={null}
              selectedDiscardOptionIdSet={EMPTY_IDS}
              ownRigGroups={ownRigGroups}
              ownRigCardsStyle={ownRigCardsStyle}
              handCardsStyle={handCardsStyle}
              zoneCardsStyle={zoneCardsStyle}
              cardDisplayMode={cardDisplayMode}
              boardZoneCollapsedFor={(key) => Boolean(collapsedZones[key])}
              toggleBoardZoneCollapsed={(key) =>
                setCollapsedZones((current) => ({
                  ...current,
                  [key]: !current[key],
                }))
              }
              cardActionsFor={() => EMPTY_ACTIONS}
              enrichCard={enrichCard}
              discardOptionForCard={() => null}
              toggleDiscardOption={() => undefined}
              fieldChoiceCardProps={noFieldChoice}
              paymentSupportPreselection={null}
              onAction={noAction}
              onFocus={focusCard}
              onActionContextSelect={noFocusAction}
              onTogglePaymentSupportAbility={() => undefined}
            />
          </section>
        </section>

        <aside className="log panel rightRail">
          <CardPreviewPanel
            card={focusedCard?.card ?? null}
            displayMode={cardDisplayMode}
            onDisplayMode={onCardDisplayMode}
            {...(focusedCard?.hiddenSide
              ? { hiddenSide: focusedCard.hiddenSide }
              : {})}
            collapsed={cardPreviewCollapsed}
            onCollapsed={setCardPreviewCollapsed}
          />
          <ChroniclePanel
            events={publicEvents}
            turnContextEvents={publicEvents}
            side={view.side}
            cardDetailsById={EMPTY_CARD_DETAILS}
            cardPresentationsById={cardPresentationsById}
            displayMode={cardDisplayMode}
            detailMode={chronicleDetailMode}
            preferGermanCardImages={preferGermanCardImages}
            onFocusCard={focusCard}
          />
          <section className="section replayStatePanel">
            <h2>Replay-Stand</h2>
            <p>
              {sideLabel(view.activeSide)} am Zug · {phaseLabel(view.phase)}
            </p>
            <small>
              State {frame.stateVersion} · Hash{" "}
              {frame.stateHashVerified ? "verifiziert" : "abweichend"}
            </small>
          </section>
        </aside>
      </div>
    </>
  );
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function sideLabel(side: Side): string {
  return side === "runner" ? "Runner" : "Korp";
}

function phaseLabel(phase: string): string {
  return phase
    .replace(/_/g, " ")
    .replace(/^corp /, "Korp ")
    .replace(/^runner /, "Runner ");
}
