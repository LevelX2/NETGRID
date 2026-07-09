"use client";

import { Check, Search, Server, Shield, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";

import { CardView } from "../cards/CardView";
import { interactionAmbienceClassName } from "../../app/action-board-ui";
import { type DisplayVisibleCard } from "../cards/card-view-model";
import { type CardDisplayMode } from "../settings/settings-model";

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;
type VisibleChoiceOption = VisibleChoice["options"][number];

type SecurityPurgeChoiceCard = {
  cardId: string;
  label: string;
  card?: VisibleCard;
  targetOptions: VisibleChoiceOption[];
};

const SECURITY_PURGE_CHOICE_SOURCE =
  "card_implementation.agenda_purge_install_targets:";

export function isSecurityPurgeInstallTargetChoice(
  choice: VisibleChoice | null | undefined,
): boolean {
  if (!choice) return false;
  return (
    choice.kind === "select_option" &&
    choice.source.startsWith(SECURITY_PURGE_CHOICE_SOURCE)
  );
}

export function SecurityPurgeChoicePanel({
  choice,
  action,
  disabled,
  highlighted,
  enrichCard,
  onChoiceOptions,
}: {
  choice: VisibleChoice;
  action: LegalAction;
  disabled: boolean;
  highlighted: boolean;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  onChoiceOptions(
    action: LegalAction,
    choiceId: string,
    selectedOptionIds: string[],
  ): void;
}) {
  const cards = useMemo(() => securityPurgeChoiceCards(choice), [choice]);
  const targetCards = cards.filter((card) => card.targetOptions.length > 0);
  const [selectedByCardId, setSelectedByCardId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setSelectedByCardId({});
  }, [choice.choiceId]);

  const selectedOptionIds = targetCards
    .map((card) => selectedByCardId[card.cardId])
    .filter((optionId): optionId is string => Boolean(optionId));
  const canSubmit = selectedOptionIds.length === targetCards.length;

  const dialog = (
    <section
      className="cardChoiceOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-purge-choice-title"
      data-testid="security-purge-choice-panel"
    >
      <div
        className={`cardChoiceDialog securityPurgeDialog ${interactionAmbienceClassName("trash")} ${
          highlighted ? "cueHighlight" : ""
        }`}
      >
        <header className="cardChoiceHeader">
          <div>
            <h2 id="security-purge-choice-title">
              <Search size={17} />
              Security Purge: R&D-Karten
            </h2>
            <p className="meta">{choice.prompt}</p>
          </div>
          <span className="cardChoiceCounter">
            {selectedOptionIds.length}/{targetCards.length} ICE
          </span>
        </header>
        <div className="securityPurgeCards">
          {cards.map((entry) => {
            const displayCard = entry.card ? enrichCard(entry.card) : null;
            const displayMode: CardDisplayMode = displayCard?.imageUrl
              ? "placeholder"
              : "text-card";
            const selectedOptionId = selectedByCardId[entry.cardId];
            return (
              <article className="securityPurgeCard" key={entry.cardId}>
                <div className="securityPurgeCardView">
                  {displayCard ? (
                    <CardView
                      card={displayCard}
                      displayMode={displayMode}
                      allowTooltipPinOnSelect
                    />
                  ) : (
                    <div className="securityPurgeFallbackCard">
                      {entry.label}
                    </div>
                  )}
                </div>
                {entry.targetOptions.length > 0 ? (
                  <div className="securityPurgeTargets">
                    <div className="securityPurgeTargetHeader">
                      <Shield size={14} />
                      <span>ICE-Ziel</span>
                    </div>
                    <div className="securityPurgeTargetList">
                      {entry.targetOptions.map((option) => {
                        const active = selectedOptionId === option.id;
                        return (
                          <button
                            className={`button securityPurgeTargetButton ${
                              active ? "primary" : ""
                            }`}
                            key={option.id}
                            onClick={() =>
                              setSelectedByCardId((current) => ({
                                ...current,
                                [entry.cardId]: option.id,
                              }))
                            }
                            disabled={disabled}
                            type="button"
                            aria-pressed={active}
                            data-testid="security-purge-target-option"
                          >
                            {active ? <Check size={14} /> : <Server size={14} />}
                            <span>
                              {securityPurgeTargetLabel(option, entry)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="securityPurgeTrashNotice">
                    <Trash2 size={14} />
                    <span>wird getrasht</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <footer className="cardChoiceFooter">
          <div className="cardChoiceFooterText">
            <p className="cardChoiceQuestion">
              {canSubmit
                ? "Security Purge mit diesen Zielservern auflösen?"
                : "Wähle für jedes ICE einen Zielserver."}
            </p>
          </div>
          <button
            className="button primary cardChoiceSubmit"
            onClick={() =>
              onChoiceOptions(action, choice.choiceId, selectedOptionIds)
            }
            disabled={disabled || !canSubmit}
            type="button"
            data-testid="security-purge-choice-submit"
          >
            <Check size={15} />
            Installationen übernehmen
          </button>
        </footer>
      </div>
    </section>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

function securityPurgeChoiceCards(
  choice: VisibleChoice,
): SecurityPurgeChoiceCard[] {
  const cardsById = new Map<string, SecurityPurgeChoiceCard>();
  for (const option of choice.options) {
    const cardId = securityPurgeCardIdFromOptionValue(option.value);
    if (!cardId) continue;
    const existing = cardsById.get(cardId);
    const entry =
      existing ??
      ({
        cardId,
        label: option.card?.title ?? securityPurgeCardLabel(option),
        targetOptions: [],
        ...(option.card ? { card: option.card } : {}),
      } satisfies SecurityPurgeChoiceCard);
    if (!entry.card && option.card) entry.card = option.card;
    if (securityPurgeOptionInstallsToServer(option)) {
      entry.targetOptions.push(option);
    }
    cardsById.set(cardId, entry);
  }
  return Array.from(cardsById.values());
}

function securityPurgeCardIdFromOptionValue(
  value: VisibleChoiceOption["value"],
): string | null {
  if (typeof value !== "string") return null;
  return value.split("|")[0]?.trim() || null;
}

function securityPurgeOptionInstallsToServer(
  option: VisibleChoiceOption,
): boolean {
  return (
    option.selectable !== false &&
    typeof option.value === "string" &&
    option.value.includes("|")
  );
}

function securityPurgeCardLabel(option: VisibleChoiceOption): string {
  const label = option.label.trim();
  const separator = label.indexOf(":");
  return separator > 0 ? label.slice(0, separator).trim() : label;
}

function securityPurgeTargetLabel(
  option: VisibleChoiceOption,
  entry: SecurityPurgeChoiceCard,
): string {
  const label = option.label.trim();
  const title = entry.card?.title ?? entry.label;
  const prefix = `${title}:`;
  return label.startsWith(prefix) ? label.slice(prefix.length).trim() : label;
}
