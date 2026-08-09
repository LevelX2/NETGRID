"use client";

import {
  Check,
  CheckCircle2,
  CircleHelp,
  FastForward,
  Hammer,
  Power,
  Route,
  Search,
  Sparkles,
  X,
  Move,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { LegalAction, PlayerView, Side } from "@netgrid/shared";

import {
  RUN_TIMELINE_STEPS,
  actionButtonTone,
  breachHighlighterAccessHint,
  breachProgressLabel,
  choiceOptionCostChips,
  currentRunTimelineStep,
  hasLegalAction,
  interactionAmbienceClassName,
  isAutomaticCorpRunPassAction,
  normalizeVisibleTerms,
  runAwareActionButtonLabel,
  runBreakerActionHint,
  runWindowInteractionAmbience,
  runWindowActionButtonLabel,
  runWindowActionInstanceDetail,
  runWindowStatusLabel,
  runPhaseOpportunityKinds,
  serverDisplayLabel,
  serverTargetIdForChoiceOption,
  splitRunWindowActionsByServer,
} from "../../app/action-board-ui";
import { enrichVisibleCard } from "../cards/card-view-model";
import { useCatalogCardPresentations } from "../catalog/catalog-card-presentations";
import { OverflowAwareActionButton } from "../actions/ActionControls";
import { RUN_OVERLAY_POSITION_STORAGE_KEY } from "../../lib/storage-keys";
import { readLocalStorage } from "../../lib/local-storage";
import {
  clampOverlayPosition,
  parseOverlayPositionPreference,
  serializeOverlayPositionPreference,
  type OverlayPositionPreference,
} from "../../lib/overlay-position";

type CardDetailsById = Parameters<typeof enrichVisibleCard>[1];

export function RunTimelineOverlay({
  view,
  legalActions,
  runActions,
  cardDetailsById,
  actionDisabled,
  highlighted = false,
  corpRunAutoPassActive,
  onAction,
  onChoiceOption,
  onCorpRunAutoPassEnabled,
}: {
  view: PlayerView;
  legalActions: LegalAction[];
  runActions: LegalAction[];
  cardDetailsById: CardDetailsById;
  actionDisabled: boolean;
  highlighted?: boolean;
  corpRunAutoPassActive: boolean;
  onAction(action: LegalAction): void;
  onChoiceOption(
    action: LegalAction,
    choiceId: string,
    selectedOptionId: string,
  ): void;
  onCorpRunAutoPassEnabled(enabled: boolean): void;
}) {
  const cardPresentationsById = useCatalogCardPresentations();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [position, setPosition] = useState<OverlayPositionPreference>(() =>
    typeof window === "undefined"
      ? { kind: "default" }
      : parseOverlayPositionPreference(
          readLocalStorage(RUN_OVERLAY_POSITION_STORAGE_KEY),
        ),
  );
  useEffect(() => {
    window.localStorage.setItem(
      RUN_OVERLAY_POSITION_STORAGE_KEY,
      serializeOverlayPositionPreference(position),
    );
  }, [position]);
  const run = view.run;
  if (!run) return null;

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragOverlay = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    setPosition(
      clampOverlayPosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height,
      ),
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const currentStep = currentRunTimelineStep(view, legalActions);
  const ambienceClass = interactionAmbienceClassName(
    runWindowInteractionAmbience(view, runActions, currentStep),
  );
  const verticalSteps = [...RUN_TIMELINE_STEPS].reverse();
  const approachedIce = run.approachedIce
    ? enrichVisibleCard(run.approachedIce, cardDetailsById)
    : null;
  const encounteredIce = run.encounteredIce
    ? enrichVisibleCard(run.encounteredIce, cardDetailsById)
    : null;
  const runFocusIce = encounteredIce ?? approachedIce;
  const runFocusIceFallback = approachedIce
    ? "Angesehenes ICE"
    : "Sichtbares ICE";
  const jackOutAvailable = hasLegalAction(legalActions, "jack_out");
  const breachProgress = breachProgressLabel(view);
  const breachHighlighterHint = breachHighlighterAccessHint(view);
  const headerStatus = runWindowStatusLabel(view);
  const breakerHint = runBreakerActionHint(view, legalActions);
  const positionStyle: CSSProperties =
    position.kind === "custom"
      ? {
          left: `${position.xPercent}%`,
          top: `${position.yPercent}%`,
          transform: "none",
        }
      : {};
  const choiceAction = view.pendingChoice
    ? runActions.find(
        (action) =>
          action.type === "resolve_choice" &&
          action.payload?.choiceId === view.pendingChoice?.choiceId,
      )
    : undefined;
  const regularRunActions = choiceAction
    ? runActions.filter((action) => action.actionId !== choiceAction.actionId)
    : runActions;
  const { currentServerActions, otherServerRezActions } =
    splitRunWindowActionsByServer(view, regularRunActions);
  const canEnableCorpRunAutoPass =
    view.side === "corp" &&
    regularRunActions.some(isAutomaticCorpRunPassAction);
  const showCorpRunAutoPassControl =
    view.side === "corp" && (corpRunAutoPassActive || canEnableCorpRunAutoPass);
  const runChoice =
    view.pendingChoice &&
    choiceAction &&
    view.pendingChoice.minSelections === 1 &&
    view.pendingChoice.maxSelections === 1
      ? view.pendingChoice
      : null;
  const runChoiceStatus = runChoice
    ? runChoiceStatusLabel(view, runChoice)
    : null;
  const phaseOpportunities = runPhaseOpportunityKinds(runActions);
  const phaseOpportunityLabel = phaseOpportunities
    .map((kind) => RUN_PHASE_OPPORTUNITY_META[kind].label)
    .join(", ");

  const overlay = (
    <div
      ref={overlayRef}
      className={`runTimelineOverlay ${position.kind === "custom" ? "custom" : ""}`}
      style={positionStyle}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`runTimeline active overlay ${ambienceClass} ${highlighted ? "cueHighlight" : ""}`}
        data-testid="run-timeline"
        role="status"
      >
        <div
          className="runTimelineHead runTimelineDragHandle"
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title="Run-Fenster verschieben"
          aria-label="Run-Fenster verschieben"
        >
          <Route size={18} />
          <span className="runTimelineTitle">
            <strong>{`Run auf ${serverDisplayLabel(run.attackedServerId)}`}</strong>
            {headerStatus ? <small>{headerStatus}</small> : null}
          </span>
          <Move size={15} aria-hidden="true" />
        </div>
        <div className="runSteps">
          {verticalSteps.map((step) => {
            const current = currentStep === step.id;
            return (
              <span className={current ? "current" : ""} key={step.id}>
                {step.label}
                {current && phaseOpportunities.length > 0 ? (
                  <small
                    className="runStepOpportunities"
                    aria-label={`Aktuell möglich: ${phaseOpportunityLabel}`}
                    data-testid="run-phase-opportunities"
                  >
                    {phaseOpportunities.map((kind) => {
                      const opportunity = RUN_PHASE_OPPORTUNITY_META[kind];
                      const Icon = opportunity.icon;
                      return (
                        <i
                          className={`runStepOpportunity ${kind}`}
                          title={opportunity.label}
                          key={kind}
                        >
                          <Icon
                            size={14}
                            strokeWidth={2.2}
                            aria-hidden="true"
                          />
                        </i>
                      );
                    })}
                  </small>
                ) : null}
              </span>
            );
          })}
        </div>
        {runChoice && choiceAction ? (
          <div
            className="runActionBar"
            aria-label={runChoice.prompt}
            data-testid="run-choice-action-bar"
          >
            {runChoiceStatus ? (
              <p className="runHint runChoiceHint">{runChoiceStatus}</p>
            ) : null}
            {runChoice.options.map((option) => {
              const displayCostChips = choiceOptionCostChips(option);
              const costLabel = displayCostChips[0]?.label;
              const accessibleLabel = costLabel
                ? `${option.label}, Kosten: ${costLabel}`
                : option.label;
              return (
                <OverflowAwareActionButton
                  action={choiceAction}
                  className="button primary actionButton runActionButton"
                  key={option.id}
                  label={accessibleLabel}
                  displayLabel={option.label}
                  displayCostChips={
                    displayCostChips.length > 0 ? displayCostChips : undefined
                  }
                  onClick={() =>
                    onChoiceOption(choiceAction, runChoice.choiceId, option.id)
                  }
                  disabled={actionDisabled || option.selectable === false}
                  type="button"
                  data-testid="run-choice-button"
                  data-action-type={choiceAction.type}
                  iconSize={14}
                  serverTargetId={serverTargetIdForChoiceOption(
                    option,
                    view.servers.map((server) => server.id),
                  )}
                />
              );
            })}
          </div>
        ) : null}
        {regularRunActions.length > 0 ? (
          <div
            className="runActionBar"
            aria-label="Run-Aktionen"
            data-testid="run-action-bar"
          >
            {currentServerActions.map((action) => {
              const compactLabel = runWindowActionButtonLabel(
                view,
                action,
                cardPresentationsById,
              );
              const baseFullLabel =
                compactLabel.startsWith("SMC:") && action.label
                  ? normalizeVisibleTerms(action.label)
                  : runAwareActionButtonLabel(
                      view,
                      action,
                      cardPresentationsById,
                    );
              const instanceDetail = runWindowActionInstanceDetail(
                view,
                action,
              );
              const fullLabel = instanceDetail
                ? `${baseFullLabel}. ${instanceDetail}`
                : baseFullLabel;
              return (
                <OverflowAwareActionButton
                  action={action}
                  className="button primary actionButton runActionButton"
                  key={action.actionId}
                  label={fullLabel}
                  displayLabel={compactLabel}
                  {...(instanceDetail ? { tooltipLabel: instanceDetail } : {})}
                  tone={actionButtonTone(view, action)}
                  onClick={() => onAction(action)}
                  disabled={actionDisabled}
                  type="button"
                  data-testid="run-action-button"
                  data-action-type={action.type}
                  iconSize={14}
                />
              );
            })}
            {otherServerRezActions.length > 0 ? (
              <div
                className="runActionDivider"
                role="separator"
                aria-label="Auf anderen Servern rezzen"
              >
                <span>Auf anderen Servern rezzen</span>
              </div>
            ) : null}
            {otherServerRezActions.map((action) => {
              const compactLabel = runWindowActionButtonLabel(
                view,
                action,
                cardPresentationsById,
              );
              return (
                <OverflowAwareActionButton
                  action={action}
                  className="button primary actionButton runActionButton"
                  key={action.actionId}
                  label={runAwareActionButtonLabel(
                    view,
                    action,
                    cardPresentationsById,
                  )}
                  displayLabel={compactLabel}
                  tone={actionButtonTone(view, action)}
                  onClick={() => onAction(action)}
                  disabled={actionDisabled}
                  type="button"
                  data-testid="run-action-button"
                  data-action-type={action.type}
                  iconSize={14}
                />
              );
            })}
          </div>
        ) : !runChoice && jackOutAvailable ? (
          <p className="runHint">
            Du kannst den Run jetzt abbrechen (Jack-out).
          </p>
        ) : null}
        {showCorpRunAutoPassControl ? (
          <div
            className={`runAutoPassControl ${corpRunAutoPassActive ? "active" : ""}`}
            data-testid="corp-run-auto-pass-control"
          >
            {corpRunAutoPassActive ? (
              <>
                <span className="runAutoPassStatus" role="status">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Auto-Pass für diesen Run aktiv
                </span>
                <button
                  className="button runAutoPassStopButton"
                  type="button"
                  onClick={() => onCorpRunAutoPassEnabled(false)}
                  disabled={actionDisabled}
                >
                  Stoppen
                </button>
              </>
            ) : (
              <button
                className="button runAutoPassButton"
                type="button"
                onClick={() => onCorpRunAutoPassEnabled(true)}
                disabled={actionDisabled || !canEnableCorpRunAutoPass}
              >
                <FastForward size={15} aria-hidden="true" />
                <span>Restlichen Run automatisch passen</span>
              </button>
            )}
          </div>
        ) : null}
        {breachProgress ? <p className="runHint">{breachProgress}</p> : null}
        {breachHighlighterHint ? (
          <p className="runHint">{breachHighlighterHint}</p>
        ) : null}
        {breakerHint ? (
          <p className="runHint runBreakerHint">{breakerHint}</p>
        ) : null}
        {runFocusIce ? (
          <div className="encounterFocus">
            {runFocusIce.known ? (
              <div className="encounterFocusBody">
                <strong>{runFocusIce.title ?? runFocusIceFallback}</strong>
                {runFocusIce.rulesText ? <p>{runFocusIce.rulesText}</p> : null}
              </div>
            ) : (
              <strong>Verdecktes ICE</strong>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}

const RUN_PHASE_OPPORTUNITY_META: Record<
  ReturnType<typeof runPhaseOpportunityKinds>[number],
  { label: string; icon: LucideIcon }
> = {
  choice: { label: "Entscheidung", icon: CircleHelp },
  rez: { label: "Rezzen", icon: Power },
  breaker: { label: "Stärke erhöhen oder brechen", icon: Hammer },
  ability: { label: "Kartenfähigkeit", icon: Sparkles },
  access: { label: "Zugriff", icon: Search },
  continue: { label: "Weiter", icon: Route },
  jack_out: { label: "Jack-out", icon: X },
  pass: { label: "Passen", icon: Check },
};

function runChoiceStatusLabel(
  view: PlayerView,
  choice: NonNullable<PlayerView["pendingChoice"]>,
): string | null {
  if (choice.source.startsWith("p3_35.access_payment")) {
    const amount = accessAmbushChoiceAmount(choice);
    const amountText = amount
      ? `${amount} ${amount === 1 ? "Credit" : "Credits"}`
      : "Credits";
    return choice.side === view.side
      ? `Du entscheidest jetzt, ob du ${amountText} für den Access-Ambush zahlst.`
      : `${sideLabel(choice.side)} entscheidet jetzt, ob ${choice.side === "corp" ? "sie" : "er"} ${amountText} für den Access-Ambush zahlt.`;
  }
  const prompt = normalizeVisibleTerms(choice.prompt.trim());
  if (!prompt) return null;
  return prompt.endsWith(".") ? prompt : `${prompt}.`;
}

function accessAmbushChoiceAmount(
  choice: NonNullable<PlayerView["pendingChoice"]>,
): number | null {
  for (const option of choice.options) {
    const match = /^(\d+)\s+Credits?\s+zahlen$/i.exec(option.label.trim());
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}
