"use client";

import { Check, Clipboard, Eye, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";
import { useLocale, useTranslations } from "use-intl/react";

import {
  cardChoiceIsReadonlyPrivateLook,
  cardChoiceReadonlyConfirmationOptionId,
  cardChoiceUsesOrderedSelection,
  cardChoiceUsesReadableCards,
  choiceInteractionAmbience,
  choiceOptionPresentationLabel,
  choicePromptPresentationLabel,
  interactionAmbienceClassName,
  isDataFortReclamationHqChoice,
  isDataFortReclamationRezChoice,
  newBloodReorderTargetSequenceHint,
  runnerProgramInstallTrashChoiceInfo,
} from "../../app/action-board-ui";
import { CardView } from "../cards/CardView";
import { type DisplayVisibleCard } from "../cards/card-view-model";
import { type CardDisplayMode } from "../settings/settings-model";
import {
  cardChoiceHeapPositionBadge,
  cardChoiceHeapPositionHint,
  cardChoiceOrderBadge,
  cardChoiceReadonlyPositionBadge,
  cardChoiceReadonlyPositionHint,
  isRunnerStackTopChooseOneArrangeRestChoice,
} from "./card-choice-order-badge";
import { WindowEventIcon } from "./WindowEventIcon";
import { windowEventIconKindForChoice } from "./window-event-icon-kind";

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;
type VisibleChoiceOption = VisibleChoice["options"][number];

export function enrichVisibleChoiceCardsFromView(
  choice: VisibleChoice,
  view: PlayerView,
): VisibleChoice {
  if (
    choice.options.every(
      (option) => option.card || typeof option.value !== "string",
    )
  )
    return choice;
  const visibleCards = visibleCardsByInstanceId(view);
  let changed = false;
  const options = choice.options.map((option) => {
    if (option.card || typeof option.value !== "string") return option;
    const card = visibleCards.get(option.value);
    if (!card?.known) return option;
    changed = true;
    return { ...option, card };
  });
  return changed ? { ...choice, options } : choice;
}

export function CardChoicePanel({
  choice,
  action,
  view,
  disabled,
  highlighted,
  enrichCard,
  onChoiceOptions,
}: {
  choice: VisibleChoice;
  action: LegalAction;
  view: PlayerView;
  disabled: boolean;
  highlighted: boolean;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  onChoiceOptions(
    action: LegalAction,
    choiceId: string,
    selectedOptionIds: string[],
  ): void;
}) {
  const t = useTranslations("Actions.cardChoice");
  const locale = useLocale();
  const [selected, setSelected] = useState<string[]>([]);
  const [showOnlySelectable, setShowOnlySelectable] = useState(false);
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(
    minSelections,
    Math.floor(choice.maxSelections),
  );
  const readonlyPrivateLook = cardChoiceIsReadonlyPrivateLook(choice);
  const readonlyConfirmationOptionId = readonlyPrivateLook
    ? cardChoiceReadonlyConfirmationOptionId(choice)
    : null;
  const hasDisplayOnlyOptions =
    !readonlyPrivateLook &&
    choice.options.some((option) => option.selectable === false);
  const visibleOptions = readonlyPrivateLook
    ? choice.options.filter(
        (option) => option.id !== readonlyConfirmationOptionId,
      )
    : showOnlySelectable
      ? choice.options.filter(cardChoiceOptionSelectable)
      : choice.options;
  const readableCards = cardChoiceUsesReadableCards(choice);
  const rows =
    readableCards && visibleOptions.length > 0
      ? [visibleOptions]
      : cardChoiceRows(visibleOptions);
  const selectedOptions = selected
    .map((optionId) => choice.options.find((option) => option.id === optionId))
    .filter((option): option is VisibleChoiceOption => Boolean(option));
  const programInstallTrashInfo = runnerProgramInstallTrashChoiceInfo(
    choice,
    view,
    selected,
  );
  const canSubmit =
    readonlyPrivateLook && readonlyConfirmationOptionId
      ? true
      : selected.length >= minSelections &&
        selected.length <= maxSelections &&
        (programInstallTrashInfo?.canSubmit ?? true);
  const singleSelection = maxSelections === 1;
  const title =
    programInstallTrashInfo?.title ??
    cardChoiceReadonlyPrivateLookTitle(choice, view, t) ??
    cardChoiceTitle(choice, t);
  const prompt = choicePromptPresentationLabel(choice, locale).trim();
  const effectHint =
    programInstallTrashInfo?.effectHint ??
    (readonlyPrivateLook ? cardChoiceReadonlyPositionHint(choice) : null) ??
    cardChoiceEffectHint(choice, t);
  const orderedSelection = cardChoiceUsesOrderedSelection(choice);
  const ambience = choiceInteractionAmbience(choice, action);
  const ambienceClass = interactionAmbienceClassName(ambience);

  useEffect(() => {
    setSelected([]);
    setShowOnlySelectable(false);
  }, [choice.choiceId]);

  const toggleOption = (optionId: string) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (!option || !cardChoiceOptionSelectable(option)) return;
    setSelected((current) => {
      if (current.includes(optionId))
        return current.filter((id) => id !== optionId);
      if (current.length >= maxSelections)
        return singleSelection ? [optionId] : current;
      return [...current, optionId];
    });
  };

  const dialog = (
    <section
      className="cardChoiceOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-choice-title"
      data-testid="card-choice-panel"
    >
      <div
        className={`cardChoiceDialog ${ambienceClass} ${highlighted ? "cueHighlight" : ""}${readableCards ? " readableCards" : ""}`}
      >
        <header className="cardChoiceHeader">
          <div>
            <h2 id="card-choice-title">
              <Search size={17} />
              {title}
            </h2>
            {prompt && prompt !== title ? (
              <p className="meta">{prompt}</p>
            ) : null}
          </div>
          <div className="cardChoiceHeaderControls">
            <WindowEventIcon
              side={choice.side}
              kind={windowEventIconKindForChoice({
                ambience,
                source: choice.source,
                title,
              })}
            />
            {hasDisplayOnlyOptions ? (
              <div
                className="cardChoiceViewToggle"
                aria-label={t("cardDisplay")}
              >
                <button
                  className={!showOnlySelectable ? "active" : ""}
                  onClick={() => setShowOnlySelectable(false)}
                  type="button"
                  aria-pressed={!showOnlySelectable}
                >
                  {t("all")}
                </button>
                <button
                  className={showOnlySelectable ? "active" : ""}
                  onClick={() => setShowOnlySelectable(true)}
                  type="button"
                  aria-pressed={showOnlySelectable}
                >
                  {t("selectable")}
                </button>
              </div>
            ) : null}
            {readonlyPrivateLook ? null : (
              <span className="cardChoiceCounter">
                {cardChoiceCounterLabel(
                  choice,
                  minSelections,
                  maxSelections,
                  t,
                )}
              </span>
            )}
          </div>
        </header>
        <div className="cardChoiceRows">
          {rows.map((row, rowIndex) => (
            <div
              className="cardChoiceOverlapRow"
              key={`choice-row-${rowIndex}`}
            >
              {row.map((option) => {
                const active = selected.includes(option.id);
                const selectionIndex = selected.indexOf(option.id);
                const selectable = cardChoiceOptionSelectable(option);
                const card = option.card ? enrichCard(option.card) : null;
                const cardChoiceDisplayMode: CardDisplayMode = card?.imageUrl
                  ? "placeholder"
                  : "text-card";
                const orderBadge =
                  orderedSelection && selectionIndex >= 0
                    ? cardChoiceOrderBadge(choice, selectionIndex)
                    : null;
                const readonlyPositionBadge = readonlyPrivateLook
                  ? cardChoiceReadonlyPositionBadge(choice, option.id)
                  : null;
                const heapPositionBadge = cardChoiceHeapPositionBadge(
                  choice,
                  option.id,
                );
                const visibleOrderBadge =
                  heapPositionBadge ?? orderBadge ?? readonlyPositionBadge;
                return (
                  <div
                    className={`cardChoiceOptionSlot ${active ? "selected" : ""}${selectable ? "" : " displayOnly"}`}
                    key={option.id}
                  >
                    {visibleOrderBadge ? (
                      <span
                        className="cardChoiceOrderBadge"
                        aria-label={visibleOrderBadge.ariaLabel}
                        title={visibleOrderBadge.ariaLabel}
                      >
                        {visibleOrderBadge.label}
                      </span>
                    ) : null}
                    {card ? (
                      <CardView
                        card={card}
                        displayMode={cardChoiceDisplayMode}
                        choiceSelected={active}
                        allowTooltipPinOnSelect
                        {...(selectable
                          ? { onSelect: () => toggleOption(option.id) }
                          : {})}
                      />
                    ) : (
                      <button
                        className={`button actionButton cardChoiceFallback ${active ? "primary" : ""}`}
                        onClick={() => toggleOption(option.id)}
                        disabled={disabled || !selectable}
                        type="button"
                      >
                        {active ? <Check size={15} /> : <Clipboard size={15} />}
                        <span className="actionButtonLabel">
                          {choiceOptionPresentationLabel(
                            choice,
                            option,
                            locale,
                          )}
                        </span>
                      </button>
                    )}
                    {readonlyPrivateLook ? null : (
                      <button
                        className={`button cardChoiceSelectButton ${active ? "primary" : ""}`}
                        onClick={() => toggleOption(option.id)}
                        disabled={disabled || !selectable}
                        type="button"
                        aria-label={
                          selectable
                            ? active
                              ? t("removeSelection")
                              : t("selectCard")
                            : t("viewOnly")
                        }
                        title={
                          selectable
                            ? active
                              ? t("removeSelection")
                              : t("selectCard")
                            : t("viewOnly")
                        }
                        aria-pressed={active}
                        data-testid="card-choice-option"
                      >
                        {selectable ? (
                          active ? (
                            <Check size={14} />
                          ) : (
                            <Plus size={14} />
                          )
                        ) : (
                          <Eye size={14} />
                        )}
                        <span className="srOnly">
                          {selectable
                            ? active
                              ? t("selected")
                              : t("select")
                            : t("viewOnly")}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <footer className="cardChoiceFooter">
          <div className="cardChoiceFooterText">
            {effectHint ? (
              <p className="cardChoiceEffectHint">{effectHint}</p>
            ) : null}
            <p className="cardChoiceQuestion">
              {readonlyPrivateLook
                ? cardChoiceReadonlyQuestion(choice, t)
                : (programInstallTrashInfo?.question ??
                  cardChoiceQuestion(choice, selectedOptions, t))}
            </p>
          </div>
          <button
            className="button primary cardChoiceSubmit"
            onClick={() =>
              onChoiceOptions(
                action,
                choice.choiceId,
                readonlyPrivateLook && readonlyConfirmationOptionId
                  ? [readonlyConfirmationOptionId]
                  : selected,
              )
            }
            disabled={disabled || !canSubmit}
            type="button"
            data-testid="card-choice-submit"
          >
            <Check size={15} />
            {readonlyPrivateLook
              ? cardChoiceReadonlySubmitLabel(choice, t)
              : (programInstallTrashInfo?.submitLabel ??
                cardChoiceSubmitLabel(choice, selected.length, t))}
          </button>
        </footer>
      </div>
    </section>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

type CardChoiceTranslator = (key: any, values?: any) => string;

export function cardChoiceTitle(
  choice: VisibleChoice,
  t: CardChoiceTranslator,
): string {
  if (isDataFortReclamationHqChoice(choice)) return t("title.dataFortOrder");
  if (isDataFortReclamationRezChoice(choice)) return t("title.dataFortRez");
  if (choice.cardSearchPresentation?.sourceZone === "heap")
    return t("title.searchHeap");
  if (choice.cardSearchPresentation?.sourceZone === "stack")
    return t("title.searchStack");
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice))
    return t("title.chooseStackTop");
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder"))
    return t("title.herman");
  if (choice.source.startsWith("p3_58.new_blood_reorder"))
    return t("title.newBlood");
  if (choice.source.includes("corp_rd_arrange")) return t("title.arrangeRd");
  if (choice.source.includes("self_modifying_code_free_mu"))
    return t("title.freeMu");
  if (choice.source.includes("sneak_preview_source"))
    return t("title.chooseSource");
  if (choice.source.includes("sneak_preview_heap_install"))
    return t("title.searchHeap");
  if (choice.source.includes("sneak_preview_free_mu")) return t("title.freeMu");
  if (choice.source.includes("search_stack")) return t("title.searchStack");
  if (choice.source.includes("arrange_stack")) return t("title.arrangeCards");
  return t("title.chooseCards");
}

function visibleCardsByInstanceId(view: PlayerView): Map<string, VisibleCard> {
  const cards = [
    view.own.identity,
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    view.opponent.identity,
    ...(view.opponent.discardCards ?? []),
    ...view.opponent.scoreArea,
    ...(view.opponent.rig ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.specialZones?.setAside ?? []),
    ...(view.specialZones?.removedFromGame ?? []),
    ...(view.run?.approachedIce ? [view.run.approachedIce] : []),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : []),
    ...(view.run?.accessedCard ? [view.run.accessedCard] : []),
  ];
  return new Map(cards.map((card) => [card.instanceId, card]));
}

function cardChoiceOptionSelectable(option: VisibleChoiceOption): boolean {
  return option.selectable !== false;
}

function cardChoiceRows(
  options: VisibleChoiceOption[],
): VisibleChoiceOption[][] {
  const rowCount = options.length > 18 ? 3 : options.length > 7 ? 2 : 1;
  const rowSize = Math.max(1, Math.ceil(options.length / rowCount));
  const rows: VisibleChoiceOption[][] = [];
  for (let index = 0; index < options.length; index += rowSize)
    rows.push(options.slice(index, index + rowSize));
  return rows;
}

function cardChoiceReadonlyPrivateLookTitle(
  choice: VisibleChoice,
  view: PlayerView,
  t: CardChoiceTranslator,
): string | null {
  if (!cardChoiceIsReadonlyPrivateLook(choice)) return null;
  if (
    choice.source.startsWith("card_implementation.agenda_purge_runner_review:")
  ) {
    const shownCards = choice.options.filter(
      (option) => option.id !== "done",
    ).length;
    return t("readonly.securityPurgeTitle", { count: shownCards });
  }
  if (choice.source.startsWith("p3_38.mystery_box_corp_review:")) {
    const shownCards = choice.options.filter(
      (option) => option.id !== "done",
    ).length;
    return t("readonly.mysteryBoxTitle", { count: shownCards });
  }
  const [, , sourceCardId, zone] = choice.source.split(":");
  const sourceTitle = sourceCardId
    ? visibleCardsByInstanceId(view).get(sourceCardId)?.title
    : null;
  const shownCards = choice.options.filter(
    (option) => option.id !== "done",
  ).length;
  const zoneLabel =
    zone === "rd"
      ? shownCards === 1
        ? t("readonly.topRdCard")
        : t("readonly.viewRdCards")
      : zone === "hq"
        ? t("readonly.viewHqCards")
        : t("readonly.viewCards");
  return sourceTitle ? `${sourceTitle}: ${zoneLabel}` : zoneLabel;
}

function cardChoiceReadonlyQuestion(
  choice: VisibleChoice,
  t: CardChoiceTranslator,
): string {
  if (
    choice.source.startsWith("card_implementation.agenda_purge_runner_review:")
  ) {
    return t("readonly.securityPurgeQuestion");
  }
  if (choice.source.startsWith("p3_38.mystery_box_corp_review:")) {
    return t("readonly.mysteryBoxQuestion");
  }
  return t("readonly.privateQuestion");
}

function cardChoiceReadonlySubmitLabel(
  choice: VisibleChoice,
  t: CardChoiceTranslator,
): string {
  return choice.source.startsWith(
    "card_implementation.agenda_purge_runner_review:",
  )
    ? t("readonly.finishViewing")
    : t("done");
}

function cardChoiceQuestion(
  choice: VisibleChoice,
  selectedOptions: VisibleChoiceOption[],
  t: CardChoiceTranslator,
): string {
  if (isDataFortReclamationRezChoice(choice)) {
    if (selectedOptions.length === 0) return t("question.skipRez");
    const title = selectedOptions[0]?.card?.title ?? selectedOptions[0]?.label;
    return t("question.rezNow", { title });
  }
  if (selectedOptions.length === 0)
    return choice.source.includes("sneak_preview_source")
      ? t("question.noSource")
      : t("question.noCard");
  if (choice.source.includes("sneak_preview_source"))
    return t("question.useSource");
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice)) {
    const firstTitle =
      selectedOptions[0]?.card?.title ?? selectedOptions[0]?.label;
    if (selectedOptions.length < choice.maxSelections)
      return t("question.toGrip", { title: firstTitle });
    return t("question.toGripArrange", { title: firstTitle });
  }
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder"))
    return t("question.iceOrder", { count: selectedOptions.length });
  if (choice.source.startsWith("p3_58.new_blood_reorder"))
    return t("question.iceTargetOrder", { count: selectedOptions.length });
  if (cardChoiceUsesOrderedSelection(choice))
    return t("question.cardOrder", { count: selectedOptions.length });
  if (choice.cardSearchPresentation || choice.source.includes("search_stack")) {
    return selectedOptions.length === 1
      ? t("question.searchSelection")
      : t("question.searchCards", { count: selectedOptions.length });
  }
  return selectedOptions.length === 1
    ? t("question.acceptSelection")
    : t("question.acceptCards", { count: selectedOptions.length });
}

function cardChoiceSubmitLabel(
  choice: VisibleChoice,
  selectedCount: number,
  t: CardChoiceTranslator,
): string {
  if (isDataFortReclamationRezChoice(choice))
    return selectedCount === 1 ? t("submit.rez") : t("submit.doNotRez");
  if (isDataFortReclamationHqChoice(choice)) return t("submit.buildFort");
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice))
    return t("submit.takeArrange");
  if (cardChoiceUsesOrderedSelection(choice)) return t("submit.acceptOrder");
  if (selectedCount <= 1) return t("submit.acceptSelection");
  return t("submit.acceptCards", { count: selectedCount });
}

function cardChoiceEffectHint(
  choice: VisibleChoice,
  t: CardChoiceTranslator,
): string | null {
  if (isDataFortReclamationHqChoice(choice)) return t("effect.dataFortOrder");
  if (isDataFortReclamationRezChoice(choice)) return t("effect.dataFortRez");
  const newBloodHint = newBloodReorderTargetSequenceHint(choice);
  if (newBloodHint) return newBloodHint;
  const presentation = choice.cardSearchPresentation;
  const resolution = presentation ?? choice.stackSearchResolution;
  if (choice.source.startsWith("p3_38.mystery_box_corp_review:")) {
    return t("effect.mysteryBox");
  }
  if (
    choice.source.startsWith("card_implementation.agenda_purge_runner_review:")
  ) {
    return t("effect.securityPurge");
  }
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice)) {
    return t("effect.stackTopOrder");
  }
  if (choice.source.includes("self_modifying_code_free_mu")) {
    return t("effect.freeMu");
  }
  if (choice.source.includes("sneak_preview_source"))
    return t("effect.chooseSource");
  if (choice.source.includes("sneak_preview_heap_install"))
    return t("effect.sneakInstall");
  if (choice.source.includes("sneak_preview_free_mu")) {
    return t("effect.sneakFreeMu");
  }
  const heapPositionHint = cardChoiceHeapPositionHint(choice);
  if (resolution?.destination === "install_program") {
    return t("effect.installProgram", {
      position: heapPositionHint ? `${heapPositionHint} ` : "",
      reveal: resolution.reveal === "public" ? t("effect.revealed") : "",
      shuffle: resolution.shuffleAfter ? t("effect.shuffle") : "",
      return:
        presentation?.temporaryReturnAtEndOfTurn ||
        choice.source.includes("sneak_preview")
          ? t("effect.returnToGrip")
          : "",
    });
  }
  if (resolution?.destination === "grip") {
    return t("effect.toGrip", {
      position: heapPositionHint ? `${heapPositionHint} ` : "",
      reveal: resolution.reveal === "public" ? t("effect.revealed") : "",
      shuffle: resolution.shuffleAfter ? t("effect.shuffle") : "",
    });
  }
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder"))
    return t("effect.herman");
  if (choice.source.includes("corp_rd_arrange")) return t("effect.arrangeRd");
  if (choice.source.includes("arrange_stack")) return t("effect.arrangeStack");
  if (choice.source.includes("search_trash")) return t("effect.heapToGrip");
  return null;
}

function cardChoiceCounterLabel(
  choice: VisibleChoice,
  minSelections: number,
  maxSelections: number,
  t: CardChoiceTranslator,
): string {
  if (isDataFortReclamationRezChoice(choice)) return t("rezWindow");
  if (minSelections === maxSelections)
    return t("selection.exact", { count: maxSelections });
  if (minSelections === 0) return t("selection.upTo", { count: maxSelections });
  return t("selection.range", { min: minSelections, max: maxSelections });
}
