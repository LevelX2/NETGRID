"use client";

import { Check, Clipboard, Eye, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";

import {
  cardChoiceIsReadonlyPrivateLook,
  cardChoiceReadonlyConfirmationOptionId,
  cardChoiceUsesOrderedSelection,
  cardChoiceUsesReadableCards,
  newBloodReorderTargetSequenceHint,
  runnerProgramInstallTrashChoiceInfo,
} from "../../app/action-board-ui";
import { CardView } from "../cards/CardView";
import { type DisplayVisibleCard } from "../cards/card-view-model";
import { type CardDisplayMode } from "../settings/settings-model";
import { cardChoiceOrderBadge, isRunnerStackTopChooseOneArrangeRestChoice } from "./card-choice-order-badge";
import { choiceSelectionRangeLabel } from "./card-choice-selection-label";

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;
type VisibleChoiceOption = VisibleChoice["options"][number];

export function enrichVisibleChoiceCardsFromView(choice: VisibleChoice, view: PlayerView): VisibleChoice {
  if (choice.options.every((option) => option.card || typeof option.value !== "string")) return choice;
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
  onChoiceOptions
}: {
  choice: VisibleChoice;
  action: LegalAction;
  view: PlayerView;
  disabled: boolean;
  highlighted: boolean;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  onChoiceOptions(action: LegalAction, choiceId: string, selectedOptionIds: string[]): void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showOnlySelectable, setShowOnlySelectable] = useState(false);
  const minSelections = Math.max(0, Math.floor(choice.minSelections));
  const maxSelections = Math.max(minSelections, Math.floor(choice.maxSelections));
  const readonlyPrivateLook = cardChoiceIsReadonlyPrivateLook(choice);
  const readonlyConfirmationOptionId = readonlyPrivateLook ? cardChoiceReadonlyConfirmationOptionId(choice) : null;
  const hasDisplayOnlyOptions = !readonlyPrivateLook && choice.options.some((option) => option.selectable === false);
  const visibleOptions = readonlyPrivateLook
    ? choice.options.filter((option) => option.id !== readonlyConfirmationOptionId)
    : showOnlySelectable
      ? choice.options.filter(cardChoiceOptionSelectable)
      : choice.options;
  const readableCards = cardChoiceUsesReadableCards(choice);
  const rows = readableCards && visibleOptions.length > 0 ? [visibleOptions] : cardChoiceRows(visibleOptions);
  const selectedOptions = selected
    .map((optionId) => choice.options.find((option) => option.id === optionId))
    .filter((option): option is VisibleChoiceOption => Boolean(option));
  const programInstallTrashInfo = runnerProgramInstallTrashChoiceInfo(choice, view, selected);
  const canSubmit =
    readonlyPrivateLook && readonlyConfirmationOptionId
      ? true
      : selected.length >= minSelections &&
        selected.length <= maxSelections &&
        (programInstallTrashInfo?.canSubmit ?? true);
  const singleSelection = maxSelections === 1;
  const title = programInstallTrashInfo?.title ?? cardChoiceReadonlyPrivateLookTitle(choice, view) ?? cardChoiceTitle(choice);
  const prompt = choice.prompt.trim();
  const effectHint = programInstallTrashInfo?.effectHint ?? cardChoiceEffectHint(choice);
  const orderedSelection = cardChoiceUsesOrderedSelection(choice);

  useEffect(() => {
    setSelected([]);
    setShowOnlySelectable(false);
  }, [choice.choiceId]);

  const toggleOption = (optionId: string) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (!option || !cardChoiceOptionSelectable(option)) return;
    setSelected((current) => {
      if (current.includes(optionId)) return current.filter((id) => id !== optionId);
      if (current.length >= maxSelections) return singleSelection ? [optionId] : current;
      return [...current, optionId];
    });
  };

  const dialog = (
    <section className="cardChoiceOverlay" role="dialog" aria-modal="true" aria-labelledby="card-choice-title" data-testid="card-choice-panel">
      <div className={`cardChoiceDialog ${highlighted ? "cueHighlight" : ""}${readableCards ? " readableCards" : ""}`}>
        <header className="cardChoiceHeader">
          <div>
            <h2 id="card-choice-title">
              <Search size={17} />
              {title}
            </h2>
            {prompt && prompt !== title ? <p className="meta">{prompt}</p> : null}
          </div>
          <div className="cardChoiceHeaderControls">
            {hasDisplayOnlyOptions ? (
              <div className="cardChoiceViewToggle" aria-label="Kartenanzeige">
                <button className={!showOnlySelectable ? "active" : ""} onClick={() => setShowOnlySelectable(false)} type="button" aria-pressed={!showOnlySelectable}>
                  Alle
                </button>
                <button className={showOnlySelectable ? "active" : ""} onClick={() => setShowOnlySelectable(true)} type="button" aria-pressed={showOnlySelectable}>
                  Auswählbar
                </button>
              </div>
            ) : null}
            {readonlyPrivateLook ? null : <span className="cardChoiceCounter">{choiceSelectionRangeLabel(minSelections, maxSelections)}</span>}
          </div>
        </header>
        <div className="cardChoiceRows">
          {rows.map((row, rowIndex) => (
            <div className="cardChoiceOverlapRow" key={`choice-row-${rowIndex}`}>
              {row.map((option) => {
                const active = selected.includes(option.id);
                const selectionIndex = selected.indexOf(option.id);
                const selectable = cardChoiceOptionSelectable(option);
                const card = option.card ? enrichCard(option.card) : null;
                const cardChoiceDisplayMode: CardDisplayMode = card?.imageUrl ? "placeholder" : "text-card";
                const orderBadge = orderedSelection && selectionIndex >= 0 ? cardChoiceOrderBadge(choice, selectionIndex) : null;
                return (
                  <div className={`cardChoiceOptionSlot ${active ? "selected" : ""}${selectable ? "" : " displayOnly"}`} key={option.id}>
                    {orderBadge ? (
                      <span className="cardChoiceOrderBadge" aria-label={orderBadge.ariaLabel} title={orderBadge.ariaLabel}>
                        {orderBadge.label}
                      </span>
                    ) : null}
                    {card ? (
                      <CardView
                        card={card}
                        displayMode={cardChoiceDisplayMode}
                        choiceSelected={active}
                        allowTooltipPinOnSelect
                        {...(selectable ? { onSelect: () => toggleOption(option.id) } : {})}
                      />
                    ) : (
                      <button className={`button actionButton cardChoiceFallback ${active ? "primary" : ""}`} onClick={() => toggleOption(option.id)} disabled={disabled || !selectable} type="button">
                        {active ? <Check size={15} /> : <Clipboard size={15} />}
                        <span className="actionButtonLabel">{option.label}</span>
                      </button>
                    )}
                    {readonlyPrivateLook ? null : (
                      <button
                        className={`button cardChoiceSelectButton ${active ? "primary" : ""}`}
                        onClick={() => toggleOption(option.id)}
                        disabled={disabled || !selectable}
                        type="button"
                        aria-label={selectable ? active ? "Auswahl entfernen" : "Karte auswählen" : "Nur ansehen"}
                        title={selectable ? active ? "Auswahl entfernen" : "Karte auswählen" : "Nur ansehen"}
                        aria-pressed={active}
                        data-testid="card-choice-option"
                      >
                        {selectable ? active ? <Check size={14} /> : <Plus size={14} /> : <Eye size={14} />}
                        <span className="srOnly">{selectable ? active ? "Gewählt" : "Wählen" : "Nur ansehen"}</span>
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
            {effectHint ? <p className="cardChoiceEffectHint">{effectHint}</p> : null}
            <p className="cardChoiceQuestion">{readonlyPrivateLook ? cardChoiceReadonlyQuestion(choice) : programInstallTrashInfo?.question ?? cardChoiceQuestion(choice, selectedOptions)}</p>
          </div>
          <button
            className="button primary cardChoiceSubmit"
            onClick={() => onChoiceOptions(action, choice.choiceId, readonlyPrivateLook && readonlyConfirmationOptionId ? [readonlyConfirmationOptionId] : selected)}
            disabled={disabled || !canSubmit}
            type="button"
            data-testid="card-choice-submit"
          >
            <Check size={15} />
            {readonlyPrivateLook ? "Fertig" : programInstallTrashInfo?.submitLabel ?? cardChoiceSubmitLabel(choice, selected.length)}
          </button>
        </footer>
      </div>
    </section>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

export function cardChoiceTitle(choice: VisibleChoice): string {
  if (choice.cardSearchPresentation?.sourceZone === "heap") return "Heap durchsuchen";
  if (choice.cardSearchPresentation?.sourceZone === "stack") return "Stack durchsuchen";
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice)) return "Stack-Spitze wählen und anordnen";
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder")) return "Herman Revista: ICE vor dem Server neu ordnen";
  if (choice.source.startsWith("p3_58.new_blood_reorder")) return "New Blood: ICE neu anordnen";
  if (choice.source.includes("corp_rd_arrange")) return "R&D-Spitze anordnen";
  if (choice.source.includes("self_modifying_code_free_mu")) return "MU freimachen";
  if (choice.source.includes("sneak_preview_source")) return "Quelle wählen";
  if (choice.source.includes("sneak_preview_heap_install")) return "Heap durchsuchen";
  if (choice.source.includes("sneak_preview_free_mu")) return "MU freimachen";
  if (choice.source.includes("search_stack")) return "Stack durchsuchen";
  if (choice.source.includes("arrange_stack")) return "Karten anordnen";
  return "Karten wählen";
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
    ...(view.run?.accessedCard ? [view.run.accessedCard] : [])
  ];
  return new Map(cards.map((card) => [card.instanceId, card]));
}

function cardChoiceOptionSelectable(option: VisibleChoiceOption): boolean {
  return option.selectable !== false;
}

function cardChoiceRows(options: VisibleChoiceOption[]): VisibleChoiceOption[][] {
  const rowCount = options.length > 18 ? 3 : options.length > 7 ? 2 : 1;
  const rowSize = Math.max(1, Math.ceil(options.length / rowCount));
  const rows: VisibleChoiceOption[][] = [];
  for (let index = 0; index < options.length; index += rowSize) rows.push(options.slice(index, index + rowSize));
  return rows;
}

function cardChoiceReadonlyPrivateLookTitle(choice: VisibleChoice, view: PlayerView): string | null {
  if (!cardChoiceIsReadonlyPrivateLook(choice)) return null;
  if (choice.source.startsWith("p3_38.mystery_box_corp_review:")) {
    const shownCards = choice.options.filter((option) => option.id !== "done").length;
    return `Mystery Box: ${shownCards === 1 ? "Stack-Karte für die Korp" : `${shownCards} Stack-Karten für die Korp`}`;
  }
  const [, , sourceCardId, zone] = choice.source.split(":");
  const sourceTitle = sourceCardId ? visibleCardsByInstanceId(view).get(sourceCardId)?.title : null;
  const shownCards = choice.options.filter((option) => option.id !== "done").length;
  const zoneLabel =
    zone === "rd"
      ? shownCards === 1
        ? "oberste R&D-Karte"
        : "R&D-Karten ansehen"
      : zone === "hq"
        ? "HQ-Karten ansehen"
        : "Karten ansehen";
  return sourceTitle ? `${sourceTitle}: ${zoneLabel}` : zoneLabel;
}

function cardChoiceReadonlyQuestion(choice: VisibleChoice): string {
  if (choice.source.startsWith("p3_38.mystery_box_corp_review:")) {
    return "Diese Stack-Karten wurden der Korp durch Mystery Box gezeigt.";
  }
  return "Diese Karten wurden nur dir angezeigt.";
}

function cardChoiceQuestion(choice: VisibleChoice, selectedOptions: VisibleChoiceOption[]): string {
  if (selectedOptions.length === 0) return choice.source.includes("sneak_preview_source") ? "Noch keine Quelle gewählt." : "Noch keine Karte gewählt.";
  if (choice.source.includes("sneak_preview_source")) return "Diese Quelle für Sneak Preview verwenden?";
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice)) {
    const firstTitle = selectedOptions[0]?.card?.title ?? selectedOptions[0]?.label;
    if (selectedOptions.length < choice.maxSelections) return `${firstTitle} wird in den Grip genommen.`;
    return `${firstTitle} in den Grip nehmen und den Rest anordnen?`;
  }
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder")) return `${selectedOptions.length} ICE in dieser Reihenfolge vor dem Server übernehmen?`;
  if (choice.source.startsWith("p3_58.new_blood_reorder")) return `${selectedOptions.length} ICE in Zielslot-Reihenfolge übernehmen?`;
  if (cardChoiceUsesOrderedSelection(choice)) return `${selectedOptions.length} Karten in dieser Reihenfolge übernehmen?`;
  if (choice.cardSearchPresentation || choice.source.includes("search_stack")) {
    return selectedOptions.length === 1 ? "Diese Auswahl für den Sucheffekt übernehmen?" : `${selectedOptions.length} Karten für den Sucheffekt übernehmen?`;
  }
  return selectedOptions.length === 1 ? "Diese Auswahl übernehmen?" : `${selectedOptions.length} Karten übernehmen?`;
}

function cardChoiceSubmitLabel(choice: VisibleChoice, selectedCount: number): string {
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice)) return "Karte nehmen und anordnen";
  if (cardChoiceUsesOrderedSelection(choice)) return "Reihenfolge übernehmen";
  if (selectedCount <= 1) return "Auswahl übernehmen";
  return `${selectedCount} Karten übernehmen`;
}

function cardChoiceEffectHint(choice: VisibleChoice): string | null {
  const newBloodHint = newBloodReorderTargetSequenceHint(choice);
  if (newBloodHint) return newBloodHint;
  const presentation = choice.cardSearchPresentation;
  const resolution = presentation ?? choice.stackSearchResolution;
  if (choice.source.startsWith("p3_38.mystery_box_corp_review:")) {
    return "Nach der Bestätigung wählt der Runner ein gezeigtes installierbares Programm; wenn keines installierbar ist, wird der Stack gemischt.";
  }
  if (isRunnerStackTopChooseOneArrangeRestChoice(choice)) {
    return "Die Nummern zeigen die Auswahlreihenfolge: 1 geht in den Grip; 2 ist danach die neue Stack-Spitze, 3 die zweite Stack-Karte usw.";
  }
  if (choice.source.includes("self_modifying_code_free_mu")) {
    return "Die gewählten installierten Programme werden getrasht; danach wird das vorgezeigte Programm installiert.";
  }
  if (choice.source.includes("sneak_preview_source")) return "Die Quelle wird vor der Suche festgelegt.";
  if (choice.source.includes("sneak_preview_heap_install")) return "Das gewählte Programm wird kostenlos installiert und am Ende des Zuges in den Grip genommen, falls es noch installiert ist.";
  if (choice.source.includes("sneak_preview_free_mu")) {
    return "Die gewählten installierten Programme werden getrasht; danach wird das Sneak-Preview-Programm kostenlos installiert.";
  }
  if (resolution?.destination === "install_program") {
    return `Die gewählte Programmkarte wird ${resolution.reveal === "public" ? "vorgezeigt und " : ""}direkt installiert${resolution.shuffleAfter ? "; danach wird der Stack gemischt" : ""}${presentation?.temporaryReturnAtEndOfTurn || choice.source.includes("sneak_preview") ? "; am Zugende kehrt sie in den Grip zurück, falls sie noch installiert ist" : ""}.`;
  }
  if (resolution?.destination === "grip") {
    return `Die gewählte Karte wird ${resolution.reveal === "public" ? "vorgezeigt und " : ""}in den Grip genommen${resolution.shuffleAfter ? "; danach wird der Stack gemischt" : ""}.`;
  }
  if (choice.source.startsWith("corp.start_of_run_redirect.herman_reorder")) return "Wähle die ICE im Fenster nacheinander in der neuen Reihenfolge vor diesem Server.";
  if (choice.source.includes("corp_rd_arrange")) return "Die gewählte Reihenfolge wird für die R&D-Spitze übernommen.";
  if (choice.source.includes("arrange_stack")) return "Die gewählte Reihenfolge wird für den Stack übernommen.";
  if (choice.source.includes("search_trash")) return "Die gewählte Karte wird aus dem Heap in den Grip genommen.";
  return null;
}
