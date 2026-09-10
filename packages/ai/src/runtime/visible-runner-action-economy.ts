import type { AiDecisionInput } from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function visibleRunnerExposureCreditValue(
  input: AiDecisionInput,
  creditActions: number,
): number {
  if (creditActions <= 0) return 0;
  const bestVisibleCreditAction = (input.playerView.opponent.rig ?? []).reduce(
    (best, card) => {
      if (card.known === false || !card.definitionId) return best;
      const hint = AI_HINTS_BY_CARD.get(card.definitionId);
      const amount = hint?.effects
        ?.filter(
          (effect) =>
            effect.timing === "action" &&
            effect.resource === "credits" &&
            (effect.kind === "economy" || effect.kind === "action_economy"),
        )
        .reduce((maximum, effect) => Math.max(maximum, effect.amount ?? 0), 0);
      return Math.max(best, amount ?? 0);
    },
    1,
  );
  return creditActions * bestVisibleCreditAction;
}
