import type { LegalAction, PlayerView } from "@netgrid/shared";
import { useLocale, useTranslations } from "use-intl/react";

import { actionButtonLabel, actionButtonTone } from "../../app/action-board-ui";
import { OverflowAwareActionButton } from "../actions/ActionControls";
import { useCatalogCardPresentations } from "../catalog/catalog-card-presentations";

export function ScoredAgendaActions({
  view,
  actions,
  disabled,
  onAction,
}: {
  view: PlayerView;
  actions: LegalAction[];
  disabled: boolean;
  onAction(action: LegalAction): void;
}) {
  const t = useTranslations("Board.scoreArea");
  const locale = useLocale();
  const cardPresentationsById = useCatalogCardPresentations();
  const entries = actions.flatMap((action) => {
    if (
      action.side !== "corp" ||
      !["activated_card_ability", "trigger_ability", "gain_credit"].includes(
        action.type,
      )
    )
      return [];
    const card = view.own.scoreArea.find(
      (card) => card.known && card.instanceId === action.source,
    );
    if (!card?.title) return [];
    const amount = action.payload?.hostedCreditTakeAmount;
    const takesHostedCredits =
      action.payload?.cardImplementationTakesHostedCredits === true &&
      typeof amount === "number" &&
      amount > 0;
    const label = takesHostedCredits
      ? t("takeHostedCredits", { amount, card: card.title })
      : actionButtonLabel(action, cardPresentationsById, locale, card);
    const stored = card.counters?.bit;
    const tooltipLabel =
      takesHostedCredits && stored !== undefined
        ? t("hostedCreditsHelp", { label, amount: stored, card: card.title })
        : undefined;
    return (
      <OverflowAwareActionButton
        action={action}
        agendaIcon
        className="button actionButton primary"
        key={action.actionId}
        label={label}
        {...(tooltipLabel ? { tooltipLabel } : {})}
        tone={actionButtonTone(view, action)}
        onClick={() => onAction(action)}
        disabled={disabled}
        data-testid="scored-agenda-action"
        data-action-type={action.type}
      />
    );
  });

  return entries.length > 0 ? <div className="actions">{entries}</div> : null;
}
