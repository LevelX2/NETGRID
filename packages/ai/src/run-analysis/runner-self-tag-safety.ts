import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import type { RunActionProjection } from "./runner-run-target-types";

/** A safety fact for the existing run quote, never an action chooser. */
export function runnerPostRunSelfTagHandSafety(params: {
  input: AiDecisionInput;
  projection: RunActionProjection;
  handAfterAction: number;
  clicksAfterRun: number;
  creditsAfterRun: number;
  preservesAgendaAccess: boolean;
}): string | undefined {
  const { input, projection } = params;
  if (
    projection.accessReplacementRequiresCorpCredits === true &&
    input.playerView.opponent.credits <= 0
  )
    return undefined;
  const tags = projection.successfulRunSelfTags ?? 0;
  if (tags <= 0 || params.clicksAfterRun > 0 || params.preservesAgendaAccess)
    return undefined;
  const threat = runnerDamageThreatAssessment(input, params.handAfterAction);
  if (
    threat.deckBelief.visibleDamagePayoffCount === 0 ||
    !["confirmed", "critical"].includes(threat.flatlineRisk.level) ||
    params.handAfterAction >= threat.flatlineRisk.recommendedHandFloor
  )
    return undefined;

  // Only installed, canonical avoidance can remove this final-click liability.
  // A held card still needs an installation action before the run.
  const prices = (input.playerView.own.rig ?? [])
    .flatMap((card) => {
      if (!card.known || !card.definitionId) return [];
      const sources =
        cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
          .tagPreventionSources ?? [];
      return sources.flatMap((source) => {
        if (source.kind !== "avoid_tag" || source.amount !== 1) return [];
        const cost = source.cost;
        if (cost.kind === "credit_and_tap_source" && card.tapped) return [];
        return Array.from(
          { length: cost.kind === "credit" ? tags : 1 },
          () => ({
            card: card.instanceId,
            cost: cost.kind === "trash_source" ? 0 : cost.amount,
            repeatable: cost.kind === "credit",
          }),
        );
      });
    })
    .sort((a, b) => a.cost - b.cost);
  let remaining = tags;
  let money = params.creditsAfterRun;
  const used = new Set<string>();
  for (const price of prices) {
    if (remaining === 0) break;
    if ((!price.repeatable && used.has(price.card)) || price.cost > money)
      continue;
    money -= price.cost;
    remaining--;
    if (!price.repeatable) used.add(price.card);
  }
  if (remaining === 0) return undefined;
  return [
    "runner_post_run_self_tag_hand_buffer_unrecoverable",
    `tags:${tags}`,
    `unavoided_tags:${remaining}`,
    `hand_after_action:${params.handAfterAction}`,
    `required_floor:${threat.flatlineRisk.recommendedHandFloor}`,
    "remaining_clicks:0",
    "punish_evidence:observed_definition_not_secret_hand",
  ].join("|");
}
