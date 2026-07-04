import { Award as AgendaIcon, Check, Eye, Trash2, X } from "lucide-react";
import type { LegalAction, Side, VisibleChoiceRequest } from "@netgrid/shared";

import {
  accessDecisionDisplayLabel,
  accessDecisionLabel,
  accessRevealActionGroups,
} from "../../app/access-reveal-ui";
import { CardView } from "../cards/CardView";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";
import { CostChips } from "./ActionControls";

const reviewCardPreviewStyle = {
  justifySelf: "center",
  width: "min(156px, 100%)",
} as const;

export type AccessReveal = {
  eventId: string;
  kind: "access" | "archives_reveal" | "gypsy_rd_reveal" | "hq_agenda_reveal";
  actorSide: Side;
  viewerSide: Side;
  serverLabel: string;
  serverTitleLabel: string;
  serverLocationPhrase: string;
  description: string;
  card?: DisplayVisibleCard;
  revealedCards?: DisplayVisibleCard[];
  actions: LegalAction[];
  trashStatus: string;
  followupStatus?: string;
  revealedCardStatus?: string;
  dismissLabel?: string;
  choice?: VisibleChoiceRequest;
  choiceAction?: LegalAction;
};

export type ExposeReview = {
  eventId: string;
  actorSide: Side;
  viewerSide: Side;
  cards: DisplayVisibleCard[];
  serverLabels: string[];
  title: string;
  description: string;
};

