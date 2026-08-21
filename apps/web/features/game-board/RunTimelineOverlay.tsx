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
import { useLocale, useTranslations } from "use-intl/react";

import {
  RUN_TIMELINE_STEPS,
  actionButtonTone,
  breachHighlighterAccessHint,
  breachProgressLabel,
  choiceOptionPresentationLabel,
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
  const t = useTranslations("Board.run");
  const cardPresentationsById = useCatalogCardPresentations();
  const locale = useLocale();
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
  const runFocusIceFallback = t(approachedIce ? "viewedIce" : "visibleIce");
  const jackOutAvailable = hasLegalAction(legalActions, "jack_out");
  const breachProgress = breachProgressLabel(view, locale);
  const breachHighlighterHint = breachHighlighterAccessHint(view);
  const headerStatus = runWindowStatusLabel(view, locale);
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
    ? runChoiceStatusLabel(view, runChoice, {
        own: (amount) => t("ambushOwn", { amount }),
        other: (side, amount) =>
          t(side === "corp" ? "ambushCorp" : "ambushRunner", {
            side: t(`side.${side}`),
            amount,
          }),
        credits: (amount) =>
          amount ? t("creditCount", { count: amount }) : t("credits"),
      })
    : null;
  const phaseOpportunities = runPhaseOpportunityKinds(runActions);
  const phaseOpportunityLabel = phaseOpportunities
    .map((kind) => t(`opportunity.${kind}`))
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
          title={t("moveWindow")}
          aria-label={t("moveWindow")}
        >
          <Route size={18} />
          <span className="runTimelineTitle">
            <strong>
              {t("runOn", { server: serverDisplayLabel(run.attackedServerId) })}
            </strong>
            {headerStatus ? <small>{headerStatus}</small> : null}
          </span>
          <Move size={15} aria-hidden="true" />
        </div>
        <div className="runSteps">
          {verticalSteps.map((step) => {
            const current = currentStep === step.id;
            return (
              <span className={current ? "current" : ""} key={step.id}>
                {t(`step.${step.id}`)}
                {current && phaseOpportunities.length > 0 ? (
                  <small
                    className="runStepOpportunities"
                    aria-label={t("currentlyPossible", {
                      actions: phaseOpportunityLabel,
                    })}
                    data-testid="run-phase-opportunities"
                  >
                    {phaseOpportunities.map((kind) => {
                      const opportunity = RUN_PHASE_OPPORTUNITY_META[kind];
                      const Icon = opportunity.icon;
                      return (
                        <i
                          className={`runStepOpportunity ${kind}`}
                          title={t(`opportunity.${kind}`)}
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
              const optionLabel = choiceOptionPresentationLabel(
                runChoice,
                option,
                locale,
              );
              const accessibleLabel = costLabel
                ? t("optionCost", { option: optionLabel, cost: costLabel })
                : optionLabel;
              return (
                <OverflowAwareActionButton
                  action={choiceAction}
                  className="button primary actionButton runActionButton"
                  key={option.id}
                  label={accessibleLabel}
                  displayLabel={optionLabel}
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
            aria-label={t("runActions")}
            data-testid="run-action-bar"
          >
            {currentServerActions.map((action) => {
              const compactLabel = runWindowActionButtonLabel(
                view,
                action,
                cardPresentationsById,
                locale,
              );
              const baseFullLabel =
                locale === "de" &&
                compactLabel.startsWith("SMC:") &&
                action.label
                  ? normalizeVisibleTerms(action.label)
                  : runAwareActionButtonLabel(
                      view,
                      action,
                      cardPresentationsById,
                      locale,
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
                aria-label={t("rezOtherServers")}
              >
                <span>{t("rezOtherServers")}</span>
              </div>
            ) : null}
            {otherServerRezActions.map((action) => {
              const compactLabel = runWindowActionButtonLabel(
                view,
                action,
                cardPresentationsById,
                locale,
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
                    locale,
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
          <p className="runHint">{t("canJackOut")}</p>
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
                  {t("autoPassActive")}
                </span>
                <button
                  className="button runAutoPassStopButton"
                  type="button"
                  onClick={() => onCorpRunAutoPassEnabled(false)}
                  disabled={actionDisabled}
                >
                  {t("stop")}
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
                <span>{t("autoPassRest")}</span>
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
              <strong>{t("hiddenIce")}</strong>
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
  { icon: LucideIcon }
> = {
  choice: { icon: CircleHelp },
  rez: { icon: Power },
  breaker: { icon: Hammer },
  ability: { icon: Sparkles },
  access: { icon: Search },
  continue: { icon: Route },
  jack_out: { icon: X },
  pass: { icon: Check },
};

function runChoiceStatusLabel(
  view: PlayerView,
  choice: NonNullable<PlayerView["pendingChoice"]>,
  labels: {
    own(amount: string): string;
    other(side: Side, amount: string): string;
    credits(amount: number | null): string;
  },
): string | null {
  if (choice.source.startsWith("p3_35.access_payment")) {
    const amount = accessAmbushChoiceAmount(choice);
    const amountText = labels.credits(amount);
    return choice.side === view.side
      ? labels.own(amountText)
      : labels.other(choice.side, amountText);
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
