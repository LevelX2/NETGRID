import type { AiDecisionInput } from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import type { StrategicIntentFamily } from "../strategic-intent-state";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function corpVisibleHandHasTagDamagePair(
  input: AiDecisionInput,
): boolean {
  const hints = input.playerView.own.gripOrHq
    .map((card) =>
      card.definitionId ? AI_HINTS_BY_CARD.get(card.definitionId) : undefined,
    )
    .filter((hint) => hint !== undefined);
  const hasTagSource = hints.some((hint) =>
    (hint.effects ?? []).some((effect) => effect.kind === "tag_source"),
  );
  const hasDamagePayoff = hints.some((hint) =>
    (hint.effects ?? []).some(
      (effect) =>
        effect.kind === "tag_punish_payoff" || effect.kind === "damage",
    ),
  );
  return hasTagSource && hasDamagePayoff;
}

export function corpStrategicKillLineFundingActive(
  input: AiDecisionInput,
  familyOverride?: StrategicIntentFamily,
): boolean {
  const family =
    familyOverride ??
    (input as AiDecisionInputWithDeckCapabilities).ownStrategicIntentState
      ?.primaryStrategy.family;
  return (
    (family === "corp_tag_trace_punish" || family === "corp_damage_kill") &&
    corpVisibleHandHasTagDamagePair(input)
  );
}