export function AccessRevealModal({
  reveal,
  displayMode,
  disabled,
  onAction,
  onChoiceOption,
  onDismiss,
}: {
  reveal: AccessReveal;
  displayMode: CardDisplayMode;
  disabled: boolean;
  onAction(action: LegalAction): void;
  onChoiceOption?: (
    action: LegalAction,
    choiceId: string,
    selectedOptionId: string,
  ) => void;
  onDismiss(): void;
}) {
  const { primaryActions, declineAction } = accessRevealActionGroups(
    reveal.actions,
  );
  const runAction = (action: LegalAction) => {
    onAction(action);
    onDismiss();
  };
  const runChoiceOption = (selectedOptionId: string) => {
    if (!reveal.choice || !reveal.choiceAction || !onChoiceOption) return;
    onChoiceOption(
      reveal.choiceAction,
      reveal.choice.choiceId,
      selectedOptionId,
    );
  };
  const isArchivesReveal = reveal.kind === "archives_reveal";
  const isGypsyReveal = reveal.kind === "gypsy_rd_reveal";
  const isHqAgendaReveal = reveal.kind === "hq_agenda_reveal";
  const title = isGypsyReveal
    ? "Gypsy Schedule Analyzer"
    : isArchivesReveal
      ? "Archivkarten aufgedeckt"
      : isHqAgendaReveal
        ? "HQ-Agenden vorgezeigt"
        : `Zugriff auf ${reveal.serverTitleLabel}`;
  const eyebrow = isGypsyReveal
    ? "R&D Reveal"
    : isArchivesReveal
      ? "Archiv"
      : isHqAgendaReveal
        ? "HQ Reveal"
        : "Zugriff";
  const visibleRevealedCards = reveal.revealedCards ?? [];
  const statusText = reveal.trashStatus;
  const choiceOptions =
    reveal.choice && reveal.choiceAction
      ? reveal.choice.options.filter((option) => option.selectable !== false)
      : [];

  return (
    <div
      className="accessRevealOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-reveal-title"
    >
      <div className="accessRevealBackdrop" aria-hidden="true" />
      <section className="accessRevealPanel">
        <div className="accessRevealHeader">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="access-reveal-title">{title}</h2>
            <p>{reveal.description}</p>
          </div>
          <button
            className="button iconOnly"
            onClick={onDismiss}
            aria-label="Fenster schließen"
            title="Schließen"
          >
            <X size={16} />
          </button>
        </div>
        {visibleRevealedCards.length ? (
          <div
            className="exposeReviewCards"
            data-testid={
              isGypsyReveal ? "gypsy-rd-reveal-cards" : "archives-reveal-cards"
            }
          >
            {visibleRevealedCards.map((card, index) => (
              <div
                className="exposeReviewCard"
                key={`${reveal.eventId}-${card.definitionId ?? card.instanceId}-${index}`}
              >
                <div style={reviewCardPreviewStyle}>
                  <CardView card={card} displayMode={displayMode} preview />
                </div>
                <div className="exposeReviewCardText">
                  <strong>{card.title}</strong>
                  <span>
                    {isGypsyReveal
                      ? gypsyRevealCardStatus(card.type, index)
                      : (reveal.revealedCardStatus ?? "Jetzt offen im Archiv")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="accessRevealBody">
          {reveal.card ? (
            <div className="accessRevealCard">
              <CardView card={reveal.card} displayMode={displayMode} preview />
            </div>
          ) : null}
          <div className="accessRevealDecision">
            {reveal.followupStatus ? (
              <p className="accessRevealStatus">{reveal.followupStatus}</p>
            ) : null}
            <p className="accessRevealStatus">{statusText}</p>
            <div className="accessRevealActions">
              {choiceOptions.length > 0
                ? choiceOptions.map((option) => (
                    <button
                      className="button accessRevealActionButton primary"
                      key={option.id}
                      onClick={() => runChoiceOption(option.id)}
                      disabled={disabled || !onChoiceOption}
                      type="button"
                      data-testid={`gypsy-rd-reveal-choice-${option.id}`}
                    >
                      {option.id === "reveal_next" ? (
                        <Eye size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      <span className="accessRevealActionLabel">
                        {option.label}
                      </span>
                    </button>
                  ))
                : primaryActions.map((action) => {
                    const label = accessDecisionLabel(
                      action,
                      reveal.serverLabel,
                    );
                    const displayLabel = accessDecisionDisplayLabel(
                      action,
                      reveal.serverLabel,
                    );
                    return (
                      <button
                        className={`button accessRevealActionButton primary ${action.type === "trash_accessed_card" || action.type === "trash_resource" ? "dangerButton" : ""}`}
                        key={action.actionId}
                        onClick={() => runAction(action)}
                        disabled={disabled}
                        aria-label={label}
                        title={label}
                      >
                        {action.type === "trash_accessed_card" ||
                        action.type === "trash_resource" ? (
                          <Trash2 size={15} />
                        ) : (
                          <AgendaIcon size={15} />
                        )}
                        <span className="accessRevealActionLabel">
                          {displayLabel}
                        </span>
                        <CostChips action={action} />
                      </button>
                    );
                  })}
              {choiceOptions.length === 0 && declineAction ? (
                <button
                  className="button accessRevealActionButton"
                  onClick={() => runAction(declineAction)}
                  disabled={disabled}
                >
                  <Check size={15} />
                  <span className="accessRevealActionLabel">
                    {accessDecisionLabel(declineAction, reveal.serverLabel)}
                  </span>
                </button>
              ) : null}
              {choiceOptions.length === 0 && reveal.actions.length === 0 ? (
                <button
                  className="button accessRevealActionButton"
                  onClick={onDismiss}
                >
                  <Check size={15} />
                  <span className="accessRevealActionLabel">
                    {reveal.dismissLabel ?? "OK"}
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function gypsyRevealCardStatus(
  cardType: DisplayVisibleCard["type"],
  index: number,
): string {
  const prefix = `Karte ${index + 1}`;
  if (cardType === "agenda") return `${prefix}: Agenda gefunden`;
  return `${prefix}: aus R&D aufgedeckt`;
}

export function ExposeReviewModal({
  review,
  displayMode,
  onDismiss,
}: {
  review: ExposeReview;
  displayMode: CardDisplayMode;
  onDismiss(): void;
}) {
  return (
    <div
      className="accessRevealOverlay exposeReviewOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expose-review-title"
    >
      <div className="accessRevealBackdrop" aria-hidden="true" />
      <section className="accessRevealPanel exposeReviewPanel">
        <div className="accessRevealHeader">
          <div>
            <p className="eyebrow">Ansehen</p>
            <h2 id="expose-review-title">{review.title}</h2>
            <p>{review.description}</p>
          </div>
          <button
            className="button iconOnly"
            onClick={onDismiss}
            aria-label="Ansehen schließen"
            title="Ansehen schließen"
          >
            <X size={16} />
          </button>
        </div>
        <div className="exposeReviewCards" data-testid="expose-review-cards">
          {review.cards.map((card, index) => (
            <div
              className="exposeReviewCard"
              key={`${review.eventId}-${card.definitionId ?? card.instanceId}-${index}`}
            >
              <div style={reviewCardPreviewStyle}>
                <CardView card={card} displayMode={displayMode} preview />
              </div>
              <div className="exposeReviewCardText">
                <strong>{card.title}</strong>
                {review.serverLabels[index] ? (
                  <span>{review.serverLabels[index]}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="accessRevealActions exposeReviewActions">
          <button
            className="button primary"
            onClick={onDismiss}
            type="button"
            data-testid="expose-review-dismiss"
          >
            <Check size={15} />
            Gesehen
          </button>
        </div>
      </section>
    </div>
  );
}
