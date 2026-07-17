import { Check } from "lucide-react";
import type { SuccessfulRunOutcomePresentation } from "../../app/successful-run-outcome-presentation";
import { CardView } from "../cards/CardView";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";
import { WindowEventIcon } from "./WindowEventIcon";

export function SuccessfulRunOutcomeModal({
  outcome,
  card,
  displayMode,
  onDismiss,
}: {
  outcome: SuccessfulRunOutcomePresentation;
  card?: DisplayVisibleCard;
  displayMode: CardDisplayMode;
  onDismiss(): void;
}) {
  return (
    <div
      className="accessRevealOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="successful-run-outcome-title"
    >
      <div className="accessRevealBackdrop" aria-hidden="true" />
      <section className="accessRevealPanel">
        <div className="accessRevealHeader">
          <div className="accessRevealHeadingText">
            <p className="eyebrow">Run-Ergebnis</p>
            <h2 id="successful-run-outcome-title">{outcome.sourceTitle}</h2>
            <p>{outcome.headline}</p>
          </div>
          <WindowEventIcon kind="access" side="runner" />
        </div>
        <div
          className={`accessRevealBody${card ? " hasSingleRevealedCard" : ""}`}
        >
          {card ? (
            <div className="accessRevealCard">
              <CardView card={card} displayMode={displayMode} preview />
            </div>
          ) : null}
          <div className="accessRevealDecision">
            <WindowEventIcon kind="access" side="runner" />
            <p className="accessRevealStatus">{outcome.headline}</p>
            <p>{outcome.resultText}</p>
            <div className="accessRevealActions">
              <button
                className="button accessRevealActionButton primary"
                onClick={onDismiss}
                type="button"
                data-testid="successful-run-outcome-dismiss"
              >
                <Check size={15} />
                <span className="accessRevealActionLabel">Weiter</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
