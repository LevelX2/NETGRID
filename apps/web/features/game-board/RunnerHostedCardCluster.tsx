import { Fragment, type ReactNode } from "react";
import type { VisibleCard } from "@netgrid/shared";

export function RunnerHostedCardCluster({
  hostCard,
  hostedCards,
  renderCard,
}: {
  hostCard: VisibleCard;
  hostedCards: VisibleCard[];
  renderCard(card: VisibleCard): ReactNode;
}) {
  if (hostedCards.length === 0) return <>{renderCard(hostCard)}</>;

  const hostLabel =
    hostCard.title ?? hostedCards[0]?.hostedOnLabel ?? "Runner-Host";

  return (
    <div
      className="runnerHostedCardCluster"
      data-host-card-id={hostCard.instanceId}
    >
      {renderCard(hostCard)}
      <span className="runnerHostedCardConnector" aria-hidden="true">
        →
      </span>
      <div
        className="runnerHostedCardLane"
        aria-label={`Auf ${hostLabel} gehostete Programme`}
      >
        <span className="runnerHostedCardBadge">Gehostet</span>
        <div className="runnerHostedCardLaneCards">
          {hostedCards.map((card) => (
            <Fragment key={card.instanceId}>{renderCard(card)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
