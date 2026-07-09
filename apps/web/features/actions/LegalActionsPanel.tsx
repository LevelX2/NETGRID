"use client";

import {
  Building2,
  Check,
  Fingerprint,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type {
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";

import {
  actionContextTitle,
  actionButtonTone,
  actionSlotDisplay,
  actionsInteractionAmbience,
  choiceInteractionAmbience,
  isSingleInstalledCorpExposeChoice,
  interactionAmbienceClassName,
  runAwareActionButtonLabel,
  shouldUseCardChoicePanel,
  shouldUseFieldCardChoice,
  type ActionContext,
} from "../../app/action-board-ui";
import { ActionSlotMeter } from "../game-board/ResourceStrip";
import {
  ActionLeadIcon,
  ActionPanelFloatButton,
  OverflowAwareActionButton,
  PriorityWindowHoldToggle,
} from "./ActionControls";
import {
  CardChoicePanel,
  cardChoiceTitle,
  enrichVisibleChoiceCardsFromView,
} from "./CardChoicePanel";
import { DiscardChoicePanel, FieldCardChoicePanel } from "./ChoicePanels";
import {
  SecurityPurgeChoicePanel,
  isSecurityPurgeInstallTargetChoice,
} from "./SecurityPurgeChoicePanel";
import { type DisplayVisibleCard } from "../cards/card-view-model";

export function LegalActionsPanel({
  view,
  primaryActions,
  contextualActions,
  selectedContext,
  hasHiddenContextActions,
  cardContextActive = false,
  hiddenContextHint = null,
  actionCapacities,
  priorityWindowHoldEnabled,
  activeAiSide,
  disabled,
  highlighted = false,
  selectedDiscardOptionIds,
  selectedFieldCardChoiceOptionIds,
  onAction,
  onChoiceOption,
  onChoiceOptions,
  onDiscardChoiceToggle,
  onFieldCardChoiceClear,
  onPriorityWindowHoldEnabled,
  onFloatPanel,
  enrichCard,
  connection,
  onClearContext,
}: {
  view: PlayerView;
  primaryActions: LegalAction[];
  contextualActions: LegalAction[];
  selectedContext: ActionContext | null;
  hasHiddenContextActions: boolean;
  cardContextActive?: boolean;
  hiddenContextHint?: string | null;
  actionCapacities: Record<Side, number>;
  priorityWindowHoldEnabled: boolean;
  activeAiSide?: Side;
  disabled: boolean;
  highlighted?: boolean;
  selectedDiscardOptionIds: string[];
  selectedFieldCardChoiceOptionIds: string[];
  onAction(action: LegalAction): void;
  onChoiceOption(
    action: LegalAction,
    choiceId: string,
    selectedOptionId: string,
  ): void;
  onChoiceOptions(
    action: LegalAction,
    choiceId: string,
    selectedOptionIds: string[],
  ): void;
  onDiscardChoiceToggle(optionId: string): void;
  onFieldCardChoiceClear(): void;
  onPriorityWindowHoldEnabled(enabled: boolean): void;
  onFloatPanel?: (() => void) | undefined;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  connection: "offline" | "connecting" | "online";
  onClearContext(): void;
}) {
  const setupChoice =
    view.pendingChoice?.source === "setup.mulligan"
      ? view.pendingChoice
      : undefined;
  const setupAction = setupChoice
    ? primaryActions.find((action) => action.type === "resolve_choice")
    : undefined;
  if (setupChoice && setupAction) {
    return (
      <section
        className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`}
        data-testid="setup-mulligan-panel"
      >
        <h2>
          {view.side === "runner" ? (
            <Fingerprint size={16} />
          ) : (
            <Building2 size={16} />
          )}
          Setup
        </h2>
        <p className="meta">{setupChoice.prompt}</p>
        <div className="actions setupActions">
          {setupChoice.options.map((option) => (
            <button
              className="button actionButton primary"
              key={option.id}
              onClick={() =>
                onChoiceOption(setupAction, setupChoice.choiceId, option.id)
              }
              disabled={disabled}
              data-testid="setup-choice-button"
            >
              {option.id === "keep" ? (
                <Check size={15} />
              ) : (
                <RotateCcw size={15} />
              )}
              <span className="actionButtonLabel">{option.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }
  const discardChoice =
    view.pendingChoice?.source === "discard_phase"
      ? view.pendingChoice
      : undefined;
  const discardAction = discardChoice
    ? primaryActions.find((action) => action.type === "resolve_choice")
    : undefined;
  if (discardChoice && discardAction) {
    return (
      <DiscardChoicePanel
        choice={discardChoice}
        action={discardAction}
        selected={selectedDiscardOptionIds}
        disabled={disabled}
        highlighted={highlighted}
        onToggle={onDiscardChoiceToggle}
        onChoiceOptions={onChoiceOptions}
      />
    );
  }
  const genericChoice = view.pendingChoice;
  const genericChoiceAction = genericChoice
    ? primaryActions.find((action) => action.type === "resolve_choice")
    : undefined;
  if (genericChoice && genericChoiceAction) {
    const genericChoiceAmbienceClass = interactionAmbienceClassName(
      choiceInteractionAmbience(genericChoice, genericChoiceAction),
    );
    if (isSecurityPurgeInstallTargetChoice(genericChoice)) {
      return (
        <SecurityPurgeChoicePanel
          choice={genericChoice}
          action={genericChoiceAction}
          disabled={disabled}
          highlighted={highlighted}
          enrichCard={enrichCard}
          onChoiceOptions={onChoiceOptions}
        />
      );
    }
    if (shouldUseFieldCardChoice(genericChoice, view)) {
      if (isSingleInstalledCorpExposeChoice(genericChoice)) return null;
      return (
        <FieldCardChoicePanel
          choice={genericChoice}
          action={genericChoiceAction}
          selected={selectedFieldCardChoiceOptionIds}
          disabled={disabled}
          highlighted={highlighted}
          onClear={onFieldCardChoiceClear}
          onChoiceOptions={onChoiceOptions}
        />
      );
    }
    if (shouldUseCardChoicePanel(genericChoice)) {
      const cardChoice = enrichVisibleChoiceCardsFromView(genericChoice, view);
      if (connection !== "online") {
        return (
          <section
            className={`section setupPanel ${genericChoiceAmbienceClass} ${highlighted ? "cueHighlight" : ""}`}
            data-testid="card-choice-paused-panel"
          >
            <h2>
              <Search size={16} />
              {cardChoiceTitle(cardChoice)}
            </h2>
            <p className="meta">{cardChoice.prompt}</p>
            <p className="meta">
              Die Kartenwahl wird wieder geöffnet, sobald die Verbindung steht.
            </p>
          </section>
        );
      }
      return (
        <CardChoicePanel
          choice={cardChoice}
          action={genericChoiceAction}
          view={view}
          disabled={disabled}
          highlighted={highlighted}
          enrichCard={enrichCard}
          onChoiceOptions={onChoiceOptions}
        />
      );
    }
    return (
      <section
        className={`section setupPanel ${genericChoiceAmbienceClass} ${highlighted ? "cueHighlight" : ""}`}
        data-testid="generic-choice-panel"
      >
        <h2>
          <Check size={16} />
          {sideLabel(genericChoice.side)}-Entscheidung
        </h2>
        <p className="meta">{genericChoice.prompt}</p>
        <div className="actions setupActions">
          {genericChoice.options.map((option) => (
            <button
              className="button actionButton primary"
              key={option.id}
              onClick={() =>
                onChoiceOption(
                  genericChoiceAction,
                  genericChoice.choiceId,
                  option.id,
                )
              }
              disabled={disabled}
              data-testid="generic-choice-button"
            >
              <ActionLeadIcon action={genericChoiceAction} />
              <span className="actionButtonLabel">{option.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }
  if (view.phase === "setup") {
    return (
      <section
        className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`}
        data-testid="setup-waiting-panel"
      >
        <h2>Setup</h2>
        <p className="meta">{setupWaitingLabel(view)}</p>
      </section>
    );
  }
  const currentTurnSide = turnSideForView(view) ?? view.activeSide;
  const currentTurnClicks =
    currentTurnSide === view.side ? view.own.clicks : view.opponent.clicks;
  const currentTurnCapacity = actionCapacities[currentTurnSide];
  const currentTurnDisplay = actionSlotDisplay(
    currentTurnSide,
    currentTurnClicks,
    currentTurnCapacity,
    true,
  );
  const actionPanelAmbienceClass = interactionAmbienceClassName(
    actionsInteractionAmbience([...primaryActions, ...contextualActions]),
  );
  return (
    <section
      className={`section ${actionPanelAmbienceClass} ${highlighted ? "cueHighlight" : ""}`}
      data-testid="legal-actions"
    >
      <div className={`turnActionHeader side-${currentTurnSide}`}>
        <div className="turnActionHeaderTop">
          <h2>{turnActionHeaderLabel(view, currentTurnSide, activeAiSide)}</h2>
          <PriorityWindowHoldToggle
            enabled={priorityWindowHoldEnabled}
            onToggle={onPriorityWindowHoldEnabled}
          />
          {onFloatPanel ? (
            <ActionPanelFloatButton onFloat={onFloatPanel} />
          ) : null}
        </div>
        <div
          className={`actionAvailability side-${currentTurnSide}`}
          data-testid="action-availability"
        >
          <span className="actionAvailabilityCount">{`noch ${currentTurnDisplay.available}`}</span>
          <ActionSlotMeter
            side={currentTurnSide}
            currentClicks={currentTurnClicks}
            displayCapacity={currentTurnCapacity}
            active
            compact
            slotsOnly
          />
        </div>
      </div>
      <div className="actions">
        {primaryActions.map((action) => {
          const label = runAwareActionButtonLabel(view, action);
          return (
            <OverflowAwareActionButton
              action={action}
              className="button actionButton primary"
              key={action.actionId}
              label={label}
              tone={actionButtonTone(view, action)}
              onClick={() => onAction(action)}
              disabled={disabled}
              data-testid="action-button"
              data-action-type={action.type}
            />
          );
        })}
        {selectedContext ? (
          <div className="actionGroup selectedActionGroup">
            <div className="selectedActionTitle">
              <span>{actionContextTitle(selectedContext)}</span>
              <button
                className="button iconOnly"
                onClick={onClearContext}
                type="button"
                aria-label="Auswahl aufheben"
                title="Auswahl aufheben"
              >
                <X size={14} />
              </button>
            </div>
            {contextualActions.map((action) => {
              const label = runAwareActionButtonLabel(view, action);
              return (
                <OverflowAwareActionButton
                  action={action}
                  className="button actionButton"
                  key={action.actionId}
                  label={label}
                  tone={actionButtonTone(view, action)}
                  onClick={() => onAction(action)}
                  disabled={disabled}
                  data-testid="action-button"
                  data-action-type={action.type}
                />
              );
            })}
            {contextualActions.length === 0 ? (
              <p className="meta">
                Keine Aktion für diese Auswahl in diesem Fenster.
              </p>
            ) : null}
          </div>
        ) : hasHiddenContextActions ? (
          <p className="meta">
            {hiddenContextHint ??
              "Wähle hier eine Aktion oder wähle im Spielfeld eine eigene Spielkarte bzw. ein sichtbares Spielobjekt für weitere Optionen."}
          </p>
        ) : null}
        {primaryActions.length === 0 &&
        !selectedContext &&
        !cardContextActive ? (
          <p className="meta">Keine Aktion in diesem Fenster.</p>
        ) : null}
      </div>
    </section>
  );
}

function turnSideForView(view: PlayerView): Side | null {
  if (view.phase === "corp_draw_phase" || view.phase === "corp_action_phase")
    return "corp";
  if (view.phase === "runner_action_phase" || view.phase === "run")
    return "runner";
  return null;
}

function turnActionHeaderLabel(
  view: PlayerView,
  side: Side,
  activeAiSide?: Side,
): string {
  const actorLabel = `${sideLabel(side)}${activeAiSide === side ? "-KI" : ""}`;
  return `Zug: ${currentTurnNumberForView(view)}  ${actorLabel} Aktionen`;
}

function currentTurnNumberForView(view: PlayerView): number {
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;

  for (const event of view.publicEvents) {
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const actor = sideFromPublicPayload(event.publicPayload.actor);
    if (!actor) continue;

    if (actionType === "mandatory_draw" && actor === "corp") {
      if (activeSide !== "corp") {
        activeSide = "corp";
        activeTurnNumber += 1;
      }
      continue;
    }

    if (actionType === "end_turn") {
      const nextSide: Side = actor === "corp" ? "runner" : "corp";
      if (activeSide !== nextSide) {
        activeSide = nextSide;
        if (nextSide === "corp") activeTurnNumber += 1;
      }
    }
  }

  return activeTurnNumber;
}

function sideFromPublicPayload(value: unknown): Side | null {
  return value === "corp" || value === "runner" ? value : null;
}

function setupWaitingLabel(view: PlayerView): string {
  if (view.timingPoint === "setup.mulligan.runner")
    return "Runner entscheidet über die Starthand.";
  if (view.timingPoint === "setup.mulligan.corp")
    return "Korp entscheidet über die Starthand.";
  return "Setup läuft.";
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}
