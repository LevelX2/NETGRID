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
import { useLocale, useTranslations } from "use-intl/react";

import {
  actionContextTitle,
  choiceOptionPresentationLabel,
  actionButtonTone,
  actionSlotDisplay,
  actionsInteractionAmbience,
  choiceInteractionAmbience,
  isSingleInstalledCorpExposeChoice,
  interactionAmbienceClassName,
  runAwareActionButtonLabel,
  serverDisplayLabel,
  serverTargetIdForChoiceOption,
  shouldShowEmptyLegalActionMessage,
  shouldUseCardChoicePanel,
  shouldUseFieldCardChoice,
  type ActionContext,
} from "../../app/action-board-ui";
import { ActionSlotMeter } from "../game-board/ResourceStrip";
import {
  ZoneIdentityIcon,
  serverZoneIdentityIconKind,
} from "../game-board/ZoneFrame";
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
import { useCatalogCardPresentations } from "../catalog/catalog-card-presentations";

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
  const t = useTranslations("Actions.panel");
  const locale = useLocale();
  const cardChoiceT = useTranslations("Actions.cardChoice");
  const cardPresentationsById = useCatalogCardPresentations();
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
          {t("setup")}
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
              <span className="actionButtonLabel">
                {choiceOptionPresentationLabel(setupChoice, option, locale)}
              </span>
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
    const genericChoiceAmbience = choiceInteractionAmbience(
      genericChoice,
      genericChoiceAction,
    );
    const genericChoiceAmbienceClass = interactionAmbienceClassName(
      genericChoiceAmbience,
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
              {cardChoiceTitle(cardChoice, cardChoiceT)}
            </h2>
            <p className="meta">{cardChoice.prompt}</p>
            <p className="meta">{t("choicePaused")}</p>
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
        {genericChoiceAmbience === "trace" ? (
          <TurnActionHeader
            view={view}
            actionCapacities={actionCapacities}
            priorityWindowHoldEnabled={priorityWindowHoldEnabled}
            activeAiSide={activeAiSide}
            onPriorityWindowHoldEnabled={onPriorityWindowHoldEnabled}
            onFloatPanel={onFloatPanel}
          />
        ) : null}
        <h2>
          <Check size={16} />
          {t("sideDecision", { side: t(`side.${genericChoice.side}`) })}
        </h2>
        <p className="meta">{genericChoice.prompt}</p>
        <div className="actions setupActions">
          {genericChoice.options.map((option) => {
            const targetServerId = serverTargetIdForChoiceOption(
              option,
              view.servers.map((server) => server.id),
            );
            return (
              <button
                className={`button actionButton primary ${
                  targetServerId ? "hasServerTarget" : ""
                }`}
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
                {targetServerId ? (
                  <ZoneIdentityIcon
                    side="corp"
                    kind={serverZoneIdentityIconKind(targetServerId)}
                    label={
                      targetServerId === "new_remote"
                        ? t("newRemote")
                        : serverDisplayLabel(targetServerId)
                    }
                    className="actionTargetServerIcon"
                  />
                ) : null}
                <span className="actionButtonLabel">
                  {choiceOptionPresentationLabel(
                    genericChoice,
                    option,
                    locale,
                  )}
                </span>
              </button>
            );
          })}
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
        <h2>{t("setup")}</h2>
        <p className="meta">{t(setupWaitingKey(view))}</p>
      </section>
    );
  }
  const actionPanelAmbienceClass = interactionAmbienceClassName(
    actionsInteractionAmbience([...primaryActions, ...contextualActions]),
  );
  return (
    <section
      className={`section ${actionPanelAmbienceClass} ${highlighted ? "cueHighlight" : ""}`}
      data-testid="legal-actions"
    >
      <TurnActionHeader
        view={view}
        actionCapacities={actionCapacities}
        priorityWindowHoldEnabled={priorityWindowHoldEnabled}
        activeAiSide={activeAiSide}
        onPriorityWindowHoldEnabled={onPriorityWindowHoldEnabled}
        onFloatPanel={onFloatPanel}
      />
      <div className="actions">
        {primaryActions.map((action) => {
          const label = runAwareActionButtonLabel(
            view,
            action,
            cardPresentationsById,
            locale,
          );
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
              <span>{actionContextTitle(selectedContext, locale)}</span>
              <button
                className="button iconOnly"
                onClick={onClearContext}
                type="button"
                aria-label={t("clearSelection")}
                title={t("clearSelection")}
              >
                <X size={14} />
              </button>
            </div>
            {contextualActions.map((action) => {
              const label = runAwareActionButtonLabel(
                view,
                action,
                cardPresentationsById,
                locale,
              );
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
              <p className="meta">{t("noActionForSelection")}</p>
            ) : null}
          </div>
        ) : hasHiddenContextActions ? (
          <p className="meta">{hiddenContextHint ?? t("chooseActionHint")}</p>
        ) : null}
        {shouldShowEmptyLegalActionMessage({
          primaryActionCount: primaryActions.length,
          hasSelectedContext: selectedContext !== null,
          cardContextActive,
          hasHiddenContextActions,
        }) ? (
          <p className="meta">{t("noAction")}</p>
        ) : null}
      </div>
    </section>
  );
}

export function ReadOnlyTurnActionPanel({
  view,
  actionCapacities,
}: {
  view: PlayerView;
  actionCapacities: Record<Side, number>;
}) {
  return (
    <section className="section" data-testid="replay-action-status">
      <TurnActionHeader
        view={view}
        actionCapacities={actionCapacities}
        priorityWindowHoldEnabled={false}
        activeAiSide={undefined}
        onPriorityWindowHoldEnabled={() => undefined}
        onFloatPanel={undefined}
        showControls={false}
      />
    </section>
  );
}

function TurnActionHeader({
  view,
  actionCapacities,
  priorityWindowHoldEnabled,
  activeAiSide,
  onPriorityWindowHoldEnabled,
  onFloatPanel,
  showControls = true,
}: {
  view: PlayerView;
  actionCapacities: Record<Side, number>;
  priorityWindowHoldEnabled: boolean;
  activeAiSide: Side | undefined;
  onPriorityWindowHoldEnabled(enabled: boolean): void;
  onFloatPanel: (() => void) | undefined;
  showControls?: boolean;
}) {
  const t = useTranslations("Actions.panel");
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

  return (
    <div className={`turnActionHeader side-${currentTurnSide}`}>
      <div className="turnActionHeaderTop">
        <h2>
          {t("turnActions", {
            turn: currentTurnNumberForView(view),
            actor: t(
              activeAiSide === currentTurnSide
                ? `sideAi.${currentTurnSide}`
                : `side.${currentTurnSide}`,
            ),
          })}
        </h2>
        {showControls ? (
          <PriorityWindowHoldToggle
            enabled={priorityWindowHoldEnabled}
            onToggle={onPriorityWindowHoldEnabled}
          />
        ) : null}
        {showControls && onFloatPanel ? (
          <ActionPanelFloatButton onFloat={onFloatPanel} />
        ) : null}
      </div>
      <div
        className={`actionAvailability side-${currentTurnSide}`}
        data-testid="action-availability"
      >
        <span className="actionAvailabilityCount">
          {t("remainingActions", { count: currentTurnDisplay.available })}
        </span>
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
  );
}

function turnSideForView(view: PlayerView): Side | null {
  if (view.phase === "corp_draw_phase" || view.phase === "corp_action_phase")
    return "corp";
  if (view.phase === "runner_action_phase" || view.phase === "run")
    return "runner";
  return null;
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

function setupWaitingKey(
  view: PlayerView,
): "runnerMulligan" | "corpMulligan" | "setupRunning" {
  if (view.timingPoint === "setup.mulligan.runner") return "runnerMulligan";
  if (view.timingPoint === "setup.mulligan.corp") return "corpMulligan";
  return "setupRunning";
}
