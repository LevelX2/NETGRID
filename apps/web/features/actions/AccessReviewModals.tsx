import { Award as AgendaIcon, Check, Trash2, X } from "lucide-react";
import type { LegalAction, Side } from "@netgrid/shared";

import { accessDecisionLabel, accessRevealActionGroups } from "../../app/access-reveal-ui";
import { CardView } from "../cards/CardView";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";
import { CostChips } from "./ActionControls";

export type AccessReveal = {
  eventId: string;
  kind: "access" | "archives_reveal";
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
  onDismiss
}: {
  reveal: AccessReveal;
  displayMode: CardDisplayMode;
  disabled: boolean;
  onAction(action: LegalAction): void;
  onDismiss(): void;
}) {
  const { primaryActions, declineAction } = accessRevealActionGroups(reveal.actions);
  const runAction = (action: LegalAction) => {
    onAction(action);
    onDismiss();
  };
  const isArchivesReveal = reveal.kind === "archives_reveal";
  const title = isArchivesReveal
    ? "Archivkarten aufgedeckt"
    : `Zugriff auf ${reveal.serverTitleLabel}`;
  const eyebrow = isArchivesReveal ? "Archiv" : "Zugriff";

  return (
    <div className="accessRevealOverlay" role="dialog" aria-modal="true" aria-labelledby="access-reveal-title">
      <div className="accessRevealBackdrop" aria-hidden="true" />
      <section className="accessRevealPanel">
        <div className="accessRevealHeader">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="access-reveal-title">{title}</h2>
            <p>{reveal.description}</p>
          </div>
          <button className="button iconOnly" onClick={onDismiss} aria-label="Fenster schließen" title="Schließen">
            <X size={16} />
          </button>
        </div>
        {reveal.revealedCards?.length ? (
          <div className="exposeReviewCards" data-testid="archives-reveal-cards">
            {reveal.revealedCards.map((card, index) => (
              <div className="exposeReviewCard" key={`${reveal.eventId}-${card.definitionId ?? card.instanceId}-${index}`}>
                <CardView card={card} displayMode={displayMode} preview />
                <div className="exposeReviewCardText">
                  <strong>{card.title}</strong>
                  <span>Jetzt offen im Archiv</span>
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
            {reveal.followupStatus ? <p className="accessRevealStatus">{reveal.followupStatus}</p> : null}
            <p className="accessRevealStatus">{reveal.trashStatus}</p>
            <div className="accessRevealActions">
              {primaryActions.map((action) => (
                <button className={`button primary ${action.type === "trash_accessed_card" || action.type === "trash_resource" ? "dangerButton" : ""}`} key={action.actionId} onClick={() => runAction(action)} disabled={disabled}>
                  {action.type === "trash_accessed_card" || action.type === "trash_resource" ? <Trash2 size={15} /> : <AgendaIcon size={15} />}
                  {accessDecisionLabel(action, reveal.serverLabel)}
                  <CostChips action={action} />
                </button>
              ))}
              {declineAction ? (
                <button className="button" onClick={() => runAction(declineAction)} disabled={disabled}>
                  <Check size={15} />
                  {accessDecisionLabel(declineAction, reveal.serverLabel)}
                </button>
              ) : null}
              {reveal.actions.length === 0 ? (
                <button className="button" onClick={onDismiss}>
                  <Check size={15} />
                  OK
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ExposeReviewModal({
  review,
  displayMode,
  onDismiss
}: {
  review: ExposeReview;
  displayMode: CardDisplayMode;
  onDismiss(): void;
}) {
  return (
    <div className="accessRevealOverlay exposeReviewOverlay" role="dialog" aria-modal="true" aria-labelledby="expose-review-title">
      <div className="accessRevealBackdrop" aria-hidden="true" />
      <section className="accessRevealPanel exposeReviewPanel">
        <div className="accessRevealHeader">
          <div>
            <p className="eyebrow">Ansehen</p>
            <h2 id="expose-review-title">{review.title}</h2>
            <p>{review.description}</p>
          </div>
          <button className="button iconOnly" onClick={onDismiss} aria-label="Ansehen schließen" title="Ansehen schließen">
            <X size={16} />
          </button>
        </div>
        <div className="exposeReviewCards" data-testid="expose-review-cards">
          {review.cards.map((card, index) => (
            <div className="exposeReviewCard" key={`${review.eventId}-${card.definitionId ?? card.instanceId}-${index}`}>
              <CardView card={card} displayMode={displayMode} preview />
              <div className="exposeReviewCardText">
                <strong>{card.title}</strong>
                {review.serverLabels[index] ? <span>{review.serverLabels[index]}</span> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="accessRevealActions exposeReviewActions">
          <button className="button primary" onClick={onDismiss} type="button" data-testid="expose-review-dismiss">
            <Check size={15} />
            Gesehen
          </button>
        </div>
      </section>
    </div>
  );
}
